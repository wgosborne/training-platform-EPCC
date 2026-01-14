import { createRunSchema, updateRunSchema } from '@/lib/validators/run.validator';

describe('Run Validators', () => {
  describe('createRunSchema', () => {
    it('should validate a valid create run request', () => {
      const validData = {
        workout_id: '550e8400-e29b-41d4-a716-446655440000',
        actual_date: '2025-02-03',
        distance: 5.2,
        actual_pace: 361,
        source: 'MANUAL',
      };
      expect(() => createRunSchema.parse(validData)).not.toThrow();
    });

    it('should accept null workout_id (unplanned run)', () => {
      const unplannedRun = {
        workout_id: null,
        actual_date: '2025-02-03',
        distance: 5.2,
        actual_pace: 361,
      };
      expect(() => createRunSchema.parse(unplannedRun)).not.toThrow();
    });

    it('should default source to MANUAL', () => {
      const data = {
        actual_date: '2025-02-03',
        distance: 5.2,
        actual_pace: 361,
      };
      const result = createRunSchema.parse(data);
      expect(result.source).toBe('MANUAL');
    });

    it('should accept STRAVA source', () => {
      const data = {
        actual_date: '2025-02-03',
        distance: 5.2,
        actual_pace: 361,
        source: 'STRAVA',
      };
      expect(() => createRunSchema.parse(data)).not.toThrow();
    });

    it('should reject distance < 0.1', () => {
      const invalidData = {
        actual_date: '2025-02-03',
        distance: 0.05,
        actual_pace: 361,
      };
      expect(() => createRunSchema.parse(invalidData)).toThrow();
    });

    it('should reject distance > 100', () => {
      const invalidData = {
        actual_date: '2025-02-03',
        distance: 150,
        actual_pace: 361,
      };
      expect(() => createRunSchema.parse(invalidData)).toThrow();
    });

    it('should reject actual_pace < 180', () => {
      const invalidData = {
        actual_date: '2025-02-03',
        distance: 5.2,
        actual_pace: 100,
      };
      expect(() => createRunSchema.parse(invalidData)).toThrow();
    });

    it('should reject actual_pace > 3000', () => {
      const invalidData = {
        actual_date: '2025-02-03',
        distance: 5.2,
        actual_pace: 4000,
      };
      expect(() => createRunSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid date format', () => {
      const invalidData = {
        actual_date: '2025-13-01',
        distance: 5.2,
        actual_pace: 361,
      };
      expect(() => createRunSchema.parse(invalidData)).toThrow();
    });
  });

  describe('updateRunSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        distance: 5.3,
      };
      expect(() => updateRunSchema.parse(partialData)).not.toThrow();
    });

    it('should accept empty object', () => {
      expect(() => updateRunSchema.parse({})).not.toThrow();
    });

    it('should validate date updates', () => {
      const data = {
        actual_date: '2025-02-04',
      };
      expect(() => updateRunSchema.parse(data)).not.toThrow();
    });

    it('should validate workout_id updates', () => {
      const data = {
        workout_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => updateRunSchema.parse(data)).not.toThrow();
    });
  });
});
