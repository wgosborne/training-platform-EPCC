import { Plan, Workout, Run } from '@prisma/client';

export interface PlanDTO {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutDTO {
  id: string;
  plan_id: string;
  scheduled_date: string | null;
  distance: string;
  target_pace: number;
  workout_type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RunDTO {
  id: string;
  plan_id: string;
  workout_id: string | null;
  actual_date: string;
  distance: string;
  actual_pace: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export function mapPlan(plan: Plan): PlanDTO {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    start_date: plan.startDate.toISOString().split('T')[0],
    end_date: plan.endDate.toISOString().split('T')[0],
    status: plan.status,
    created_at: plan.createdAt.toISOString(),
    updated_at: plan.updatedAt.toISOString(),
  };
}

export function mapWorkout(workout: Workout): WorkoutDTO {
  return {
    id: workout.id,
    plan_id: workout.planId,
    scheduled_date: workout.scheduledDate
      ? workout.scheduledDate.toISOString().split('T')[0]
      : null,
    distance: workout.distance.toString(),
    target_pace: workout.targetPace,
    workout_type: workout.workoutType,
    description: workout.description,
    created_at: workout.createdAt.toISOString(),
    updated_at: workout.updatedAt.toISOString(),
  };
}

export function mapRun(run: Run): RunDTO {
  return {
    id: run.id,
    plan_id: run.planId,
    workout_id: run.workoutId,
    actual_date: run.actualDate.toISOString().split('T')[0],
    distance: run.distance.toString(),
    actual_pace: run.actualPace,
    source: run.source,
    created_at: run.createdAt.toISOString(),
    updated_at: run.updatedAt.toISOString(),
  };
}
