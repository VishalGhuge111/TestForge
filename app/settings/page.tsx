'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface RecentAPI {
  url: string;
  method: string;
  timestamp: number;
}

export default function SettingsPage() {
  const [recentAPIs, setRecentAPIs] = useState<RecentAPI[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    // Load recent APIs
    const stored = localStorage.getItem('testforge_recent_apis');
    if (stored) {
      try {
        setRecentAPIs(JSON.parse(stored));
      } catch (e) {
        // Handle invalid JSON
      }
    }
  }, []);

  const handleClearRecent = () => {
    localStorage.removeItem('testforge_recent_apis');
    setRecentAPIs([]);
    toast.success('Recent APIs cleared');
  };

  const handleRemoveAPI = (index: number) => {
    const updated = recentAPIs.filter((_, i) => i !== index);
    setRecentAPIs(updated);
    localStorage.setItem('testforge_recent_apis', JSON.stringify(updated));
    toast.success('API removed');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-8">Manage your TestForge preferences and history</p>

          {/* API Key Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Configure your OpenAI API key for test generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  The OpenAI API key is configured on the server. Users do not need to provide their own API key.
                </p>
              </div>
              <div className="space-y-2">
                <Label>API Status</Label>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">OpenAI API is configured</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent APIs Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent APIs</CardTitle>
                  <CardDescription>APIs you've recently tested</CardDescription>
                </div>
                {recentAPIs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearRecent}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentAPIs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent APIs yet</p>
              ) : (
                <div className="space-y-3">
                  {recentAPIs.map((api, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{api.method}</p>
                        <p className="text-sm text-foreground truncate">{api.url}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(api.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAPI(index)}
                        className="text-destructive hover:text-destructive/80 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* About Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>About TestForge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium mb-2">Features</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>AI-powered test case generation using OpenAI</li>
                  <li>Support for multiple HTTP methods and focus areas</li>
                  <li>Real-time test execution against your API endpoints</li>
                  <li>Detailed results with performance metrics</li>
                  <li>Export results in JSON and CSV formats</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Rate Limiting</h3>
                <p className="text-muted-foreground">
                  TestForge implements rate limiting to prevent abuse. You can generate and execute up to 10 requests per minute.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Privacy</h3>
                <p className="text-muted-foreground">
                  Your API endpoints and test results are not stored on our servers. All data is processed in memory during your session.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
