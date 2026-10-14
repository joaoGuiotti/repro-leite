# Interface Contract: Catálogo de Touros (`BullRepository` & Estoque de Sêmen)

**Feature Branch**: `001-rebanho-e-touros`  
**Date**: 2026-10-14  

---

## 1. Motores de Domínio Puro (`src/domain/bullStock.ts`)

```typescript
/**
 * Ajusta a contagem de doses de sêmen em estoque.
 * Lança erro caso o resultado final seja negativo.
 */
export function adjustBullStock(currentStraws: number, delta: number): number;

/**
 * Valida se um touro possui doses disponíveis para inseminação.
 */
export function hasAvailableStraws(strawsInStock: number): boolean;
```

---

## 2. Contrato do Repositório (`BullRepository`)

```typescript
export interface CreateBullDTO {
  farmId: string;
  name: string;
  breed: string;
  code?: string | null;
  strawsInStock?: number;
  notes?: string | null;
}

export interface UpdateBullDTO {
  name?: string;
  breed?: string;
  code?: string | null;
  notes?: string | null;
}

export interface BullRepository {
  listByFarm(farmId: string): Promise<BullRecord[]>;
  findById(id: string): Promise<BullRecord | null>;
  create(data: CreateBullDTO): Promise<BullRecord>;
  update(id: string, data: UpdateBullDTO): Promise<BullRecord>;
  adjustStraws(id: string, delta: number): Promise<BullRecord>;
  setStraws(id: string, newCount: number): Promise<BullRecord>;
  softDelete(id: string): Promise<void>;
}
```
