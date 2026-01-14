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

const WORKOUT_TYPES = ['EASY', 'TEMPO', 'LONG', 'SPEED', 'RECOVERY', 'CROSS_TRAINING', 'REST'];

interface Workout {
  id: string;
  plan_id: string;
  scheduled_date?: string;
  distance: string;
  target_pace: number;
  workout_type: string;
  description?: string;
}

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;
  const workoutId = params.workoutId as string;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    scheduled_date: '',
    distance: '',
    target_pace: '',
    workout_type: 'EASY',
    description: '',
  });

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const response = await fetch(`/api/plans/${planId}/workouts/${workoutId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch workout');
        }
        const data = await response.json();
        setWorkout(data.data);
        setFormData({
          scheduled_date: data.data.scheduled_date || '',
          distance: data.data.distance,
          target_pace: data.data.target_pace.toString(),
          workout_type: data.data.workout_type,
          description: data.data.description || '',
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        console.error('Error fetching workout:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [planId, workoutId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, workout_type: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        distance: parseFloat(formData.distance),
        target_pace: parseInt(formData.target_pace),
        scheduled_date: formData.scheduled_date || null,
      };

      const response = await fetch(`/api/plans/${planId}/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update workout');
      }

      const data = await response.json();
      setWorkout(data.data);
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
      const response = await fetch(`/api/plans/${planId}/workouts/${workoutId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete workout');
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-600">Loading workout...</p>
        </div>
      </main>
    );
  }

  if (!workout) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-red-600">Workout not found</p>
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
              <CardTitle className="text-3xl">Workout Details</CardTitle>
              <CardDescription>Edit or manage this workout</CardDescription>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Type</p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-sm font-semibold mt-1 ${getWorkoutTypeColor(
                        workout.workout_type
                      )}`}
                    >
                      {workout.workout_type}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Scheduled Date</p>
                    <p className="text-gray-900 mt-1">{formatDate(workout.scheduled_date)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Distance</p>
                    <p className="text-gray-900 mt-1">{workout.distance} miles</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Target Pace</p>
                    <p className="text-gray-900 mt-1">{formatPace(workout.target_pace)}</p>
                  </div>
                </div>

                {workout.description && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Description</p>
                    <p className="text-gray-900 mt-1">{workout.description}</p>
                  </div>
                )}

                <div className="pt-4">
                  <Button onClick={() => setIsEditing(true)} className="w-full">
                    Edit Workout
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="workout_type">Workout Type *</Label>
                  <Select value={formData.workout_type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKOUT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Label htmlFor="target_pace">Target Pace (seconds/mile) *</Label>
                    <Input
                      id="target_pace"
                      name="target_pace"
                      type="number"
                      min="180"
                      max="3000"
                      value={formData.target_pace}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Scheduled Date</Label>
                  <Input
                    id="scheduled_date"
                    name="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
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
            <DialogTitle>Delete Workout</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workout? This action cannot be undone.
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
