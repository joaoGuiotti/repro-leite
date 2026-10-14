export type ConflictResolutionAction = 'apply_remote' | 'keep_local' | 'merge';

export interface ConflictResolutionResult {
  action: ConflictResolutionAction;
  resolvedRecord: Record<string, unknown>;
}

export class ConflictResolver {
  /**
   * Resolve o conflito entre um registro existente no banco local e uma alteração vinda do servidor remoto.
   */
  static resolve(
    tableName: string,
    localRecord: Record<string, unknown> | null | undefined,
    remoteRecord: Record<string, unknown>
  ): ConflictResolutionResult {
    // 1. Se não existir localmente, o registro remoto é sempre aplicado
    if (!localRecord) {
      return {
        action: 'apply_remote',
        resolvedRecord: { ...remoteRecord },
      };
    }

    // 2. Tabela farms: Server-Wins absoluto (segurança e limites de plano)
    if (tableName === 'farms') {
      return {
        action: 'apply_remote',
        resolvedRecord: { ...remoteRecord },
      };
    }

    // 3. Tabela alerts: Merge com precedência de conclusão
    if (tableName === 'alerts') {
      return this.resolveAlertConflict(localRecord, remoteRecord);
    }

    // 4. Tabela bulls: LWW para cadastro, preservação de estoque de doses local
    if (tableName === 'bulls') {
      return this.resolveBullConflict(localRecord, remoteRecord);
    }

    // 5. Entidades gerais (animals, inseminations, settings): Last-Write-Wins (LWW)
    return this.resolveLWW(localRecord, remoteRecord);
  }

  private static resolveLWW(
    localRecord: Record<string, unknown>,
    remoteRecord: Record<string, unknown>
  ): ConflictResolutionResult {
    const localUpdatedAt = this.getTimestamp(localRecord.updated_at ?? localRecord.updatedAt);
    const remoteUpdatedAt = this.getTimestamp(remoteRecord.updated_at ?? remoteRecord.updatedAt);

    // Se o remoto for mais recente, o remoto vence
    if (remoteUpdatedAt > localUpdatedAt) {
      return {
        action: 'apply_remote',
        resolvedRecord: { ...remoteRecord },
      };
    }

    // Caso contrário, mantemos o local (que tem alterações mais recentes ou iguais)
    return {
      action: 'keep_local',
      resolvedRecord: { ...localRecord },
    };
  }

  private static resolveAlertConflict(
    localRecord: Record<string, unknown>,
    remoteRecord: Record<string, unknown>
  ): ConflictResolutionResult {
    const localCompletedAt = localRecord.completed_at ?? localRecord.completedAt;
    const remoteCompletedAt = remoteRecord.completed_at ?? remoteRecord.completedAt;

    // Se qualquer um estiver concluído, o status de conclusão tem precedência
    if (localCompletedAt || remoteCompletedAt) {
      const winnerCompletedAt = localCompletedAt ?? remoteCompletedAt;
      const lww = this.resolveLWW(localRecord, remoteRecord);
      return {
        action: 'merge',
        resolvedRecord: {
          ...lww.resolvedRecord,
          completed_at: winnerCompletedAt,
          completedAt: winnerCompletedAt,
        },
      };
    }

    return this.resolveLWW(localRecord, remoteRecord);
  }

  private static resolveBullConflict(
    localRecord: Record<string, unknown>,
    remoteRecord: Record<string, unknown>
  ): ConflictResolutionResult {
    const lww = this.resolveLWW(localRecord, remoteRecord);

    if (lww.action === 'apply_remote') {
      // Preserva o estoque de doses local se houver movimentações pendentes
      const localStraws = localRecord.straws_in_stock ?? localRecord.strawsInStock;
      const remoteStraws = remoteRecord.straws_in_stock ?? remoteRecord.strawsInStock;

      if (localStraws !== undefined && localStraws !== remoteStraws) {
        return {
          action: 'merge',
          resolvedRecord: {
            ...remoteRecord,
            straws_in_stock: localStraws,
            strawsInStock: localStraws,
          },
        };
      }
    }

    return lww;
  }

  private static getTimestamp(val: unknown): number {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = Date.parse(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (val instanceof Date) return val.getTime();
    return 0;
  }
}
