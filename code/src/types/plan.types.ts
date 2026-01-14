export enum PlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface CreatePlanInput {
  name: string;
  description?: string | null;
  start_date: string; // YYYY-MM-DD format
  end_date: string; // YYYY-MM-DD format
  status?: PlanStatus;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string | null;
  start_date?: string;
  end_date?: string;
  status?: PlanStatus;
}

export interface PlanEntity {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: PlanStatus;
  created_at: string;
  updated_at: string;
}
