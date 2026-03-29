'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Plus, Clock, Zap } from 'lucide-react';

interface RecentAPI {
  url: string;
  method: string;
  timestamp: number;
}

export default function Dashboard() {
  const [recentAPIs, setRecentAPIs] = useState<RecentAPI[]>([]);

  useEffect(() => {
    // Load recent APIs from localStorage
    const stored = localStorage.getItem('testforge_recent_apis');
    if (stored) {
      try {
        setRecentAPIs(JSON.parse(stored).slice(0, 5));
      } catch (e) {
        // Handle invalid JSON
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">TestForge</h1>
          <p className="text-lg text-muted-foreground">
            AI-powered API test case generation. Generate comprehensive test suites in seconds.
          </p>
        </div>

        {/* Main CTA */}
        <div className="mb-12">
          <Link href="/generate">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-5 w-5" />
              Generate Test Cases
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Smart Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI analyzes your API and generates contextual, comprehensive test cases covering edge cases and error scenarios.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Instant Execution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Run all generated tests against your API endpoint in parallel and get detailed results in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Export Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Export test cases and results in JSON or CSV format for integration with your CI/CD pipeline.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent APIs */}
        {recentAPIs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Recent APIs</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentAPIs.map((api, index) => (
                <Link key={index} href={`/generate?url=${encodeURIComponent(api.url)}&method=${api.method}`}>
                  <Card className="cursor-pointer border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-muted-foreground mb-1">{api.method}</p>
                          <p className="text-sm text-foreground truncate">{api.url}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
