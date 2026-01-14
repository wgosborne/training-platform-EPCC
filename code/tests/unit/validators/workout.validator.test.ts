import { createWorkoutSchema, updateWorkoutSchema } from '@/lib/validators/workout.validator';

describe('Workout Validators', () => {
  describe('createWorkoutSchema', () => {
    it('should validate a valid create workout request', () => {
      const validData = {
        scheduled_date: '2025-02-03',
        distance: 5.2,
        target_pace: 360,
        workout_type: 'EASY',
        description: 'Easy 5-miler',
      };
      expect(() => createWorkoutSchema.parse(validData)).not.toThrow();
    });

    it('should accept null scheduled_date (unscheduled)', () => {
      const dataWithoutDate = {
        scheduled_date: null,
        distance: 8.0,
        target_pace: 420,
        workout_type: 'LONG',
      };
      expect(() => createWorkoutSchema.parse(dataWithoutDate)).not.toThrow();
    });

    it('should accept all workout types', () => {
      const types = ['EASY', 'TEMPO', 'LONG', 'SPEED', 'RECOVERY', 'CROSS_TRAINING', 'REST'];
      types.forEach((type) => {
        const data = {
          distance: 5.0,
          target_pace: 360,
          workout_type: type,
        };
        expect(() => createWorkoutSchema.parse(data)).not.toThrow();
      });
    });

    it('should reject distance < 0.1', () => {
      const invalidData = {
        distance: 0.05,
        target_pace: 360,
        workout_type: 'EASY',
      };
      expect(() => createWorkoutSchema.parse(invalidData)).toThrow();
    });

    it('should reject distance > 100', () => {
      const invalidData = {
        distance: 150,
        target_pace: 360,
        workout_type: 'EASY',
      };
      expect(() => createWorkoutSchema.parse(invalidData)).toThrow();
    });

    it('should reject target_pace < 180', () => {
      const invalidData = {
        distance: 5.0,
        target_pace: 100,
        workout_type: 'EASY',
      };
      expect(() => createWorkoutSchema.parse(invalidData)).toThrow();
    });

    it('should reject target_pace > 3000', () => {
      const invalidData = {
        distance: 5.0,
        target_pace: 4000,
        workout_type: 'EASY',
      };
      expect(() => createWorkoutSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid workout_type', () => {
      const invalidData = {
        distance: 5.0,
        target_pace: 360,
        workout_type: 'INVALID',
      };
      expect(() => createWorkoutSchema.parse(invalidData)).toThrow();
    });
  });

  describe('updateWorkoutSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        distance: 5.5,
      };
      expect(() => updateWorkoutSchema.parse(partialData)).not.toThrow();
    });

    it('should accept empty object', () => {
      expect(() => updateWorkoutSchema.parse({})).not.toThrow();
    });

    it('should validate multiple fields', () => {
      const data = {
        distance: 6.0,
        target_pace: 365,
        workout_type: 'TEMPO',
      };
      expect(() => updateWorkoutSchema.parse(data)).not.toThrow();
    });
  });
});
