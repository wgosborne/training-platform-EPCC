/**
 * Integration Tests for Runs API
 * Testing all CRUD operations and business logic for runs
 */

import { prisma } from '@/lib/utils/prisma';

// Helper function to make HTTP requests
async function makeRequest(
  method: string,
  path: string,
  body?: any,
): Promise<{ status: number; data: any }> {
  const baseUrl = 'http://localhost:3001';
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return { status: response.status, data };
}

describe('Runs API Integration Tests', () => {
  let planId: string;
  let workoutId: string;

  beforeAll(async () => {
    // Clean database
    await prisma.run.deleteMany({});
    await prisma.workout.deleteMany({});
    await prisma.plan.deleteMany({});

    // Create a test plan
    const { data: planData } = await makeRequest('POST', '/api/plans', {
      name: 'Run Test Plan',
      start_date: '2025-02-01',
      end_date: '2025-04-27',
    });
    planId = planData.data.id;

    // Create a test workout
    const { data: workoutData } = await makeRequest('POST', `/api/plans/${planId}/workouts`, {
      distance: 5.0,
      target_pace: 360,
      workout_type: 'EASY',
      scheduled_date: '2025-02-03',
    });
    workoutId = workoutData.data.id;
  });

  afterEach(async () => {
    await prisma.run.deleteMany({});
  });

  afterAll(async () => {
    await prisma.run.deleteMany({});
    await prisma.workout.deleteMany({});
    await prisma.plan.deleteMany({});
  });

  describe('POST /api/plans/:id/runs - Create Run', () => {
    it('should create run linked to workout (201)', async () => {
      const runData = {
        workout_id: workoutId,
        actual_date: '2025-02-03',
        distance: 5.2,
        actual_pace: 361,
        source: 'MANUAL',
      };

      const { status, data } = await makeRequest('POST', `/api/plans/${planId}/runs`, runData);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        workout_id: workoutId,
        distance: '5.20',
        actual_pace: 361,
        source: 'MANUAL',
      });
      expect(data.data.id).toBeDefined();
    });

    it('should create unplanned run without workout_id', async () => {
      const runData = {
        actual_date: '2025-02-04',
        distance: 3.0,
        actual_pace: 420,
      };

      const { status, data } = await makeRequest('POST', `/api/plans/${planId}/runs`, runData);

      expect(status).toBe(201);
      expect(data.data.workout_id).toBeNull();
      expect(data.data.source).toBe('MANUAL'); // Default
    });

    it('should create multiple runs on same day', async () => {
      const run1 = {
        actual_date: '2025-02-05',
        distance: 3.0,
        actual_pace: 400,
      };

      const run2 = {
        actual_date: '2025-02-05',
        distance: 2.0,
        actual_pace: 380,
      };

      const { status: status1 } = await makeRequest('POST', `/api/plans/${planId}/runs`, run1);
      const { status: status2 } = await makeRequest('POST', `/api/plans/${planId}/runs`, run2);

      expect(status1).toBe(201);
      expect(status2).toBe(201);
    });

    it('should reject missing actual_date (400)', async () => {
      const runData = {
        distance: 5.0,
        actual_pace: 361,
      };

      const { status, data } = await makeRequest('POST', `/api/plans/${planId}/runs`, runData);

      expect(status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject distance < 0.1 (400)', async () => {
      const runData = {
        actual_date: '2025-02-03',
        distance: 0.05,
        actual_pace: 361,
      };

      const { status } = await makeRequest('POST', `/api/plans/${planId}/runs`, runData);

      expect(status).toBe(400);
    });

    it('should reject distance > 100 (400)', async () => {
      const runData = {
        actual_date: '2025-02-03',
        distance: 150,
        actual_pace: 361,
      };

      const { status } = await makeRequest('POST', `/api/plans/${planId}/runs`, runData);

      expect(status).toBe(400);
    });

    it('should reject actual_pace < 180 (400)', async () => {
      const runData = {
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 100,
      };

      const { status } = await makeRequest('POST', `/api/plans/${planId}/runs`, runData);

      expect(status).toBe(400);
    });

    it('should reject actual_pace > 3000 (400)', async () => {
      const runData = {
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 4000,
      };

      const { status } = await makeRequest('POST', `/api/plans/${planId}/runs`, runData);

      expect(status).toBe(400);
    });

    it('should accept STRAVA source', async () => {
      const runData = {
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
        source: 'STRAVA',
      };

      const { status, data } = await makeRequest('POST', `/api/plans/${planId}/runs`, runData);

      expect(status).toBe(201);
      expect(data.data.source).toBe('STRAVA');
    });

    it('should reject invalid source (400)', async () => {
      const runData = {
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
        source: 'INVALID_SOURCE',
      };

      const { status } = await makeRequest('POST', `/api/plans/${planId}/runs`, runData);

      expect(status).toBe(400);
    });

    it('should reject if workout_id does not exist in same plan (404)', async () => {
      // Create another plan with a workout
      const { data: otherPlanData } = await makeRequest('POST', '/api/plans', {
        name: 'Other Plan',
        start_date: '2025-05-01',
        end_date: '2025-06-01',
      });
      const otherPlanId = otherPlanData.data.id;

      const { data: otherWorkoutData } = await makeRequest(
        'POST',
        `/api/plans/${otherPlanId}/workouts`,
        {
          distance: 5.0,
          target_pace: 360,
          workout_type: 'EASY',
        },
      );
      const otherWorkoutId = otherWorkoutData.data.id;

      // Try to create run in first plan with workout from other plan
      const { status, data } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        workout_id: otherWorkoutId,
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
      });

      expect(status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');

      // Cleanup
      await makeRequest('DELETE', `/api/plans/${otherPlanId}`);
    });

    it('should return 404 if plan does not exist', async () => {
      const fakeId = 'clr0000000000000000fake0';

      const { status, data } = await makeRequest('POST', `/api/plans/${fakeId}/runs`, {
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
      });

      expect(status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/plans/:id/runs - List Runs', () => {
    it('should return empty array when no runs', async () => {
      const { status, data } = await makeRequest('GET', `/api/plans/${planId}/runs`);

      expect(status).toBe(200);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should return all runs for plan', async () => {
      // Create multiple runs
      await makeRequest('POST', `/api/plans/${planId}/runs`, {
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
      });
      await makeRequest('POST', `/api/plans/${planId}/runs`, {
        actual_date: '2025-02-04',
        distance: 3.0,
        actual_pace: 420,
      });

      const { status, data } = await makeRequest('GET', `/api/plans/${planId}/runs`);

      expect(status).toBe(200);
      expect(data.data.length).toBe(2);
    });

    it('should include null workout_id for unplanned runs', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        actual_date: '2025-02-05',
        distance: 2.0,
        actual_pace: 400,
      });

      const { data: listData } = await makeRequest('GET', `/api/plans/${planId}/runs`);

      const createdRun = listData.data.find((r: any) => r.id === createData.data.id);
      expect(createdRun.workout_id).toBeNull();
    });
  });

  describe('GET /api/plans/:id/runs/:runId - Get Single Run', () => {
    it('should return run by ID', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        actual_date: '2025-02-03',
        distance: 5.2,
        actual_pace: 361,
      });
      const runId = createData.data.id;

      const { status, data } = await makeRequest('GET', `/api/plans/${planId}/runs/${runId}`);

      expect(status).toBe(200);
      expect(data.data.id).toBe(runId);
      expect(data.data.distance).toBe('5.20');
    });

    it('should return 404 for non-existent run', async () => {
      const fakeId = 'clr0000000000000000fake0';

      const { status, data } = await makeRequest('GET', `/api/plans/${planId}/runs/${fakeId}`);

      expect(status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/plans/:id/runs/:runId - Update Run', () => {
    it('should update run with valid data', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
      });
      const runId = createData.data.id;

      const { status, data } = await makeRequest('PATCH', `/api/plans/${planId}/runs/${runId}`, {
        distance: 5.3,
        actual_pace: 362,
      });

      expect(status).toBe(200);
      expect(data.data.distance).toBe('5.30');
      expect(data.data.actual_pace).toBe(362);
    });

    it('should link run to workout', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
      });
      const runId = createData.data.id;

      const { status, data } = await makeRequest('PATCH', `/api/plans/${planId}/runs/${runId}`, {
        workout_id: workoutId,
      });

      expect(status).toBe(200);
      expect(data.data.workout_id).toBe(workoutId);
    });

    it('should unlink run from workout', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        workout_id: workoutId,
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
      });
      const runId = createData.data.id;

      const { status, data } = await makeRequest('PATCH', `/api/plans/${planId}/runs/${runId}`, {
        workout_id: null,
      });

      expect(status).toBe(200);
      expect(data.data.workout_id).toBeNull();
    });

    it('should update source', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
        source: 'MANUAL',
      });
      const runId = createData.data.id;

      const { status, data } = await makeRequest('PATCH', `/api/plans/${planId}/runs/${runId}`, {
        source: 'STRAVA',
      });

      expect(status).toBe(200);
      expect(data.data.source).toBe('STRAVA');
    });

    it('should allow partial updates', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
      });
      const runId = createData.data.id;

      const { status, data } = await makeRequest('PATCH', `/api/plans/${planId}/runs/${runId}`, {
        distance: 6.0,
      });

      expect(status).toBe(200);
      expect(data.data.distance).toBe('6.00');
      expect(data.data.actual_pace).toBe(361); // Unchanged
    });

    it('should reject invalid source in update', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
      });
      const runId = createData.data.id;

      const { status } = await makeRequest('PATCH', `/api/plans/${planId}/runs/${runId}`, {
        source: 'INVALID',
      });

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent run', async () => {
      const fakeId = 'clr0000000000000000fake0';

      const { status, data } = await makeRequest('PATCH', `/api/plans/${planId}/runs/${fakeId}`, {
        distance: 6.0,
      });

      expect(status).toBe(404);
    });
  });

  describe('DELETE /api/plans/:id/runs/:runId - Delete Run', () => {
    it('should delete run and return 204', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
      });
      const runId = createData.data.id;

      const { status } = await makeRequest('DELETE', `/api/plans/${planId}/runs/${runId}`);

      expect(status).toBe(204);

      // Verify it's gone
      const { status: getStatus } = await makeRequest('GET', `/api/plans/${planId}/runs/${runId}`);
      expect(getStatus).toBe(404);
    });

    it('should not affect associated workout when deleted', async () => {
      // Create run linked to workout
      const { data: runData } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        workout_id: workoutId,
        actual_date: '2025-02-03',
        distance: 5.0,
        actual_pace: 361,
      });
      const runId = runData.data.id;

      // Delete run
      await makeRequest('DELETE', `/api/plans/${planId}/runs/${runId}`);

      // Verify workout still exists
      const { status, data } = await makeRequest(
        'GET',
        `/api/plans/${planId}/workouts/${workoutId}`,
      );

      expect(status).toBe(200);
      expect(data.data.id).toBe(workoutId);
    });

    it('should return 404 for non-existent run', async () => {
      const fakeId = 'clr0000000000000000fake0';

      const { status, data } = await makeRequest('DELETE', `/api/plans/${planId}/runs/${fakeId}`);

      expect(status).toBe(404);
    });
  });
});
