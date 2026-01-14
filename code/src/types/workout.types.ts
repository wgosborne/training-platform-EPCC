export enum WorkoutTypeEnum {
  EASY = 'EASY',
  TEMPO = 'TEMPO',
  LONG = 'LONG',
  SPEED = 'SPEED',
  RECOVERY = 'RECOVERY',
  CROSS_TRAINING = 'CROSS_TRAINING',
  REST = 'REST',
}

export interface CreateWorkoutInput {
  scheduled_date?: string | null; // YYYY-MM-DD format, optional
  distance: number;
  target_pace: number; // seconds per mile
  workout_type: WorkoutTypeEnum;
  description?: string | null;
}

export interface UpdateWorkoutInput {
  scheduled_date?: string | null;
  distance?: number;
  target_pace?: number;
  workout_type?: WorkoutTypeEnum;
  description?: string | null;
}

export interface WorkoutEntity {
  id: string;
  plan_id: string;
  scheduled_date: string | null;
  distance: string;
  target_pace: number;
  workout_type: WorkoutTypeEnum;
  description: string | null;
  created_at: string;
  updated_at: string;
}
