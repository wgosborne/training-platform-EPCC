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
import { ArrowLeft } from 'lucide-react';

interface Workout {
  id: string;
  distance: string;
  target_pace: number;
  workout_type: string;
  scheduled_date?: string;
}

export default function NewRunPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    workout_id: '',
    actual_date: '',
    distance: '',
    actual_pace: '',
    source: 'MANUAL',
  });

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await fetch(`/api/plans/${planId}/workouts`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch workouts');
        }
        const data = await response.json();
        setWorkouts(data.data || []);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        console.error('Error fetching workouts:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [planId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWorkoutChange = (value: string) => {
    setFormData((prev) => ({ ...prev, workout_id: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaveLoading(true);

    try {
      const payload = {
        ...formData,
        workout_id: formData.workout_id || null,
        distance: parseFloat(formData.distance),
        actual_pace: parseInt(formData.actual_pace),
      };

      const response = await fetch(`/api/plans/${planId}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create run');
      }

      router.push(`/plans/${planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaveLoading(false);
    }
  };

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
          <CardHeader>
            <CardTitle className="text-3xl">Log a Run</CardTitle>
            <CardDescription>Record a run you've completed</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

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
                    placeholder="e.g., 5.2"
                    value={formData.distance}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual_pace">Actual Pace (seconds/mile) *</Label>
                  <Input
                    id="actual_pace"
                    name="actual_pace"
                    type="number"
                    min="180"
                    max="3000"
                    placeholder="e.g., 361 (6:01/mi)"
                    value={formData.actual_pace}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workout_id">Link to Scheduled Workout (optional)</Label>
                <Select value={formData.workout_id} onValueChange={handleWorkoutChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workout to link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None - Unplanned run</SelectItem>
                    {loading ? (
                      <div className="p-2 text-gray-600 text-sm">Loading workouts...</div>
                    ) : workouts.length > 0 ? (
                      workouts.map((workout) => (
                        <SelectItem key={workout.id} value={workout.id}>
                          {workout.workout_type} - {workout.distance} mi
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-gray-600 text-sm">No workouts available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 justify-end pt-6">
                <Link href={`/plans/${planId}`}>
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={saveLoading}>
                  {saveLoading ? 'Logging...' : 'Log Run'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
