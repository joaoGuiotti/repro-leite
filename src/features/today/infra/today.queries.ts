import { and, asc, eq, isNull } from 'drizzle-orm';
import { getDatabase } from '@core/db/client';
import { alerts, animals, inseminations } from '@core/db/schema';
import { differenceInDays, isOverdueDate } from '../domain/today-filters';
import { AlertWithReproDetails } from '../domain/today.types';

/**
 * Busca todos os alertas pendentes da fazenda enriquecidos com dados da vaca e da inseminação de origem.
 */
export async function getEnrichedPendingAlerts(
  farmId: string,
  referenceDate: string
): Promise<AlertWithReproDetails[]> {
  const db = getDatabase();

  const rows = await db
    .select({
      id: alerts.id,
      farmId: alerts.farmId,
      targetAnimalId: alerts.targetAnimalId,
      type: alerts.type,
      dueDate: alerts.dueDate,
      completedAt: alerts.completedAt,
      sourceId: alerts.sourceId,
      notes: alerts.notes,
      createdAt: alerts.createdAt,
      updatedAt: alerts.updatedAt,
      deletedAt: alerts.deletedAt,
      animalEarTag: animals.earTag,
      animalName: animals.name,
      bullName: inseminations.bullName,
      inseminationDate: inseminations.date,
    })
    .from(alerts)
    .innerJoin(animals, eq(alerts.targetAnimalId, animals.id))
    .leftJoin(inseminations, eq(alerts.sourceId, inseminations.id))
    .where(
      and(
        eq(alerts.farmId, farmId),
        isNull(alerts.completedAt),
        isNull(alerts.deletedAt),
        isNull(animals.deletedAt)
      )
    )
    .orderBy(asc(alerts.dueDate));

  return rows.map((r) => {
    const daysSinceInsemination = r.inseminationDate
      ? Math.max(0, differenceInDays(referenceDate, r.inseminationDate))
      : undefined;

    return {
      id: r.id,
      farmId: r.farmId,
      targetAnimalId: r.targetAnimalId,
      type: r.type as any,
      dueDate: r.dueDate,
      completedAt: r.completedAt,
      sourceId: r.sourceId,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      animalEarTag: r.animalEarTag,
      animalName: r.animalName,
      bullName: r.bullName,
      inseminationDate: r.inseminationDate,
      daysSinceInsemination,
      isOverdue: isOverdueDate(r.dueDate, referenceDate),
    };
  });
}
