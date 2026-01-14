import { Plan } from '@prisma/client';
import { prisma } from '@/lib/utils/prisma';
import { CreatePlanInput, UpdatePlanInput } from '@/lib/validators';

export class PlanRepository {
  // Create a new plan
  async create(data: CreatePlanInput): Promise<Plan> {
    return prisma.plan.create({
      data: {
        name: data.name,
        description: data.description || null,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        status: data.status || 'DRAFT',
      },
    });
  }

  // Find plan by ID
  async findById(id: string): Promise<Plan | null> {
    return prisma.plan.findUnique({
      where: { id },
    });
  }

  // Find plan by name
  async findByName(name: string): Promise<Plan | null> {
    return prisma.plan.findUnique({
      where: { name },
    });
  }

  // Get all plans
  async findAll(): Promise<Plan[]> {
    return prisma.plan.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Update a plan
  async update(id: string, data: UpdatePlanInput): Promise<Plan | null> {
    return prisma.plan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        startDate: data.start_date ? new Date(data.start_date) : undefined,
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        status: data.status,
      },
    });
  }

  // Delete a plan (cascades to workouts and runs)
  async delete(id: string): Promise<boolean> {
    const result = await prisma.plan.delete({
      where: { id },
    });
    return !!result;
  }
}
