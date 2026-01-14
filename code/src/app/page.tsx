'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Zap } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export default function Home() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch plans');
        }
        const data = await response.json();
        setPlans(data.data || []);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        console.error('Error fetching plans:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap className="h-10 w-10 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">Running Trainer</h1>
            </div>
            <Link href="/plans/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Plan
              </Button>
            </Link>
          </div>
          <p className="text-gray-600 text-lg">
            Plan your runs, track your progress, and achieve your goals
          </p>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your plans...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>No Training Plans Yet</CardTitle>
                <CardDescription>
                  Create your first training plan to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/plans/new">
                  <Button className="w-full">Create Your First Plan</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Link href={`/plans/${plan.id}`} key={plan.id}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                        </CardDescription>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                          plan.status
                        )}`}
                      >
                        {plan.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {plan.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-4">
                      Created {formatDate(plan.created_at)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
