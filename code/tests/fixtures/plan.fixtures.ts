import { Plan } from '@prisma/client';
import { CreatePlanInput } from '@/types/plan.types';

export const createMockPlanInput = (overrides?: Partial<CreatePlanInput>): CreatePlanInput => ({
  name: 'Test Plan',
  description: 'A test training plan',
  start_date: '2025-02-01',
  end_date: '2025-04-27',
  status: 'DRAFT',
  ...overrides,
});

export const createMockPlan = (overrides?: Partial<Plan>): Plan => ({
  id: 'test-plan-id-1',
  name: 'Test Plan',
  description: 'A test training plan',
  startDate: new Date('2025-02-01'),
  endDate: new Date('2025-04-27'),
  status: 'DRAFT',
  createdAt: new Date('2026-01-14T10:00:00Z'),
  updatedAt: new Date('2026-01-14T10:00:00Z'),
  ...overrides,
});

export const createMockPlanWithId = (id: string, overrides?: Partial<Plan>): Plan => {
  return createMockPlan({ id, ...overrides });
};

export const mockPlans: Plan[] = [
  createMockPlan({
    id: 'plan-1',
    name: 'St. Jude Half Marathon 2025',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-04-27'),
  }),
  createMockPlan({
    id: 'plan-2',
    name: 'Local 5K Race 2025',
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-05-31'),
    status: 'DRAFT',
  }),
];
