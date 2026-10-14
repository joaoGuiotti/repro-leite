import { AppError, appError, err, ok, Result } from '@core/result';
import { generateId } from '@core/utils/id';
import { TransactionRunner } from '@core/db/transaction';
import { CalvesOutboxEnqueuer, CalvesRepository } from '../domain/calves.repository';
import { CreateWeighingDTO } from '../domain/calves.types';

export interface RecordWeighingInput {
  farmId: string;
  animalId: string;
  weightKg: number;
  date: string; // YYYY-MM-DD
  notes?: string | null;
}

export interface RecordWeighingResult {
  id: string;
  weightKg: number;
  date: string;
}

export class RecordWeighingUseCase {
  constructor(
    private repo: CalvesRepository,
    private outbox: CalvesOutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(
    input: RecordWeighingInput
  ): Promise<Result<RecordWeighingResult, AppError>> {
    if (!input.farmId) {
      return err(appError('INVALID_FARM', 'Identificador da fazenda é obrigatório.'));
    }
    if (!input.animalId) {
      return err(appError('INVALID_ANIMAL', 'Identificador do animal é obrigatório.'));
    }
    if (typeof input.weightKg !== 'number' || input.weightKg <= 0 || isNaN(input.weightKg)) {
      return err(appError('INVALID_WEIGHT', 'O peso aferido deve ser maior que zero kg.'));
    }
    if (!input.date || input.date.trim().length !== 10) {
      return err(appError('INVALID_DATE', 'Data da pesagem em formato inválido (YYYY-MM-DD).'));
    }

    const animal = await this.repo.findCalfById(input.animalId);
    if (!animal) {
      return err(appError('CALF_NOT_FOUND', 'Animal não encontrado no rebanho.'));
    }

    // A data da pesagem não pode ser anterior ao nascimento
    if (input.date < animal.birthDate) {
      return err(
        appError(
          'INVALID_WEIGHING_DATE',
          `Data da pesagem (${input.date}) não pode ser anterior ao nascimento do animal (${animal.birthDate}).`
        )
      );
    }

    const weighingId = generateId();
    const nowIso = new Date().toISOString();

    const weighingDto: CreateWeighingDTO = {
      id: weighingId,
      farmId: input.farmId,
      animalId: input.animalId,
      date: input.date,
      weightKg: input.weightKg,
      notes: input.notes?.trim() || null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await this.tx.run(async () => {
        await this.repo.saveWeighing(weighingDto);
        await this.outbox.enqueue(
          input.farmId,
          'weighings',
          weighingId,
          'INSERT',
          weighingDto as unknown as Record<string, unknown>
        );
      });

      return ok({
        id: weighingId,
        weightKg: input.weightKg,
        date: input.date,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao salvar pesagem.';
      return err(appError('DB_ERROR', msg));
    }
  }
}
