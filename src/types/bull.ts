import { BaseEntity } from '@/db/schema/common';

export interface BullRecord extends BaseEntity {
  name: string;
  breed: string;
  code?: string | null;
  strawsInStock: number;
  notes?: string | null;
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
