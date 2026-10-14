import { AppError, appError, err, ok, Result } from '@core/result';
import { generateId } from '@core/utils/id';
import { TransactionRunner } from '@core/db/transaction';
import { AnimalRecord, CreateAnimalDTO } from '../domain/animal.entity';
import { AnimalRepository } from '../domain/animal.repository';
import { normalizeEarTag } from '../domain/ear-tag';

export interface OutboxEnqueuer {
  enqueue(
    farmId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payloadJson?: Record<string, unknown> | null
  ): Promise<void>;
}

export class RegisterAnimalUseCase {
  constructor(
    private repo: AnimalRepository,
    private outbox: OutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(input: CreateAnimalDTO): Promise<Result<AnimalRecord, AppError>> {
    const earTagNormalized = normalizeEarTag(input.earTag);
    if (!earTagNormalized) {
      return err(appError('INVALID_EAR_TAG', 'O brinco do animal é obrigatório.'));
    }

    if (!input.breed || !input.breed.trim()) {
      return err(appError('INVALID_BREED', 'A raça do animal é obrigatória.'));
    }

    // Valida disponibilidade do brinco entre animais ativos
    const existingActive = await this.repo.findByEarTag(input.farmId, earTagNormalized, true);
    if (existingActive) {
      return err(
        appError(
          'EAR_TAG_ALREADY_IN_USE',
          `Brinco ${input.earTag.trim()} já está em uso por outro animal ativo.`
        )
      );
    }

    const now = new Date().toISOString();
    const id = generateId();

    // Se for macho, status reprodutivo é 'nao_se_aplica'
    const reproStatus =
      input.sex === 'macho' ? 'nao_se_aplica' : (input.reproStatus ?? 'vazia');

    const animal: AnimalRecord = {
      id,
      farmId: input.farmId,
      earTag: input.earTag.trim(),
      earTagNormalized,
      name: input.name ? input.name.trim() : null,
      breed: input.breed.trim(),
      sex: input.sex,
      birthDate: input.birthDate,
      birthWeightKg: input.birthWeightKg ?? 40.0,
      lifeStage: input.lifeStage ?? 'adulta',
      reproStatus,
      exitStatus: 'ativo',
      exitDate: null,
      exitReason: null,
      sireId: input.sireId ?? null,
      sireName: input.sireName ?? null,
      damId: input.damId ?? null,
      damName: input.damName ?? null,
      maternalGrandsireName: input.maternalGrandsireName ?? null,
      paternalGrandsireName: input.paternalGrandsireName ?? null,
      notes: input.notes ? input.notes.trim() : null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    try {
      await this.tx.run(async () => {
        await this.repo.save(animal);
        await this.outbox.enqueue(
          animal.farmId,
          'animals',
          animal.id,
          'INSERT',
          animal as unknown as Record<string, unknown>
        );
      });
      return ok(animal);
    } catch (e: any) {
      return err(appError('SAVE_FAILED', e.message || 'Falha ao salvar animal no banco.'));
    }
  }
}
