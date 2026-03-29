'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function GeneratePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [url, setUrl] = useState(searchParams.get('url') || '');
  const [method, setMethod] = useState(searchParams.get('method') || 'GET');
  const [testCount, setTestCount] = useState('5');
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([
    'Error Handling',
    'Input Validation',
  ]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const toggleFocusArea = (area: string) => {
    setSelectedFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleValidate = async () => {
    if (!url) {
      toast.error('Please enter an API URL');
      return;
    }

    setValidating(true);
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, method }),
      });

      const data = await response.json();

      if (data.valid) {
        setIsValid(true);
        toast.success('API endpoint is reachable');
      } else {
        setIsValid(false);
        toast.error(data.error || 'API endpoint validation failed');
      }
    } catch (error) {
      setIsValid(false);
      toast.error('Failed to validate API endpoint');
    } finally {
      setValidating(false);
    }
  };

  const handleGenerate = async () => {
    if (!url) {
      toast.error('Please enter an API URL');
      return;
    }

    if (selectedFocusAreas.length === 0) {
      toast.error('Please select at least one focus area');
      return;
    }

    // Save to recent APIs
    const stored = localStorage.getItem('testforge_recent_apis');
    const recent = stored ? JSON.parse(stored) : [];
    const newRecent = [
      { url, method, timestamp: Date.now() },
      ...recent.filter((api: any) => !(api.url === url && api.method === method)),
    ].slice(0, 10);
    localStorage.setItem('testforge_recent_apis', JSON.stringify(newRecent));

    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiSpec: { url, method },
          focusAreas: selectedFocusAreas,
          testCount: parseInt(testCount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate test cases');
      }

      const data = await response.json();
      toast.success(`Generated ${data.count} test cases`);
      
      // Store test cases and navigate to results
      sessionStorage.setItem('testforge_test_cases', JSON.stringify(data.testCases));
      sessionStorage.setItem('testforge_api_url', url);
      sessionStorage.setItem('testforge_api_method', method);
      
      router.push('/results');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate test cases');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">Generate Test Cases</h1>
          <p className="text-muted-foreground mb-8">
            Enter your API details and select focus areas for test generation
          </p>
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Specify the API endpoint you want to test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="url">API Endpoint URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://api.example.com/users"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setIsValid(null);
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={handleValidate}
                    disabled={validating || !url}
                    className="whitespace-nowrap"
                  >
                    {validating ? <Spinner className="h-4 w-4" /> : 'Validate'}
                  </Button>
                </div>
                {isValid === true && (
                  <p className="text-sm text-green-600">✓ API endpoint is reachable</p>
                )}
                {isValid === false && (
                  <p className="text-sm text-destructive">✗ Failed to reach API endpoint</p>
                )}
              </div>

              {/* Method Select */}
              <div className="space-y-2">
                <Label htmlFor="method">HTTP Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Test Count */}
              <div className="space-y-2">
                <Label htmlFor="testCount">Number of Test Cases</Label>
                <Select value={testCount} onValueChange={setTestCount}>
                  <SelectTrigger id="testCount">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 8, 10, 15, 20].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} test cases
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Focus Areas */}
              <div className="space-y-3">
                <Label>Focus Areas</Label>
                <div className="grid grid-cols-1 gap-3">
                  {FOCUS_AREAS.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={area}
                        checked={selectedFocusAreas.includes(area)}
                        onCheckedChange={() => toggleFocusArea(area)}
                      />
                      <label
                        htmlFor={area}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {area}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading || !url || selectedFocusAreas.length === 0}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Test Cases
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function GeneratePage() {
  return (
    <Suspense>
      <GeneratePageInner />
    </Suspense>
  );
}
                    <Spinner className="mr-2 h-4 w-4" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Test Cases
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
