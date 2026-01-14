import { Run } from '@prisma/client';
import { CreateRunInput } from '@/types/run.types';

export const createMockRunInput = (overrides?: Partial<CreateRunInput>): CreateRunInput => ({
  workout_id: 'test-workout-id-1',
  actual_date: '2025-02-03',
  distance: 5.2,
  actual_pace: 361,
  source: 'MANUAL',
  ...overrides,
});

export const createMockRun = (
  planId: string,
  workoutId?: string | null,
  overrides?: Partial<Run>,
): Run => ({
  id: 'test-run-id-1',
  planId,
  workoutId: workoutId ?? null,
  actualDate: new Date('2025-02-03'),
  distance: 5.2,
  actualPace: 361,
  source: 'MANUAL',
  createdAt: new Date('2026-01-14T10:10:00Z'),
  updatedAt: new Date('2026-01-14T10:10:00Z'),
  ...overrides,
});

export const createMockRunWithId = (id: string, planId: string, workoutId?: string | null, overrides?: Partial<Run>): Run => {
  return createMockRun(planId, workoutId, { id, ...overrides });
};

export const mockRuns = (planId: string): Run[] => [
  createMockRun(planId, 'workout-1', {
    id: 'run-1',
    actualDate: new Date('2025-02-03'),
    distance: 5.2,
    actualPace: 361,
  }),
  createMockRun(planId, null, {
    id: 'run-2',
    actualDate: new Date('2025-02-04'),
    distance: 3.0,
    actualPace: 420,
    workoutId: null,
  }),
];
