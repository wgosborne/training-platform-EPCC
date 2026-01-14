'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface Run {
  id: string;
  plan_id: string;
  workout_id?: string;
  actual_date: string;
  distance: string;
  actual_pace: number;
  source: string;
}

interface Workout {
  id: string;
  distance: string;
  target_pace: number;
  workout_type: string;
  scheduled_date?: string;
}

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;
  const runId = params.runId as string;

  const [run, setRun] = useState<Run | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    actual_date: '',
    distance: '',
    actual_pace: '',
    workout_id: '',
    source: 'MANUAL',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [runRes, workoutsRes] = await Promise.all([
          fetch(`/api/plans/${planId}/runs/${runId}`),
          fetch(`/api/plans/${planId}/workouts`),
        ]);

        if (!runRes.ok) {
          const errorData = await runRes.json();
          throw new Error(errorData.error?.message || 'Failed to fetch run');
        }
        if (!workoutsRes.ok) {
          const errorData = await workoutsRes.json();
          throw new Error(errorData.error?.message || 'Failed to fetch workouts');
        }

        const runData = await runRes.json();
        const workoutsData = await workoutsRes.json();

        setRun(runData.data);
        setWorkouts(workoutsData.data || []);
        setFormData({
          actual_date: runData.data.actual_date,
          distance: runData.data.distance,
          actual_pace: runData.data.actual_pace.toString(),
          workout_id: runData.data.workout_id || '',
          source: runData.data.source,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        console.error('Error fetching run:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [planId, runId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWorkoutChange = (value: string) => {
    setFormData((prev) => ({ ...prev, workout_id: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        workout_id: formData.workout_id || null,
        distance: parseFloat(formData.distance),
        actual_pace: parseInt(formData.actual_pace),
      };

      const response = await fetch(`/api/plans/${planId}/runs/${runId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update run');
      }

      const data = await response.json();
      setRun(data.data);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/plans/${planId}/runs/${runId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete run');
      router.push(`/plans/${planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSaving(false);
    }
  };

  const formatPace = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}/mi`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-600">Loading run...</p>
        </div>
      </main>
    );
  }

  if (!run) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-red-600">Run not found</p>
          <Link href={`/plans/${planId}`}>
            <Button className="mt-4">Back to Plan</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href={`/plans/${planId}`}>
          <Button variant="ghost" className="gap-2 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Plan
          </Button>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Run Details</CardTitle>
              <CardDescription>Edit or manage this run</CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {!isEditing ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Date</p>
                  <p className="text-gray-900 mt-1">{formatDate(run.actual_date)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Distance</p>
                    <p className="text-gray-900 mt-1">{run.distance} miles</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Pace</p>
                    <p className="text-gray-900 mt-1">{formatPace(run.actual_pace)}</p>
                  </div>
                </div>

                {run.workout_id && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-xs text-blue-700 uppercase font-semibold">
                      Linked to Scheduled Workout
                    </p>
                    <p className="text-blue-900 mt-1">Workout ID: {run.workout_id}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Source</p>
                  <p className="text-gray-900 mt-1">{run.source}</p>
                </div>

                <div className="pt-4">
                  <Button onClick={() => setIsEditing(true)} className="w-full">
                    Edit Run
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="actual_date">Date *</Label>
                  <Input
                    id="actual_date"
                    name="actual_date"
                    type="date"
                    value={formData.actual_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="distance">Distance (miles) *</Label>
                    <Input
                      id="distance"
                      name="distance"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      value={formData.distance}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="actual_pace">Pace (seconds/mile) *</Label>
                    <Input
                      id="actual_pace"
                      name="actual_pace"
                      type="number"
                      min="180"
                      max="3000"
                      value={formData.actual_pace}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workout_id">Link to Workout (optional)</Label>
                  <Select value={formData.workout_id} onValueChange={handleWorkoutChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a workout to link" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None - Unplanned run</SelectItem>
                      {workouts.map((workout) => (
                        <SelectItem key={workout.id} value={workout.id}>
                          {workout.workout_type} - {workout.distance} mi
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4 justify-end pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Run</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this run? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
