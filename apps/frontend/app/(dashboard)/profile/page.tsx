'use client';

/* eslint-disable no-undef */
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Text } from '@/components/atoms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function ProfilePage() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    profilePicUrl: '',
    preferredAirlines: '',
    preferredCabinClass: '',
    resumeUrl: '',
    linkedInUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    timezone: 'UTC',
    notifications: true,
  });

  const loadProfile = useCallback(async () => {
    try {
      // Don't redirect here - ProtectedRoute handles auth
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || '',
          profilePicUrl: data.profilePicUrl || '',
          preferredAirlines: data.preferredAirlines?.join(', ') || '',
          preferredCabinClass: data.preferredCabinClass || '',
          resumeUrl: data.resumeUrl || '',
          linkedInUrl: data.linkedInUrl || '',
          githubUrl: data.githubUrl || '',
          portfolioUrl: data.portfolioUrl || '',
          timezone: data.timezone || 'UTC',
          notifications: data.notifications ?? true,
        });
      } else if (response.status === 404) {
        // Profile doesn't exist yet
        setMessage('Welcome! Please complete your profile to get started.');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setMessage('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token, loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      // Don't redirect - ProtectedRoute handles auth
      if (!token) {
        setMessage('❌ Authentication required');
        setSaving(false);
        return;
      }

      const payload = {
        name: formData.name || undefined,
        profilePicUrl: formData.profilePicUrl || undefined,
        preferredAirlines: formData.preferredAirlines
          ? formData.preferredAirlines.split(',').map(a => a.trim()).filter(Boolean)
          : [],
        preferredCabinClass: formData.preferredCabinClass || undefined,
        resumeUrl: formData.resumeUrl || undefined,
        linkedInUrl: formData.linkedInUrl || undefined,
        githubUrl: formData.githubUrl || undefined,
        portfolioUrl: formData.portfolioUrl || undefined,
        timezone: formData.timezone,
        notifications: formData.notifications,
      };

      const response = await fetch(`${API_URL}/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage('✅ Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      setMessage('❌ Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <Text variant="h1">Profile Settings</Text>
        <Text variant="muted">Manage your personal information and preferences</Text>
        {message && (
          <div className="mt-4 p-3 rounded-md bg-muted">
            <Text>{message}</Text>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Profile Picture URL</label>
              <Input
                type="url"
                value={formData.profilePicUrl}
                onChange={(e) => setFormData({ ...formData, profilePicUrl: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Travel Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Travel Preferences</CardTitle>
            <CardDescription>For flight booking automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred Airlines</label>
              <Input
                value={formData.preferredAirlines}
                onChange={(e) => setFormData({ ...formData, preferredAirlines: e.target.value })}
                placeholder="United, Delta, American (comma-separated)"
              />
              <Text variant="muted" className="text-xs">Enter airlines separated by commas</Text>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred Cabin Class</label>
              <Input
                value={formData.preferredCabinClass}
                onChange={(e) => setFormData({ ...formData, preferredCabinClass: e.target.value })}
                placeholder="economy, business, first"
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>For job applications and networking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Resume URL</label>
              <Input
                type="url"
                value={formData.resumeUrl}
                onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                placeholder="https://example.com/resume.pdf"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">LinkedIn Profile</label>
              <Input
                type="url"
                value={formData.linkedInUrl}
                onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub Profile</label>
              <Input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="https://github.com/username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Portfolio URL</label>
              <Input
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>App settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <Input
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                placeholder="UTC, America/New_York, Asia/Kolkata"
              />
              <Text variant="muted" className="text-xs">
                Examples: UTC, America/New_York, Europe/London, Asia/Kolkata
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="notifications"
                checked={formData.notifications}
                onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="notifications" className="text-sm font-medium cursor-pointer">
                Enable email notifications
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
