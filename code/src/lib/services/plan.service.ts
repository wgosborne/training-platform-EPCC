import { PlanRepository } from '@/lib/repositories/plan.repository';
import { CreatePlanInput, UpdatePlanInput } from '@/lib/validators';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { mapPlan, PlanDTO } from '@/lib/utils/mappers';
import { createRequestLogger } from '@/lib/utils/logger';

export class PlanService {
  private planRepository: PlanRepository;
  private logger = createRequestLogger('PlanService');

  constructor(planRepository?: PlanRepository) {
    this.planRepository = planRepository || new PlanRepository();
  }

  async createPlan(data: CreatePlanInput): Promise<PlanDTO> {
    // Validate end_date >= start_date
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (endDate < startDate) {
      throw new ValidationError('end_date must be greater than or equal to start_date', [
        { field: 'end_date', message: 'end_date must be >= start_date' },
      ]);
    }

    // Check if plan name already exists
    const existingPlan = await this.planRepository.findByName(data.name);
    if (existingPlan) {
      throw new ConflictError('Plan name already exists');
    }

    const plan = await this.planRepository.create(data);
    this.logger.info({ message: 'Plan created', plan_id: plan.id });
    return mapPlan(plan);
  }

  async getPlan(id: string): Promise<PlanDTO> {
    const plan = await this.planRepository.findById(id);
    if (!plan) {
      throw new NotFoundError(`Plan with id ${id} not found`);
    }
    return mapPlan(plan);
  }

  async listPlans(): Promise<PlanDTO[]> {
    const plans = await this.planRepository.findAll();
    return plans.map(mapPlan);
  }

  async updatePlan(id: string, data: UpdatePlanInput): Promise<PlanDTO> {
    // Verify plan exists
    const existingPlan = await this.planRepository.findById(id);
    if (!existingPlan) {
      throw new NotFoundError(`Plan with id ${id} not found`);
    }

    // Validate end_date >= start_date if both dates provided
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      if (endDate < startDate) {
        throw new ValidationError('end_date must be greater than or equal to start_date', [
          { field: 'end_date', message: 'end_date must be >= start_date' },
        ]);
      }
    }

    // If name is being updated, check for uniqueness (excluding self)
    if (data.name && data.name !== existingPlan.name) {
      const duplicateName = await this.planRepository.findByName(data.name);
      if (duplicateName) {
        throw new ConflictError('Plan name already exists');
      }
    }

    const updatedPlan = await this.planRepository.update(id, data);
    if (!updatedPlan) {
      throw new NotFoundError(`Plan with id ${id} not found`);
    }

    this.logger.info({ message: 'Plan updated', plan_id: id });
    return mapPlan(updatedPlan);
  }

  async deletePlan(id: string): Promise<void> {
    const plan = await this.planRepository.findById(id);
    if (!plan) {
      throw new NotFoundError(`Plan with id ${id} not found`);
    }

    await this.planRepository.delete(id);
    this.logger.info({ message: 'Plan deleted', plan_id: id });
  }
}
