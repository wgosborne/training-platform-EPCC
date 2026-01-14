import { PlanRepository } from '@/lib/repositories/plan.repository';
import { WorkoutRepository } from '@/lib/repositories/workout.repository';
import { RunRepository } from '@/lib/repositories/run.repository';
import { CreateRunInput, UpdateRunInput } from '@/lib/validators';
import { NotFoundError } from '@/lib/utils/errors';
import { mapRun, RunDTO } from '@/lib/utils/mappers';
import { createRequestLogger } from '@/lib/utils/logger';

export class RunService {
  private planRepository: PlanRepository;
  private workoutRepository: WorkoutRepository;
  private runRepository: RunRepository;
  private logger = createRequestLogger('RunService');

  constructor(
    planRepository?: PlanRepository,
    workoutRepository?: WorkoutRepository,
    runRepository?: RunRepository,
  ) {
    this.planRepository = planRepository || new PlanRepository();
    this.workoutRepository = workoutRepository || new WorkoutRepository();
    this.runRepository = runRepository || new RunRepository();
  }

  async createRun(planId: string, data: CreateRunInput): Promise<RunDTO> {
    // Verify plan exists
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError(`Plan with id ${planId} not found`);
    }

    // If workout_id provided, verify it exists and belongs to the plan
    if (data.workout_id) {
      const workout = await this.workoutRepository.findById(data.workout_id);
      if (!workout || workout.planId !== planId) {
        throw new NotFoundError(`Workout with id ${data.workout_id} not found in plan ${planId}`);
      }
    }

    const run = await this.runRepository.create(planId, data);
    this.logger.info({ message: 'Run created', run_id: run.id, plan_id: planId });
    return mapRun(run);
  }

  async getRun(planId: string, runId: string): Promise<RunDTO> {
    // Verify plan exists
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError(`Plan with id ${planId} not found`);
    }

    const run = await this.runRepository.findById(runId);
    if (!run || run.planId !== planId) {
      throw new NotFoundError(`Run with id ${runId} not found in plan ${planId}`);
    }

    return mapRun(run);
  }

  async listByPlan(planId: string): Promise<RunDTO[]> {
    // Verify plan exists
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError(`Plan with id ${planId} not found`);
    }

    const runs = await this.runRepository.findByPlanId(planId);
    return runs.map(mapRun);
  }

  async updateRun(planId: string, runId: string, data: UpdateRunInput): Promise<RunDTO> {
    // Verify plan exists
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError(`Plan with id ${planId} not found`);
    }

    // Verify run exists and belongs to plan
    const run = await this.runRepository.findById(runId);
    if (!run || run.planId !== planId) {
      throw new NotFoundError(`Run with id ${runId} not found in plan ${planId}`);
    }

    // If workout_id is being updated, verify it exists and belongs to the plan
    if (data.workout_id) {
      const workout = await this.workoutRepository.findById(data.workout_id);
      if (!workout || workout.planId !== planId) {
        throw new NotFoundError(`Workout with id ${data.workout_id} not found in plan ${planId}`);
      }
    }

    const updatedRun = await this.runRepository.update(runId, data);
    if (!updatedRun) {
      throw new NotFoundError(`Run with id ${runId} not found`);
    }

    this.logger.info({ message: 'Run updated', run_id: runId, plan_id: planId });
    return mapRun(updatedRun);
  }

  async deleteRun(planId: string, runId: string): Promise<void> {
    // Verify plan exists
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError(`Plan with id ${planId} not found`);
    }

    // Verify run exists and belongs to plan
    const run = await this.runRepository.findById(runId);
    if (!run || run.planId !== planId) {
      throw new NotFoundError(`Run with id ${runId} not found in plan ${planId}`);
    }

    await this.runRepository.delete(runId);
    this.logger.info({ message: 'Run deleted', run_id: runId, plan_id: planId });
  }
}
