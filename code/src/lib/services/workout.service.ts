import { PlanRepository } from '@/lib/repositories/plan.repository';
import { WorkoutRepository } from '@/lib/repositories/workout.repository';
import { CreateWorkoutInput, UpdateWorkoutInput } from '@/lib/validators';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { mapWorkout, WorkoutDTO } from '@/lib/utils/mappers';
import { createRequestLogger } from '@/lib/utils/logger';

export class WorkoutService {
  private planRepository: PlanRepository;
  private workoutRepository: WorkoutRepository;
  private logger = createRequestLogger('WorkoutService');

  constructor(planRepository?: PlanRepository, workoutRepository?: WorkoutRepository) {
    this.planRepository = planRepository || new PlanRepository();
    this.workoutRepository = workoutRepository || new WorkoutRepository();
  }

  async createWorkout(planId: string, data: CreateWorkoutInput): Promise<WorkoutDTO> {
    // Verify plan exists
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError(`Plan with id ${planId} not found`);
    }

    // Validate scheduled_date is within plan's date range (if provided)
    if (data.scheduled_date) {
      const scheduledDate = new Date(data.scheduled_date);
      if (scheduledDate < plan.startDate) {
        throw new ValidationError('scheduled_date must be on or after the plan start_date', [
          { field: 'scheduled_date', message: 'scheduled_date must be >= start_date' },
        ]);
      }
    }

    const workout = await this.workoutRepository.create(planId, data);
    this.logger.info({ message: 'Workout created', workout_id: workout.id, plan_id: planId });
    return mapWorkout(workout);
  }

  async getWorkout(planId: string, workoutId: string): Promise<WorkoutDTO> {
    // Verify plan exists
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError(`Plan with id ${planId} not found`);
    }

    const workout = await this.workoutRepository.findById(workoutId);
    if (!workout || workout.planId !== planId) {
      throw new NotFoundError(`Workout with id ${workoutId} not found in plan ${planId}`);
    }

    return mapWorkout(workout);
  }

  async listByPlan(planId: string): Promise<WorkoutDTO[]> {
    // Verify plan exists
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError(`Plan with id ${planId} not found`);
    }

    const workouts = await this.workoutRepository.findByPlanId(planId);
    return workouts.map(mapWorkout);
  }

  async updateWorkout(planId: string, workoutId: string, data: UpdateWorkoutInput): Promise<WorkoutDTO> {
    // Verify plan exists
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError(`Plan with id ${planId} not found`);
    }

    // Verify workout exists and belongs to plan
    const workout = await this.workoutRepository.findById(workoutId);
    if (!workout || workout.planId !== planId) {
      throw new NotFoundError(`Workout with id ${workoutId} not found in plan ${planId}`);
    }

    // Validate scheduled_date is within plan's date range (if provided)
    if (data.scheduled_date) {
      const scheduledDate = new Date(data.scheduled_date);
      if (scheduledDate < plan.startDate) {
        throw new ValidationError('scheduled_date must be on or after the plan start_date', [
          { field: 'scheduled_date', message: 'scheduled_date must be >= start_date' },
        ]);
      }
    }

    const updatedWorkout = await this.workoutRepository.update(workoutId, data);
    if (!updatedWorkout) {
      throw new NotFoundError(`Workout with id ${workoutId} not found`);
    }

    this.logger.info({ message: 'Workout updated', workout_id: workoutId, plan_id: planId });
    return mapWorkout(updatedWorkout);
  }

  async deleteWorkout(planId: string, workoutId: string): Promise<void> {
    // Verify plan exists
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError(`Plan with id ${planId} not found`);
    }

    // Verify workout exists and belongs to plan
    const workout = await this.workoutRepository.findById(workoutId);
    if (!workout || workout.planId !== planId) {
      throw new NotFoundError(`Workout with id ${workoutId} not found in plan ${planId}`);
    }

    await this.workoutRepository.delete(workoutId);
    this.logger.info({ message: 'Workout deleted', workout_id: workoutId, plan_id: planId });
  }
}
