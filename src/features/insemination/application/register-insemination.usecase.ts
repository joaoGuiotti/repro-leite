import { AppError, appError, err, ok, Result } from '@core/result';
import { generateId } from '@core/utils/id';
import { TransactionRunner } from '@core/db/transaction';
import { AnimalRepository } from '@features/herd';
import { BullRepository } from '@features/bulls';
import {
  CreateInseminationDTO,
  InseminationRecord,
} from '../domain/insemination.entity';
import { calculateReproductiveMilestones } from '../domain/milestones';
import { InseminationRepository } from '../domain/insemination.repository';

export interface OutboxEnqueuer {
  enqueue(
    farmId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payloadJson?: Record<string, unknown> | null
  ): Promise<void>;
}

export interface AlertCreator {
  create(data: {
    farmId: string;
    targetAnimalId: string;
    type: 'heat_check_21d' | 'pregnancy_check_45d' | 'calving_due' | 'dry_off';
    dueDate: string;
    sourceId?: string | null;
    notes?: string | null;
  }): Promise<unknown>;
}

export class RegisterInseminationUseCase {
  constructor(
    private repo: InseminationRepository,
    private animalRepo: AnimalRepository,
    private bullRepo: BullRepository,
    private alertRepo: AlertCreator,
    private outbox: OutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(
    farmId: string,
    dto: CreateInseminationDTO
  ): Promise<Result<InseminationRecord, AppError>> {
    if (!dto.animalId) {
      return err(appError('INVALID_ANIMAL', 'Selecione a fêmea a ser inseminada.'));
    }
    if (!dto.bullName || !dto.bullName.trim()) {
      return err(appError('INVALID_BULL', 'O nome do reprodutor/touro é obrigatório.'));
    }
    if (!dto.date) {
      return err(appError('INVALID_DATE', 'A data da inseminação é obrigatória.'));
    }
    if (!dto.inseminator || !dto.inseminator.trim()) {
      return err(appError('INVALID_INSEMINATOR', 'O nome do inseminador é obrigatório.'));
    }

    const animal = await this.animalRepo.findById(dto.animalId);
    if (!animal) {
      return err(appError('ANIMAL_NOT_FOUND', 'Animal não encontrado no rebanho.'));
    }
    if (animal.sex !== 'femea') {
      return err(appError('INVALID_ANIMAL_SEX', 'Apenas fêmeas podem ser inseminadas.'));
    }
    if (animal.exitStatus !== 'ativo') {
      return err(appError('ANIMAL_INACTIVE', 'Não é possível inseminar animal inativo.'));
    }

    // Se touro do catálogo foi selecionado, valida estoque
    if (dto.bullId) {
      const bull = await this.bullRepo.findById(dto.bullId);
      if (!bull) {
        return err(appError('BULL_NOT_FOUND', 'Touro selecionado não encontrado no catálogo.'));
      }
      if (bull.strawsInStock <= 0) {
        return err(appError('INSUFFICIENT_STRAWS', 'Estoque de doses do touro selecionado está zerado.'));
      }
    }

    const id = generateId();
    const now = new Date().toISOString();
    const milestones = calculateReproductiveMilestones(dto.date);

    const insemination: InseminationRecord = {
      id,
      farmId,
      animalId: dto.animalId,
      bullId: dto.bullId ?? null,
      bullName: dto.bullName.trim(),
      date: dto.date,
      inseminator: dto.inseminator.trim(),
      expectedHeatDate: milestones.expectedHeatDate,
      pregnancyCheckDate: milestones.pregnancyCheckDate,
      expectedCalvingDate: milestones.expectedCalvingDate,
      dryOffDate: milestones.dryOffDate,
      result: 'pendente',
      notes: dto.notes ? dto.notes.trim() : null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    try {
      await this.tx.run(async () => {
        // 1. Grava inseminação
        await this.repo.save(insemination);
        await this.outbox.enqueue(
          farmId,
          'inseminations',
          id,
          'INSERT',
          insemination as unknown as Record<string, unknown>
        );

        // 2. Atualiza status reprodutivo da fêmea para 'inseminada'
        const updatedAnimal = await this.animalRepo.update(dto.animalId, {
          reproStatus: 'inseminada',
        });
        await this.outbox.enqueue(
          farmId,
          'animals',
          dto.animalId,
          'UPDATE',
          updatedAnimal as unknown as Record<string, unknown>
        );

        // 3. Debita 1 dose do touro
        if (dto.bullId) {
          const updatedBull = await this.bullRepo.adjustStraws(dto.bullId, -1);
          await this.outbox.enqueue(
            farmId,
            'bulls',
            dto.bullId,
            'UPDATE',
            updatedBull as unknown as Record<string, unknown>
          );
        }

        // 4. Cria alertas zootécnicos automáticos
        await this.alertRepo.create({
          farmId,
          targetAnimalId: dto.animalId,
          type: 'heat_check_21d',
          dueDate: milestones.expectedHeatDate,
          sourceId: id,
          notes: `Vigiar retorno de cio pós-IA com ${dto.bullName.trim()}`,
        });

        await this.alertRepo.create({
          farmId,
          targetAnimalId: dto.animalId,
          type: 'pregnancy_check_45d',
          dueDate: milestones.pregnancyCheckDate,
          sourceId: id,
          notes: `Exame de toque veterinário pós-IA com ${dto.bullName.trim()}`,
        });
      });

      return ok(insemination);
    } catch (e: any) {
      return err(
        appError('SAVE_FAILED', e.message || 'Falha ao registrar inseminação.')
      );
    }
  }
}
