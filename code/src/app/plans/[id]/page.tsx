'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Edit2, Calendar } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface Workout {
  id: string;
  plan_id: string;
  scheduled_date?: string;
  distance: string;
  target_pace: number;
  workout_type: string;
  description?: string;
}

interface Run {
  id: string;
  plan_id: string;
  workout_id?: string;
  actual_date: string;
  distance: string;
  actual_pace: number;
}

interface CalendarDay {
  date: string;
  workouts: Workout[];
  runs: Run[];
}

export default function PlanDetailPage() {
  const params = useParams();
  const planId = params.id as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const [planRes, workoutsRes, runsRes] = await Promise.all([
          fetch(`/api/plans/${planId}`),
          fetch(`/api/plans/${planId}/workouts`),
          fetch(`/api/plans/${planId}/runs`),
        ]);

        if (!planRes.ok) {
          const errorData = await planRes.json();
          throw new Error(errorData.error?.message || 'Failed to fetch plan');
        }
        if (!workoutsRes.ok) {
          const errorData = await workoutsRes.json();
          throw new Error(errorData.error?.message || 'Failed to fetch workouts');
        }
        if (!runsRes.ok) {
          const errorData = await runsRes.json();
          throw new Error(errorData.error?.message || 'Failed to fetch runs');
        }

        const planData = await planRes.json();
        const workoutsData = await workoutsRes.json();
        const runsData = await runsRes.json();

        setPlan(planData.data);
        setWorkouts(workoutsData.data || []);
        setRuns(runsData.data || []);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        console.error('Error fetching plan details:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanDetails();
  }, [planId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPace = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}/mi`;
  };

  const getWorkoutTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      EASY: 'bg-blue-100 text-blue-800',
      TEMPO: 'bg-orange-100 text-orange-800',
      LONG: 'bg-purple-100 text-purple-800',
      SPEED: 'bg-red-100 text-red-800',
      RECOVERY: 'bg-green-100 text-green-800',
      CROSS_TRAINING: 'bg-yellow-100 text-yellow-800',
      REST: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const scheduledWorkouts = workouts.filter((w) => w.scheduled_date);
  const unscheduledWorkouts = workouts.filter((w) => !w.scheduled_date);

  // Build calendar
  const getDayRange = () => {
    if (!plan) return [];
    const start = new Date(plan.start_date);
    const end = new Date(plan.end_date);
    const days: CalendarDay[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayWorkouts = scheduledWorkouts.filter((w) => w.scheduled_date === dateStr);
      const dayRuns = runs.filter((r) => r.actual_date === dateStr);

      if (dayWorkouts.length > 0 || dayRuns.length > 0) {
        days.push({
          date: dateStr,
          workouts: dayWorkouts,
          runs: dayRuns,
        });
      }
    }
    return days;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-gray-600">Loading plan details...</p>
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-red-600">Plan not found</p>
          <Link href="/">
            <Button className="mt-4">Back to Plans</Button>
          </Link>
        </div>
      </main>
    );
  }

  const calendarDays = getDayRange();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="gap-2 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Button>
        </Link>

        {/* Plan Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{plan.name}</h1>
              {plan.description && (
                <p className="text-gray-600 mt-2">{plan.description}</p>
              )}
            </div>
            <Link href={`/plans/${planId}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>

          <div className="flex gap-4 flex-wrap">
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
              {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {plan.status}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Calendar Section */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Training Calendar
              </CardTitle>
              <CardDescription>Scheduled workouts and logged runs</CardDescription>
            </div>
            <Link href={`/plans/${planId}/workouts/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Workout
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {calendarDays.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <p>No scheduled workouts or runs yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {calendarDays.map((day) => (
                  <div key={day.date} className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-lg mb-3">{formatDate(day.date)}</h3>

                    {day.workouts.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-600 mb-2">
                          Workouts ({day.workouts.length})
                        </h4>
                        <div className="space-y-2">
                          {day.workouts.map((workout) => (
                            <Link key={workout.id} href={`/plans/${planId}/workouts/${workout.id}`}>
                              <div className="p-3 bg-white border border-gray-200 rounded hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex gap-2 items-center mb-1">
                                      <span
                                        className={`px-2 py-0.5 rounded text-xs font-semibold ${getWorkoutTypeColor(
                                          workout.workout_type
                                        )}`}
                                      >
                                        {workout.workout_type}
                                      </span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {workout.distance} mi @ {formatPace(workout.target_pace)}
                                      </span>
                                    </div>
                                    {workout.description && (
                                      <p className="text-xs text-gray-600">
                                        {workout.description}
                                      </p>
                                    )}
                                  </div>
                                  <Edit2 className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {day.runs.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">
                          Logged Runs ({day.runs.length})
                        </h4>
                        <div className="space-y-2">
                          {day.runs.map((run) => (
                            <Link key={run.id} href={`/plans/${planId}/runs/${run.id}`}>
                              <div className="p-3 bg-white border border-gray-200 rounded hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {run.distance} mi @ {formatPace(run.actual_pace)}
                                    </span>
                                    {run.workout_id && (
                                      <p className="text-xs text-gray-600">
                                        Linked to scheduled workout
                                      </p>
                                    )}
                                  </div>
                                  <Edit2 className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unscheduled Workouts */}
        {unscheduledWorkouts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Unscheduled Workouts</CardTitle>
              <CardDescription>
                These workouts haven't been assigned a date yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unscheduledWorkouts.map((workout) => (
                  <Link key={workout.id} href={`/plans/${planId}/workouts/${workout.id}`}>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex gap-2 items-center mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${getWorkoutTypeColor(
                                workout.workout_type
                              )}`}
                            >
                              {workout.workout_type}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {workout.distance} mi @ {formatPace(workout.target_pace)}
                            </span>
                          </div>
                          {workout.description && (
                            <p className="text-sm text-gray-600">{workout.description}</p>
                          )}
                        </div>
                        <Edit2 className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link href={`/plans/${planId}/runs/new`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Log a Run
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
