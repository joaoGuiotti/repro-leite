export interface BullRecord {
  id: string;
  farmId: string;
  name: string;
  breed: string;
  code: string | null;
  strawsInStock: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

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

export interface AdjustBullStrawsDTO {
  bullId: string;
  delta: number;
}
