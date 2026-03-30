'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { ArrowLeft, Download, Play, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { TestCase, TestResult } from '@/lib/types';

export default function ResultsPage() {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [apiMethod, setApiMethod] = useState('GET');
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load test cases from sessionStorage
    const stored = sessionStorage.getItem('testforge_test_cases');
    const url = sessionStorage.getItem('testforge_api_url');
    const method = sessionStorage.getItem('testforge_api_method');

    if (stored && url && method) {
      setTestCases(JSON.parse(stored));
      setApiUrl(url);
      setApiMethod(method);
    }
  }, []);

  // Fetch AI explanation for a failed test (move outside handleExecute)
  const fetchAIExplanation = async (result: TestResult) => {
    if (!result.statusCode || !result.testCaseId) return;
    setAiLoading((prev) => ({ ...prev, [result.testCaseId]: true }));
    try {
      const res = await fetch('/api/explain-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedStatus: (testCases.find(tc => tc.id === result.testCaseId)?.expectedStatusCode) ?? '',
          actualStatus: result.statusCode,
          endpoint: result.endpoint,
        }),
      });
      if (!res.ok) throw new Error('AI explanation failed');
      const data = await res.json();
      setAiExplanations((prev) => ({ ...prev, [result.testCaseId]: data.explanation }));
    } catch {
      setAiExplanations((prev) => ({ ...prev, [result.testCaseId]: 'No AI insight available.' }));
    } finally {
      setAiLoading((prev) => ({ ...prev, [result.testCaseId]: false }));
    }
  };

  const handleExecute = async () => {
    if (testCases.length === 0) {
      toast.error('No test cases to execute');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute tests');
      }

      const data = await response.json();
      setResults(data.results);
      setAiExplanations({});
      toast.success(`Tests completed: ${data.summary.passed} passed, ${data.summary.failed} failed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to execute tests');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    let content = '';
    let filename = '';

    if (format === 'json') {
      content = JSON.stringify(results, null, 2);
      filename = 'test-results.json';
    } else {
      // CSV format
      const headers = ['Test Case ID', 'Test Case Name', 'Endpoint', 'Method', 'Status', 'Status Code', 'Response Time (ms)', 'Timestamp'];
      const rows = results.map((r) => [
        r.testCaseId,
        r.testCaseName,
        r.endpoint,
        r.method,
        r.status,
        r.statusCode || 'N/A',
        r.responseTime,
        r.timestamp,
      ]);
      content = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
      filename = 'test-results.csv';
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}`);
  };

  if (testCases.length === 0) {
    return (
      <main className="min-h-screen bg-linear-to-br from-background via-background to-muted">
        <div className="container mx-auto px-4 py-8">
          <Link href="/generate" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No test cases found. Please generate test cases first.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const summary = results.length > 0
    ? {
        total: results.length,
        passed: results.filter((r) => r.status === 'passed').length,
        failed: results.filter((r) => r.status === 'failed').length,
        errors: results.filter((r) => r.status === 'error').length,
        successRate: results.length > 0 ? Math.round((results.filter((r) => r.status === 'passed').length / results.length) * 100) : 0,
      }
    : null;

  // --- Categorization logic ---
  function categorizeTest(testCase: TestCase): 'Positive' | 'Negative' | 'Edge' {
    if (testCase.expectedStatusCode === 200) return 'Positive';
    if (testCase.expectedStatusCode && testCase.expectedStatusCode >= 400 && testCase.expectedStatusCode < 500) return 'Negative';
    if (testCase.name?.toLowerCase().includes('edge') || testCase.description?.toLowerCase().includes('edge')) return 'Edge';
    return 'Edge';
  }

  // --- cURL generator ---
  function getCurlCommand(testCase: TestCase): string {
    let cmd = `curl -X ${testCase.method.toUpperCase()} "${testCase.endpoint}"`;
    if (testCase.headers && Object.keys(testCase.headers).length > 0) {
      Object.entries(testCase.headers).forEach(([k, v]) => {
        cmd += ` -H \"${k}: ${v}\"`;
      });
    }
    if (testCase.body) {
      cmd += ` -d '${testCase.body}'`;
    }
    return cmd;
  }

  // --- Confidence tag ---
  function getConfidence(result: TestResult, testCase: TestCase | undefined): 'High' | 'Low' {
    if (!testCase) return 'Low';
    if (result.status === 'passed') return 'High';
    if (result.status === 'failed' && result.statusCode !== testCase.expectedStatusCode) return 'Low';
    return 'High';
  }

  // --- Copy to clipboard ---
  function handleCopyCurl(testCase: TestCase) {
    const curl = getCurlCommand(testCase);
    navigator.clipboard.writeText(curl);
    toast.success('Copied as cURL!');
  }

  // --- Group tests by category ---
  const categorizedResults: Record<'Positive' | 'Negative' | 'Edge', TestResult[]> = {
    Positive: [],
    Negative: [],
    Edge: [],
  };
  results.forEach((result) => {
    const testCase = testCases.find(tc => tc.id === result.testCaseId);
    const cat = categorizeTest(testCase || {} as TestCase);
    categorizedResults[cat].push(result);
  });

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Results</h1>
          <p className="text-muted-foreground">
            {apiMethod} {apiUrl}
          </p>
        </div>

        {/* Test Cases & Results Tabs */}
        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cases">Test Cases ({testCases.length})</TabsTrigger>
            <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
          </TabsList>

          {/* Test Cases Tab */}
          <TabsContent value="cases">
            <div className="space-y-6">
              <div className="flex gap-4">
                <Button
                  onClick={handleExecute}
                  disabled={loading}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Execute Tests
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-4">
                {testCases.map((testCase) => (
                  <Card key={testCase.id}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {testCase.name}
                        <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                          {categorizeTest(testCase)}
                        </span>
                      </CardTitle>
                      {testCase.description && (
                        <CardDescription>{testCase.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">Method:</span>
                          <code className="bg-muted px-2 py-1 rounded text-primary">{testCase.method}</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">Endpoint:</span>
                          <code className="bg-muted px-2 py-1 rounded text-foreground break-all">{testCase.endpoint}</code>
                        </div>
                        {testCase.expectedStatusCode && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">Expected Status:</span>
                            <code className="bg-muted px-2 py-1 rounded">{testCase.expectedStatusCode}</code>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => handleCopyCurl(testCase)}
                        >
                          Copy as cURL
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {results.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No results yet. Execute tests to see results.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Enhanced Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{summary?.total}</p>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{summary?.passed}</p>
                        <p className="text-sm text-muted-foreground">Passed</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{summary?.failed}</p>
                        <p className="text-sm text-muted-foreground">Failed</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-200">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">{summary?.errors}</p>
                        <p className="text-sm text-muted-foreground">Errors</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{summary?.successRate}%</p>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                        <div className="w-full bg-blue-100 rounded h-2 mt-2 flex items-center">
                          <div className="bg-blue-500 h-2 rounded" style={{ width: `${summary?.successRate}%` }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExport('json')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('csv')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>

                {/* Results List - Grouped by Category */}
                {(['Positive', 'Negative', 'Edge'] as const).map((cat) => (
                  categorizedResults[cat].length > 0 && (
                    <div key={cat}>
                      <h2 className="text-lg font-bold mt-6 mb-2">{cat} Tests</h2>
                      <div className="space-y-3">
                        {categorizedResults[cat].map((result) => {
                          const testCase = testCases.find(tc => tc.id === result.testCaseId);
                          const expected = testCase?.expectedStatusCode;
                          const actual = result.statusCode;
                          const confidence = getConfidence(result, testCase);
                          return (
                            <Card
                              key={result.testCaseId}
                              className={
                                result.status === 'passed'
                                  ? 'border-green-200'
                                  : result.status === 'failed'
                                    ? 'border-red-200'
                                    : 'border-yellow-200'
                              }
                            >
                              <CardContent className="pt-6">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      {result.status === 'passed' ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                      ) : result.status === 'failed' ? (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                      ) : (
                                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                                      )}
                                      <span className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap ${
                                        result.status === 'passed'
                                          ? 'bg-green-100 text-green-800'
                                          : result.status === 'failed'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {result.status.toUpperCase()}
                                      </span>
                                      <h3 className="font-semibold ml-2">{result.testCaseName}</h3>
                                      {/* Confidence Tag */}
                                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${confidence === 'High' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{confidence === 'High' ? 'High Confidence Test' : 'Low Confidence (AI assumption)'}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                                      <div>
                                        <span className="font-medium text-muted-foreground">Endpoint:</span>
                                        <code className="bg-muted px-2 py-1 rounded ml-1">{result.endpoint}</code>
                                      </div>
                                      <div>
                                        <span className="font-medium text-muted-foreground">Method:</span>
                                        <code className="bg-muted px-2 py-1 rounded ml-1">{result.method}</code>
                                      </div>
                                      <div>
                                        <span className="font-medium text-muted-foreground">Expected:</span>
                                        <code className="bg-muted px-2 py-1 rounded ml-1">{expected ?? 'N/A'}</code>
                                      </div>
                                      <div>
                                        <span className="font-medium text-muted-foreground">Actual:</span>
                                        <code className="bg-muted px-2 py-1 rounded ml-1">{actual ?? 'N/A'}</code>
                                      </div>
                                      <div>
                                        <span className="font-medium text-muted-foreground">Response Time:</span>
                                        <span className="ml-1 font-medium">{result.responseTime}ms</span>
                                      </div>
                                    </div>
                                    {result.status === 'failed' && (
                                      <div className="mt-3">
                                        <p className="text-sm text-destructive font-semibold">Reason: {result.reason || result.error || 'Unknown'}</p>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="mt-2"
                                          disabled={aiLoading[result.testCaseId]}
                                          onClick={() => fetchAIExplanation(result)}
                                        >
                                          {aiLoading[result.testCaseId] ? <Spinner className="h-4 w-4 mr-2" /> : 'Show AI Insight'}
                                        </Button>
                                        {aiExplanations[result.testCaseId] && (
                                          <div className="mt-2 text-sm text-blue-700 bg-blue-50 rounded p-2">
                                            <span className="font-semibold">AI Insight:</span> {aiExplanations[result.testCaseId]}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {result.status === 'error' && result.error && (
                                      <div className="mt-3">
                                        <p className="text-sm text-destructive">{result.error}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
