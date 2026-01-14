import { createPlanSchema, updatePlanSchema } from '@/lib/validators/plan.validator';

describe('Plan Validators', () => {
  describe('createPlanSchema', () => {
    it('should validate a valid create plan request', () => {
      const validData = {
        name: 'St. Jude Half Marathon 2025',
        description: '12-week training plan',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
        status: 'DRAFT',
      };
      expect(() => createPlanSchema.parse(validData)).not.toThrow();
    });

    it('should accept optional description and status', () => {
      const minimalData = {
        name: 'My Plan',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      };
      expect(() => createPlanSchema.parse(minimalData)).not.toThrow();
    });

    it('should reject if name is empty', () => {
      const invalidData = {
        name: '',
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      };
      expect(() => createPlanSchema.parse(invalidData)).toThrow();
    });

    it('should reject if end_date < start_date', () => {
      const invalidData = {
        name: 'Test Plan',
        start_date: '2025-04-27',
        end_date: '2025-02-01',
      };
      expect(() => createPlanSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid date formats', () => {
      const invalidData = {
        name: 'Test Plan',
        start_date: '2025-13-01',
        end_date: '2025-04-27',
      };
      expect(() => createPlanSchema.parse(invalidData)).toThrow();
    });

    it('should reject if name exceeds 255 characters', () => {
      const longName = 'a'.repeat(256);
      const invalidData = {
        name: longName,
        start_date: '2025-02-01',
        end_date: '2025-04-27',
      };
      expect(() => createPlanSchema.parse(invalidData)).toThrow();
    });
  });

  describe('updatePlanSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        name: 'Updated Name',
      };
      expect(() => updatePlanSchema.parse(partialData)).not.toThrow();
    });

    it('should validate date updates', () => {
      const dateUpdate = {
        start_date: '2025-03-01',
        end_date: '2025-05-01',
      };
      expect(() => updatePlanSchema.parse(dateUpdate)).not.toThrow();
    });

    it('should reject if end_date < start_date in update', () => {
      const invalidData = {
        start_date: '2025-04-27',
        end_date: '2025-02-01',
      };
      expect(() => updatePlanSchema.parse(invalidData)).toThrow();
    });

    it('should accept empty object (no required fields)', () => {
      expect(() => updatePlanSchema.parse({})).not.toThrow();
    });
  });
});
