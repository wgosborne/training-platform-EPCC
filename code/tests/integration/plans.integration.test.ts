/**
 * Integration Tests for Plans API
 * Testing all CRUD operations and business logic for plans
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

describe('Plans API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database is clean before tests
    await prisma.run.deleteMany({});
    await prisma.workout.deleteMany({});
    await prisma.plan.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.run.deleteMany({});
    await prisma.workout.deleteMany({});
    await prisma.plan.deleteMany({});
  });

  describe('POST /api/plans - Create Plan', () => {
    it('should create a plan with valid data and return 201', async () => {
      const planData = {
        name: 'St. Jude Half Marathon 2025',
        description: '12-week training plan',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
        status: 'DRAFT',
      };

      const { status, data } = await makeRequest('POST', '/api/plans', planData);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        name: planData.name,
        description: planData.description,
        status: 'DRAFT',
      });
      expect(data.data.id).toBeDefined();
      expect(data.data.created_at).toBeDefined();
    });

    it('should create plan with minimal required fields', async () => {
      const planData = {
        name: 'Minimal Plan',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      };

      const { status, data } = await makeRequest('POST', '/api/plans', planData);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Minimal Plan');
      expect(data.data.description).toBeNull();
    });

    it('should reject plan with empty name (400)', async () => {
      const planData = {
        name: '',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      };

      const { status, data } = await makeRequest('POST', '/api/plans', planData);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject plan with missing start_date (400)', async () => {
      const planData = {
        name: 'Test Plan',
        end_date: '2025-04-27',
      };

      const { status, data } = await makeRequest('POST', '/api/plans', planData);

      expect(status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject plan with end_date < start_date (400)', async () => {
      const planData = {
        name: 'Invalid Plan',
        start_date: '2025-04-27',
        end_date: '2025-02-01',
      };

      const { status, data } = await makeRequest('POST', '/api/plans', planData);

      expect(status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject plan with invalid date format (400)', async () => {
      const planData = {
        name: 'Bad Date Plan',
        start_date: '2025-13-01', // Invalid month
        end_date: '2025-04-27',
      };

      const { status, data } = await makeRequest('POST', '/api/plans', planData);

      expect(status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate plan name (409)', async () => {
      const planData = {
        name: 'Duplicate Plan',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      };

      // Create first plan
      await makeRequest('POST', '/api/plans', planData);

      // Try to create with same name
      const { status, data } = await makeRequest('POST', '/api/plans', planData);

      expect(status).toBe(409);
      expect(data.error.code).toBe('CONFLICT');
    });

    it('should handle very long name (400)', async () => {
      const planData = {
        name: 'a'.repeat(300), // Exceeds 255 char limit
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      };

      const { status, data } = await makeRequest('POST', '/api/plans', planData);

      expect(status).toBe(400);
    });

    it('should sanitize special characters in name', async () => {
      const planData = {
        name: '<script>alert("xss")</script>',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      };

      const { status, data } = await makeRequest('POST', '/api/plans', planData);

      // Should be stored as-is (sanitization handled at presentation layer)
      expect(status).toBe(201);
      expect(data.data.name).toBe(planData.name);
    });
  });

  describe('GET /api/plans - List Plans', () => {
    it('should return empty array when no plans exist', async () => {
      const { status, data } = await makeRequest('GET', '/api/plans');

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(0);
    });

    it('should return all plans', async () => {
      // Create multiple plans
      const plan1 = {
        name: 'Plan 1',
        start_date: '2025-01-01',
        end_date: '2025-02-01',
      };
      const plan2 = {
        name: 'Plan 2',
        start_date: '2025-03-01',
        end_date: '2025-04-01',
      };

      await makeRequest('POST', '/api/plans', plan1);
      await makeRequest('POST', '/api/plans', plan2);

      const { status, data } = await makeRequest('GET', '/api/plans');

      expect(status).toBe(200);
      expect(data.data.length).toBe(2);
      expect(data.data.map((p: any) => p.name)).toContain('Plan 1');
      expect(data.data.map((p: any) => p.name)).toContain('Plan 2');
    });

    it('should include all plan fields in response', async () => {
      const planData = {
        name: 'Full Plan',
        description: 'Complete description',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
        status: 'ACTIVE',
      };

      await makeRequest('POST', '/api/plans', planData);

      const { data } = await makeRequest('GET', '/api/plans');

      expect(data.data[0]).toMatchObject({
        name: 'Full Plan',
        description: 'Complete description',
        status: 'ACTIVE',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      });
      expect(data.data[0].created_at).toBeDefined();
      expect(data.data[0].updated_at).toBeDefined();
    });
  });

  describe('GET /api/plans/:id - Get Single Plan', () => {
    it('should return plan by ID', async () => {
      const planData = {
        name: 'Get Plan Test',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      };

      const { data: createData } = await makeRequest('POST', '/api/plans', planData);
      const planId = createData.data.id;

      const { status, data } = await makeRequest('GET', `/api/plans/${planId}`);

      expect(status).toBe(200);
      expect(data.data.id).toBe(planId);
      expect(data.data.name).toBe('Get Plan Test');
    });

    it('should return 404 for non-existent plan', async () => {
      const fakeId = 'clr0000000000000000fake0';

      const { status, data } = await makeRequest('GET', `/api/plans/${fakeId}`);

      expect(status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/plans/:id - Update Plan', () => {
    it('should update plan with valid data', async () => {
      const planData = {
        name: 'Update Test',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
        status: 'DRAFT',
      };

      const { data: createData } = await makeRequest('POST', '/api/plans', planData);
      const planId = createData.data.id;

      const updateData = {
        status: 'ACTIVE',
        description: 'Updated description',
      };

      const { status, data } = await makeRequest('PATCH', `/api/plans/${planId}`, updateData);

      expect(status).toBe(200);
      expect(data.data.status).toBe('ACTIVE');
      expect(data.data.description).toBe('Updated description');
      expect(data.data.name).toBe('Update Test'); // Unchanged field
    });

    it('should allow partial updates', async () => {
      const planData = {
        name: 'Partial Update',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      };

      const { data: createData } = await makeRequest('POST', '/api/plans', planData);
      const planId = createData.data.id;

      const { status, data } = await makeRequest('PATCH', `/api/plans/${planId}`, {
        description: 'Only updating description',
      });

      expect(status).toBe(200);
      expect(data.data.description).toBe('Only updating description');
      expect(data.data.name).toBe('Partial Update');
    });

    it('should reject invalid status update (400)', async () => {
      const { data: createData } = await makeRequest('POST', '/api/plans', {
        name: 'Status Test',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      });
      const planId = createData.data.id;

      const { status, data } = await makeRequest('PATCH', `/api/plans/${planId}`, {
        status: 'INVALID_STATUS',
      });

      expect(status).toBe(400);
    });

    it('should reject if end_date < start_date in update', async () => {
      const { data: createData } = await makeRequest('POST', '/api/plans', {
        name: 'Date Validation',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      });
      const planId = createData.data.id;

      const { status } = await makeRequest('PATCH', `/api/plans/${planId}`, {
        start_date: '2025-05-01',
        end_date: '2025-02-01',
      });

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent plan', async () => {
      const fakeId = 'clr0000000000000000fake0';

      const { status, data } = await makeRequest('PATCH', `/api/plans/${fakeId}`, {
        status: 'ACTIVE',
      });

      expect(status).toBe(404);
    });
  });

  describe('DELETE /api/plans/:id - Delete Plan', () => {
    it('should delete plan and return 204', async () => {
      const { data: createData } = await makeRequest('POST', '/api/plans', {
        name: 'Delete Plan',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      });
      const planId = createData.data.id;

      const { status } = await makeRequest('DELETE', `/api/plans/${planId}`);

      expect(status).toBe(204);

      // Verify it's gone
      const { status: getStatus } = await makeRequest('GET', `/api/plans/${planId}`);
      expect(getStatus).toBe(404);
    });

    it('should cascade delete associated workouts and runs', async () => {
      // Create plan
      const { data: planData } = await makeRequest('POST', '/api/plans', {
        name: 'Cascade Delete Test',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      });
      const planId = planData.data.id;

      // Create workout
      const { data: workoutData } = await makeRequest('POST', `/api/plans/${planId}/workouts`, {
        distance: 5.2,
        target_pace: 360,
        workout_type: 'EASY',
        scheduled_date: '2025-02-03',
      });
      const workoutId = workoutData.data.id;

      // Create run
      const { data: runData } = await makeRequest('POST', `/api/plans/${planId}/runs`, {
        actual_date: '2025-02-03',
        distance: 5.2,
        actual_pace: 361,
      });
      const runId = runData.data.id;

      // Delete plan
      await makeRequest('DELETE', `/api/plans/${planId}`);

      // Verify associated entities are deleted
      const { status: workoutStatus } = await makeRequest(
        'GET',
        `/api/plans/${planId}/workouts/${workoutId}`,
      );
      const { status: runStatus } = await makeRequest('GET', `/api/plans/${planId}/runs/${runId}`);

      expect(workoutStatus).toBe(404);
      expect(runStatus).toBe(404);
    });

    it('should return 404 for non-existent plan', async () => {
      const fakeId = 'clr0000000000000000fake0';

      const { status, data } = await makeRequest('DELETE', `/api/plans/${fakeId}`);

      expect(status).toBe(404);
    });
  });
});
