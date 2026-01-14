import { Workout } from '@prisma/client';
import { CreateWorkoutInput } from '@/types/workout.types';

export const createMockWorkoutInput = (overrides?: Partial<CreateWorkoutInput>): CreateWorkoutInput => ({
  scheduled_date: '2025-02-03',
  distance: 5.2,
  target_pace: 360,
  workout_type: 'EASY',
  description: 'Easy 5-miler to start the week',
  ...overrides,
});

export const createMockWorkout = (
  planId: string,
  overrides?: Partial<Workout>,
): Workout => ({
  id: 'test-workout-id-1',
  planId,
  scheduledDate: new Date('2025-02-03'),
  distance: 5.2,
  targetPace: 360,
  workoutType: 'EASY',
  description: 'Easy 5-miler to start the week',
  createdAt: new Date('2026-01-14T10:05:00Z'),
  updatedAt: new Date('2026-01-14T10:05:00Z'),
  ...overrides,
});

export const createMockWorkoutWithId = (id: string, planId: string, overrides?: Partial<Workout>): Workout => {
  return createMockWorkout(planId, { id, ...overrides });
};

export const mockWorkouts = (planId: string): Workout[] => [
  createMockWorkout(planId, {
    id: 'workout-1',
    scheduledDate: new Date('2025-02-03'),
    distance: 5.2,
    workoutType: 'EASY',
  }),
  createMockWorkout(planId, {
    id: 'workout-2',
    scheduledDate: null,
    distance: 8.0,
    targetPace: 420,
    workoutType: 'LONG',
    description: 'Long run (to be scheduled)',
  }),
];
