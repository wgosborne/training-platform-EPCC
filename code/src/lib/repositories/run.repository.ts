import { Run } from '@prisma/client';
import { prisma } from '@/lib/utils/prisma';
import { CreateRunInput, UpdateRunInput } from '@/lib/validators';

export class RunRepository {
  // Create a new run
  async create(planId: string, data: CreateRunInput): Promise<Run> {
    return prisma.run.create({
      data: {
        planId,
        workoutId: data.workout_id || null,
        actualDate: new Date(data.actual_date),
        distance: data.distance,
        actualPace: data.actual_pace,
        source: data.source || 'MANUAL',
      },
    });
  }

  // Find run by ID
  async findById(id: string): Promise<Run | null> {
    return prisma.run.findUnique({
      where: { id },
    });
  }

  // Find all runs for a plan
  async findByPlanId(planId: string): Promise<Run[]> {
    return prisma.run.findMany({
      where: { planId },
      orderBy: { actualDate: 'desc' },
    });
  }

  // Find runs by plan ID and actual date
  async findByPlanAndDate(planId: string, date: Date): Promise<Run[]> {
    return prisma.run.findMany({
      where: {
        planId,
        actualDate: date,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Find runs for a specific workout
  async findByWorkoutId(workoutId: string): Promise<Run[]> {
    return prisma.run.findMany({
      where: { workoutId },
      orderBy: { actualDate: 'desc' },
    });
  }

  // Update a run
  async update(id: string, data: UpdateRunInput): Promise<Run | null> {
    return prisma.run.update({
      where: { id },
      data: {
        workoutId: data.workout_id !== undefined ? (data.workout_id || null) : undefined,
        actualDate: data.actual_date ? new Date(data.actual_date) : undefined,
        distance: data.distance,
        actualPace: data.actual_pace,
        source: data.source,
      },
    });
  }

  // Delete a run
  async delete(id: string): Promise<boolean> {
    const result = await prisma.run.delete({
      where: { id },
    });
    return !!result;
  }
}
