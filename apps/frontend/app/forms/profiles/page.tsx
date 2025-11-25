'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Star, StarOff, Loader2, User } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';

interface FormProfile {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilesPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [profiles, setProfiles] = useState<FormProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Track client-side mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfiles();
  }, [isMounted, token]);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:4000/api/form-profiles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (profileId: string) => {
    try {
      if (!token) return;
      const response = await fetch(`http://localhost:4000/api/form-profiles/${profileId}/set-default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchProfiles(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const handleDelete = async (profileId: string, profileName: string) => {
    if (!confirm(`Are you sure you want to delete "${profileName}"?`)) {
      return;
    }

    try {
      if (!token) return;
      const response = await fetch(`http://localhost:4000/api/form-profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchProfiles(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  // Don't render until mounted (prevents SSR issues)
  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Form Profiles</h1>
            <p className="text-lg text-gray-600">
              Manage your saved information for automatic form filling
            </p>
          </div>
          <button
            onClick={() => router.push('/forms/profiles/new')}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            New Profile
          </button>
        </div>

        {/* Profiles List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-gray-600">Loading profiles...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Profiles Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first profile to start filling forms automatically.
            </p>
            <button
              onClick={() => router.push('/forms/profiles/new')}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Profile
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
                      {profile.isDefault && (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    {profile.description && (
                      <p className="text-sm text-gray-600 mt-1">{profile.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Updated {new Date(profile.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!profile.isDefault && (
                    <button
                      onClick={() => handleSetDefault(profile.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      title="Set as default"
                    >
                      <StarOff className="w-4 h-4" />
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/forms/profiles/${profile.id}`)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id, profile.name)}
                    className="inline-flex items-center justify-center p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Form Filler */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/forms/fill')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Form Filler
          </button>
        </div>
      </div>
    </div>
  );
}
