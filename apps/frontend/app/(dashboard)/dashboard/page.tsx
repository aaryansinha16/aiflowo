'use client';

import { useRouter } from 'next/navigation';

import { Text } from '@/components/atoms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="h1">Dashboard</Text>
            <Text variant="muted">Welcome back{user?.name || user?.email ? `, ${user.name || user.email}` : ''}!</Text>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Tasks</CardTitle>
              <CardDescription>All time</CardDescription>
            </CardHeader>
            <CardContent>
              <Text variant="h2">0</Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
              <CardDescription>Currently running</CardDescription>
            </CardHeader>
            <CardContent>
              <Text variant="h2">0</Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
              <CardDescription>Successfully finished</CardDescription>
            </CardHeader>
            <CardContent>
              <Text variant="h2">0</Text>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your latest automated tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <Text variant="muted" className="text-center py-8">
              No tasks yet. Create your first task to get started!
            </Text>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
