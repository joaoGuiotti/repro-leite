import { AppError, appError, err, ok, Result } from '@core/result';
import { generateId } from '@core/utils/id';
import { TransactionRunner } from '@core/db/transaction';
import { CalvesOutboxEnqueuer, CalvesRepository } from '../domain/calves.repository';
import { DEFAULT_BIRTH_WEIGHT_KG } from '../domain/calves.types';

export interface RegisterCalfInput {
  farmId: string;
  earTag: string;
  name?: string | null;
  sex: 'femea' | 'macho';
  breed?: string;
  birthDate: string; // YYYY-MM-DD
  birthWeightKg?: number;
  sireId?: string | null;
  sireName?: string | null;
  damId?: string | null;
  damName?: string | null;
  maternalGranddamName?: string | null;
  notes?: string | null;
}

export interface RegisterCalfResult {
  id: string;
  earTag: string;
}

export class RegisterCalfUseCase {
  constructor(
    private repo: CalvesRepository,
    private outbox: CalvesOutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(
    input: RegisterCalfInput
  ): Promise<Result<RegisterCalfResult, AppError>> {
    if (!input.farmId) {
      return err(appError('INVALID_FARM', 'Identificador da fazenda é obrigatório.'));
    }
    const earTagClean = input.earTag?.trim();
    if (!earTagClean) {
      return err(appError('INVALID_EAR_TAG', 'Número do brinco é obrigatório.'));
    }
    if (!input.birthDate) {
      return err(appError('INVALID_BIRTH_DATE', 'Data de nascimento é obrigatória.'));
    }

    const earTagNormalized = earTagClean.toLowerCase();

    // Valida se o brinco já está em uso por outro animal ativo na fazenda
    const existing = await this.repo.findByEarTag(input.farmId, earTagNormalized);
    if (existing) {
      return err(
        appError(
          'EAR_TAG_ALREADY_EXISTS',
          `Já existe um animal ativo com o brinco "${earTagClean}" nesta fazenda.`
        )
      );
    }

    const now = new Date().toISOString();
    const id = generateId();
    const birthWeightKg =
      input.birthWeightKg !== undefined &&
      input.birthWeightKg !== null &&
      !isNaN(input.birthWeightKg)
        ? Number(input.birthWeightKg)
        : DEFAULT_BIRTH_WEIGHT_KG;

    const calfData = {
      id,
      farmId: input.farmId,
      earTag: earTagClean,
      earTagNormalized,
      name: input.name?.trim() || null,
      breed: input.breed?.trim() || 'Girolando',
      sex: input.sex || 'femea',
      birthDate: input.birthDate,
      birthWeightKg,
      lifeStage: 'bezerra' as const,
      reproStatus: 'vazia',
      exitStatus: 'ativo',
      sireId: input.sireId || null,
      sireName: input.sireName?.trim() || null,
      damId: input.damId || null,
      damName: input.damName?.trim() || null,
      maternalGrandsireName: input.maternalGranddamName?.trim() || null,
      notes: input.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    return this.tx.run(async () => {
      await this.repo.saveCalf(calfData);
      await this.outbox.enqueue(
        input.farmId,
        'animals',
        id,
        'INSERT',
        calfData as unknown as Record<string, unknown>
      );

      return ok({
        id,
        earTag: earTagClean,
      });
    });
  }
}
