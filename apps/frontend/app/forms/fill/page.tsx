'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, CheckCircle, XCircle, ExternalLink, Copy, AlertCircle, Plus, User } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';

interface FormProfile {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
}

interface FillResult {
  success: boolean;
  data?: {
    fieldsFilled: number;
    fieldsFailed: number;
    screenshot: string;
    sessionUrl: string;
    mappings: Array<{
      selector: string;
      value: any;
      confidence: number;
      fieldType: string;
      source?: string;
    }>;
  };
  error?: string;
}

export default function FormFillerPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [url, setUrl] = useState('https://httpbin.org/forms/post');
  const [profiles, setProfiles] = useState<FormProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FillResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Track client-side mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch user's form profiles on mount
  useEffect(() => {
    if (!isMounted) return;
    
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfiles();
  }, [isMounted, token]);

  const fetchProfiles = async () => {
    setIsLoadingProfiles(true);
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
        // Auto-select default profile
        const defaultProfile = data.find((p: FormProfile) => p.isDefault);
        if (defaultProfile) {
          setSelectedProfileId(defaultProfile.id);
        } else if (data.length > 0) {
          setSelectedProfileId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProfileId && profiles.length > 0) {
      alert('Please select a profile');
      return;
    }

    if (!token) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:4000/api/forms/fill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          url,
          profileId: selectedProfileId || undefined,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Don't render until mounted (prevents SSR issues)
  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">AI-Powered Form Filler</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Automatic Form Filling
          </h1>
          <p className="text-lg text-gray-600">
            Fill any web form automatically using AI-powered field mapping
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {isLoadingProfiles ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-gray-600">Loading profiles...</span>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Form Profiles Found</h3>
              <p className="text-gray-600 mb-6">
                Create a form profile to save your information and fill forms automatically.
              </p>
              <button
                onClick={() => router.push('/forms/profiles/new')}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Your First Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Profile
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push('/forms/profiles')}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Manage Profiles
                  </button>
                </div>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} {profile.isDefault && '(Default)'}
                      {profile.description && ` - ${profile.description}`}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  AI will use this profile's data to fill the form
                </p>
              </div>

              {/* Form URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/form"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter the URL of the form you want to fill
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Filling Form...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Fill Form with AI
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {result.success ? (
              <>
                {/* Success Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">Form Filled Successfully!</h2>
                    <p className="text-gray-600">
                      {result.data?.fieldsFilled} fields filled, {result.data?.fieldsFailed} failed
                    </p>
                  </div>
                </div>

                {/* Primary Action - View & Submit Form */}
                {result.data?.sessionUrl && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-600 rounded-lg">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          🎉 Your Form is Ready!
                        </h3>
                        <p className="text-gray-700 mb-4">
                          The form has been filled with your data. Click below to review and submit it.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <a
                            href={result.data.sessionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
                          >
                            <ExternalLink className="w-5 h-5" />
                            View & Submit Filled Form
                          </a>
                          <button
                            onClick={() => copyToClipboard(result.data!.sessionUrl)}
                            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium border-2 border-gray-300 px-6 py-3 rounded-lg shadow hover:shadow-md transition-all"
                          >
                            <Copy className="w-5 h-5" />
                            {copied ? 'Copied!' : 'Copy Link'}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-3">
                          💡 Tip: Review all fields before submitting to ensure accuracy
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Screenshot Preview */}
                {result.data?.screenshot && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      📸 Form Preview
                    </h3>
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                      <img
                        src={result.data.screenshot}
                        alt="Filled Form Screenshot"
                        className="w-full cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => window.open(result.data!.screenshot, '_blank')}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      Click on the image to view full size
                    </p>
                  </div>
                )}

                {/* Original Form URL */}
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Original Form URL
                  </h3>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-gray-200 text-gray-800 overflow-x-auto">
                      {url}
                    </code>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium whitespace-nowrap"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </a>
                  </div>
                </div>

                {/* AI Mappings */}
                {result.data?.mappings && result.data.mappings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      🤖 AI Field Mappings ({result.data.mappings.length} fields)
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      See how AI mapped your profile data to form fields
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {result.data.mappings.map((mapping, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white rounded-lg border border-gray-300 hover:border-indigo-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                  {mapping.selector}
                                </code>
                                <span className="text-xs text-gray-500">
                                  {mapping.fieldType}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900 truncate">
                                <span className="font-medium">Value:</span> {String(mapping.value)}
                              </p>
                              {mapping.source && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Source: {mapping.source}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              <div
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  mapping.confidence >= 0.9
                                    ? 'bg-green-100 text-green-700'
                                    : mapping.confidence >= 0.7
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {(mapping.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fill Another Form */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
                  <button
                    onClick={() => {
                      setResult(null);
                      setUrl('https://httpbin.org/forms/post');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium border-2 border-gray-300 px-6 py-3 rounded-lg shadow hover:shadow-md transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    Fill Another Form
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Error State */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">Form Fill Failed</h2>
                    <p className="text-red-600 mt-1">{result.error}</p>
                  </div>
                </div>
                
                {/* Error Actions */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 mb-4">
                    Something went wrong while filling the form. Please try again or check the form URL.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setResult(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg shadow hover:shadow-md transition-all"
                    >
                      <Sparkles className="w-5 h-5" />
                      Try Again
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium border-2 border-gray-300 px-6 py-3 rounded-lg shadow hover:shadow-md transition-all"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Open Original Form
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works</h3>
          <ol className="text-sm text-blue-800 space-y-2">
            <li className="flex gap-2">
              <span className="font-semibold flex-shrink-0">1.</span>
              <span>AI analyzes the form structure and extracts all fields</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold flex-shrink-0">2.</span>
              <span>GPT-4 intelligently maps your data to form fields</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold flex-shrink-0">3.</span>
              <span>Form is automatically filled in a headless browser</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold flex-shrink-0">4.</span>
              <span>Screenshot is taken and session data is captured</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold flex-shrink-0">5.</span>
              <span>You review and submit the form using the provided instructions</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
