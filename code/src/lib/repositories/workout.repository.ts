import { Workout } from '@prisma/client';
import { prisma } from '@/lib/utils/prisma';
import { CreateWorkoutInput, UpdateWorkoutInput } from '@/lib/validators';

export class WorkoutRepository {
  // Create a new workout
  async create(planId: string, data: CreateWorkoutInput): Promise<Workout> {
    return prisma.workout.create({
      data: {
        planId,
        scheduledDate: data.scheduled_date ? new Date(data.scheduled_date) : null,
        distance: data.distance,
        targetPace: data.target_pace,
        workoutType: data.workout_type,
        description: data.description || null,
      },
    });
  }

  // Find workout by ID
  async findById(id: string): Promise<Workout | null> {
    return prisma.workout.findUnique({
      where: { id },
    });
  }

  // Find all workouts for a plan
  async findByPlanId(planId: string): Promise<Workout[]> {
    return prisma.workout.findMany({
      where: { planId },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  // Find workouts by plan ID and scheduled date
  async findByPlanAndDate(planId: string, date: Date): Promise<Workout[]> {
    return prisma.workout.findMany({
      where: {
        planId,
        scheduledDate: date,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Update a workout
  async update(id: string, data: UpdateWorkoutInput): Promise<Workout | null> {
    return prisma.workout.update({
      where: { id },
      data: {
        scheduledDate: data.scheduled_date !== undefined ? (data.scheduled_date ? new Date(data.scheduled_date) : null) : undefined,
        distance: data.distance,
        targetPace: data.target_pace,
        workoutType: data.workout_type,
        description: data.description,
      },
    });
  }

  // Delete a workout
  async delete(id: string): Promise<boolean> {
    const result = await prisma.workout.delete({
      where: { id },
    });
    return !!result;
  }
}
