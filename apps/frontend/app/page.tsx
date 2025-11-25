'use client';

import { Sparkles, Inbox, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Text } from '@/components/atoms';
import { SearchBar, StatusBadge, EmptyState } from '@/components/molecules';
import { TaskCard } from '@/components/organisms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <Text variant="h1">AI Flowo</Text>
          </div>
          <Text variant="lead" className="text-muted-foreground">
            AI That ACTS - Your Intelligent Digital Worker
          </Text>
          <div className="flex gap-4 justify-center mt-6">
            <Button size="lg" onClick={() => router.push('/login')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/dashboard')}>
              View Dashboard
            </Button>
          </div>
        </div>

        {/* AI Tools */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/forms/fill')}>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-lg">Form Filler</CardTitle>
              </div>
              <CardDescription>
                Fill any web form automatically using AI-powered field mapping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push('/forms/fill')}>
                Try Form Filler →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Component Showcase */}
        <div className="grid gap-8">
          {/* Atomic Design Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>🎨 Atomic Design System</CardTitle>
              <CardDescription>
                shadcn/ui + Tailwind with atoms, molecules, and organisms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Badges */}
              <div className="space-y-2">
                <Text variant="small" className="font-medium">Status Badges (Molecules)</Text>
                <div className="flex gap-2 flex-wrap">
                  <StatusBadge status="pending" />
                  <StatusBadge status="running" />
                  <StatusBadge status="succeeded" />
                  <StatusBadge status="failed" />
                  <StatusBadge status="paused" />
                </div>
              </div>

              {/* Search Bar */}
              <div className="space-y-2">
                <Text variant="small" className="font-medium">Search Bar (Molecule)</Text>
                <SearchBar placeholder="Search tasks..." />
              </div>
            </CardContent>
          </Card>

          {/* Task Cards */}
          <div className="space-y-4">
            <Text variant="h3">Example Task Cards (Organisms)</Text>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <TaskCard
                id="1"
                title="Book Flight to NYC"
                description="Find and book direct flights for next week"
                status="running"
                createdAt="2025-11-21"
              />
              <TaskCard
                id="2"
                title="Apply to Software Engineer Jobs"
                description="Submit applications to tech companies"
                status="succeeded"
                createdAt="2025-11-20"
              />
              <TaskCard
                id="3"
                title="Post to Social Media"
                description="Schedule posts across all platforms"
                status="pending"
                createdAt="2025-11-21"
              />
            </div>
          </div>

          {/* Empty State */}
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Inbox}
                title="No active tasks"
                description="Create your first automated task to get started with AI Flowo"
                action={{
                  label: 'Create Your First Task',
                  onClick: () => console.log('Create task clicked'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
