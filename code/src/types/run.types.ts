export enum SourceEnum {
  MANUAL = 'MANUAL',
  STRAVA = 'STRAVA',
}

export interface CreateRunInput {
  workout_id?: string | null;
  actual_date: string; // YYYY-MM-DD format
  distance: number;
  actual_pace: number; // seconds per mile
  source?: SourceEnum;
}

export interface UpdateRunInput {
  workout_id?: string | null;
  actual_date?: string;
  distance?: number;
  actual_pace?: number;
  source?: SourceEnum;
}

export interface RunEntity {
  id: string;
  plan_id: string;
  workout_id: string | null;
  actual_date: string;
  distance: string;
  actual_pace: number;
  source: SourceEnum;
  created_at: string;
  updated_at: string;
}
