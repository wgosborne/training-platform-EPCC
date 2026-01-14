/**
 * Integration Tests for Workouts API
 * Testing all CRUD operations and business logic for workouts
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

describe('Workouts API Integration Tests', () => {
  let planId: string;

  beforeAll(async () => {
    // Clean database
    await prisma.run.deleteMany({});
    await prisma.workout.deleteMany({});
    await prisma.plan.deleteMany({});

    // Create a test plan
    const { data } = await makeRequest('POST', '/api/plans', {
      name: 'Workout Test Plan',
      start_date: '2025-02-01',
      end_date: '2025-04-27',
    });
    planId = data.data.id;
  });

  afterEach(async () => {
    await prisma.workout.deleteMany({});
  });

  afterAll(async () => {
    await prisma.run.deleteMany({});
    await prisma.workout.deleteMany({});
    await prisma.plan.deleteMany({});
  });

  describe('POST /api/plans/:id/workouts - Create Workout', () => {
    it('should create workout with valid data (201)', async () => {
      const workoutData = {
        distance: 5.2,
        target_pace: 360,
        workout_type: 'EASY',
        description: 'Easy 5-miler',
        scheduled_date: '2025-02-03',
      };

      const { status, data } = await makeRequest(
        'POST',
        `/api/plans/${planId}/workouts`,
        workoutData,
      );

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        distance: '5.20',
        target_pace: 360,
        workout_type: 'EASY',
      });
      expect(data.data.id).toBeDefined();
    });

    it('should create unscheduled workout (scheduled_date = null)', async () => {
      const workoutData = {
        distance: 8.0,
        target_pace: 420,
        workout_type: 'LONG',
        description: 'Unscheduled long run',
      };

      const { status, data } = await makeRequest(
        'POST',
        `/api/plans/${planId}/workouts`,
        workoutData,
      );

      expect(status).toBe(201);
      expect(data.data.scheduled_date).toBeNull();
    });

    it('should reject missing distance (400)', async () => {
      const workoutData = {
        target_pace: 360,
        workout_type: 'EASY',
      };

      const { status, data } = await makeRequest(
        'POST',
        `/api/plans/${planId}/workouts`,
        workoutData,
      );

      expect(status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject distance < 0.1 (400)', async () => {
      const workoutData = {
        distance: 0.05,
        target_pace: 360,
        workout_type: 'EASY',
      };

      const { status, data } = await makeRequest(
        'POST',
        `/api/plans/${planId}/workouts`,
        workoutData,
      );

      expect(status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject distance > 100 (400)', async () => {
      const workoutData = {
        distance: 150,
        target_pace: 360,
        workout_type: 'EASY',
      };

      const { status, data } = await makeRequest(
        'POST',
        `/api/plans/${planId}/workouts`,
        workoutData,
      );

      expect(status).toBe(400);
    });

    it('should reject target_pace < 180 (400)', async () => {
      const workoutData = {
        distance: 5.0,
        target_pace: 100,
        workout_type: 'EASY',
      };

      const { status, data } = await makeRequest(
        'POST',
        `/api/plans/${planId}/workouts`,
        workoutData,
      );

      expect(status).toBe(400);
    });

    it('should reject target_pace > 3000 (400)', async () => {
      const workoutData = {
        distance: 5.0,
        target_pace: 4000,
        workout_type: 'EASY',
      };

      const { status, data } = await makeRequest(
        'POST',
        `/api/plans/${planId}/workouts`,
        workoutData,
      );

      expect(status).toBe(400);
    });

    it('should reject invalid workout_type (400)', async () => {
      const workoutData = {
        distance: 5.0,
        target_pace: 360,
        workout_type: 'INVALID_TYPE',
      };

      const { status, data } = await makeRequest(
        'POST',
        `/api/plans/${planId}/workouts`,
        workoutData,
      );

      expect(status).toBe(400);
    });

    it('should accept all valid workout types', async () => {
      const types = ['EASY', 'TEMPO', 'LONG', 'SPEED', 'RECOVERY', 'CROSS_TRAINING', 'REST'];

      for (const type of types) {
        const { status } = await makeRequest('POST', `/api/plans/${planId}/workouts`, {
          distance: 5.0,
          target_pace: 360,
          workout_type: type,
        });

        expect(status).toBe(201);
      }
    });

    it('should return 404 if plan does not exist', async () => {
      const fakeId = 'clr0000000000000000fake0';

      const { status, data } = await makeRequest('POST', `/api/plans/${fakeId}/workouts`, {
        distance: 5.0,
        target_pace: 360,
        workout_type: 'EASY',
      });

      expect(status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/plans/:id/workouts - List Workouts', () => {
    it('should return empty array when no workouts', async () => {
      const { status, data } = await makeRequest('GET', `/api/plans/${planId}/workouts`);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should return all workouts for plan', async () => {
      // Create multiple workouts
      await makeRequest('POST', `/api/plans/${planId}/workouts`, {
        distance: 5.0,
        target_pace: 360,
        workout_type: 'EASY',
      });
      await makeRequest('POST', `/api/plans/${planId}/workouts`, {
        distance: 8.0,
        target_pace: 420,
        workout_type: 'LONG',
      });

      const { status, data } = await makeRequest('GET', `/api/plans/${planId}/workouts`);

      expect(status).toBe(200);
      expect(data.data.length).toBe(2);
    });
  });

  describe('GET /api/plans/:id/workouts/:workoutId - Get Single Workout', () => {
    it('should return workout by ID', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/workouts`, {
        distance: 5.2,
        target_pace: 360,
        workout_type: 'EASY',
        description: 'Test workout',
      });
      const workoutId = createData.data.id;

      const { status, data } = await makeRequest(
        'GET',
        `/api/plans/${planId}/workouts/${workoutId}`,
      );

      expect(status).toBe(200);
      expect(data.data.id).toBe(workoutId);
      expect(data.data.description).toBe('Test workout');
    });

    it('should return 404 for non-existent workout', async () => {
      const fakeId = 'clr0000000000000000fake0';

      const { status, data } = await makeRequest(
        'GET',
        `/api/plans/${planId}/workouts/${fakeId}`,
      );

      expect(status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/plans/:id/workouts/:workoutId - Update Workout', () => {
    it('should update workout with valid data', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/workouts`, {
        distance: 5.0,
        target_pace: 360,
        workout_type: 'EASY',
      });
      const workoutId = createData.data.id;

      const { status, data } = await makeRequest(
        'PATCH',
        `/api/plans/${planId}/workouts/${workoutId}`,
        {
          distance: 5.5,
          target_pace: 365,
          workout_type: 'TEMPO',
        },
      );

      expect(status).toBe(200);
      expect(data.data.distance).toBe('5.50');
      expect(data.data.target_pace).toBe(365);
      expect(data.data.workout_type).toBe('TEMPO');
    });

    it('should allow partial updates', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/workouts`, {
        distance: 5.0,
        target_pace: 360,
        workout_type: 'EASY',
        description: 'Original description',
      });
      const workoutId = createData.data.id;

      const { status, data } = await makeRequest(
        'PATCH',
        `/api/plans/${planId}/workouts/${workoutId}`,
        {
          description: 'Updated description',
        },
      );

      expect(status).toBe(200);
      expect(data.data.description).toBe('Updated description');
      expect(data.data.workout_type).toBe('EASY'); // Unchanged
    });

    it('should unschedule workout by setting scheduled_date to null', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/workouts`, {
        distance: 5.0,
        target_pace: 360,
        workout_type: 'EASY',
        scheduled_date: '2025-02-03',
      });
      const workoutId = createData.data.id;

      const { status, data } = await makeRequest(
        'PATCH',
        `/api/plans/${planId}/workouts/${workoutId}`,
        {
          scheduled_date: null,
        },
      );

      expect(status).toBe(200);
      expect(data.data.scheduled_date).toBeNull();
    });

    it('should reject invalid workout_type in update', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/workouts`, {
        distance: 5.0,
        target_pace: 360,
        workout_type: 'EASY',
      });
      const workoutId = createData.data.id;

      const { status } = await makeRequest(
        'PATCH',
        `/api/plans/${planId}/workouts/${workoutId}`,
        {
          workout_type: 'INVALID',
        },
      );

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent workout', async () => {
      const fakeId = 'clr0000000000000000fake0';

      const { status, data } = await makeRequest(
        'PATCH',
        `/api/plans/${planId}/workouts/${fakeId}`,
        {
          distance: 6.0,
        },
      );

      expect(status).toBe(404);
    });
  });

  describe('DELETE /api/plans/:id/workouts/:workoutId - Delete Workout', () => {
    it('should delete workout and return 204', async () => {
      const { data: createData } = await makeRequest('POST', `/api/plans/${planId}/workouts`, {
        distance: 5.0,
        target_pace: 360,
        workout_type: 'EASY',
      });
      const workoutId = createData.data.id;

      const { status } = await makeRequest(
        'DELETE',
        `/api/plans/${planId}/workouts/${workoutId}`,
      );

      expect(status).toBe(204);

      // Verify it's gone
      const { status: getStatus } = await makeRequest(
        'GET',
        `/api/plans/${planId}/workouts/${workoutId}`,
      );
      expect(getStatus).toBe(404);
    });

    it('should NOT cascade delete associated runs', async () => {
      // Create workout
      const { data: workoutData } = await makeRequest('POST', `/api/plans/${planId}/workouts`, {
        distance: 5.0,
        target_pace: 360,
        workout_type: 'EASY',
        scheduled_date: '2025-02-03',
      });
      const workoutId = workoutData.data.id;

      // Create run linked to workout
      const { data: runData } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        workout_id: workoutId,
        actual_date: '2025-02-03',
        distance: 5.2,
        actual_pace: 361,
      });
      const runId = runData.data.id;

      // Delete workout
      await makeRequest('DELETE', `/api/plans/${planId}/workouts/${workoutId}`);

      // Verify run still exists but workout_id is null
      const { status, data } = await makeRequest('GET', `/api/plans/${planId}/runs/${runId}`);

      expect(status).toBe(200);
      expect(data.data.workout_id).toBeNull();
    });

    it('should return 404 for non-existent workout', async () => {
      const fakeId = 'clr0000000000000000fake0';

      const { status, data } = await makeRequest(
        'DELETE',
        `/api/plans/${planId}/workouts/${fakeId}`,
      );

      expect(status).toBe(404);
    });
  });
});
