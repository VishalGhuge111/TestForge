'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RequestBuilder, type RequestBuilderHandle } from '@/components/request-builder/RequestBuilder';
import { ResponseViewer } from '@/components/response-inspector/ResponseViewer';
import { AssertionsPanel } from '@/components/test-assertions/AssertionsPanel';
import { AIInsights } from '@/components/ai-insights/AIInsights';
import { SavedTestsPanel } from '@/components/workspace/SavedTestsPanel';
import { RecentActivityPanel } from '@/components/workspace/RecentActivityPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Menu,
  Code2,
  ChevronRight,
  ChevronLeft,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Play,
  ChevronDown,
  Save,
  X,
} from 'lucide-react';
import type {
  AssertionResult,
  Environment,
  ExecutionState,
  HistoryItem,
  HTTPRequest,
  HTTPResponse,
  RequestError,
  TestAssertion,
  TestCase,
  TestCollection,
  TestEnvironmentSnapshot,
} from '@/lib/types';
import type { AssertionSuggestion, ResponseAnomaly, SecurityWarning, AIExplanation, BeginnerExplanation } from '@/lib/ai-types';
import { RequestHistoryManager } from '@/lib/request-history-manager';
import { TestAssertionsManager } from '@/lib/test-assertions-manager';
import { TestCasesManager } from '@/lib/test-cases-manager';
import { TestRunHistoryManager } from '@/lib/test-run-history-manager';
import { detectAnomalies } from '@/lib/anomaly-detector';
import { detectSecurityWarnings } from '@/lib/security-warnings';
import { generateLocalSuggestions } from '@/lib/assertion-suggester';
import { nanoid } from 'nanoid';

const DEBUG_INSIGHTS_OPEN_KEY = 'testforge_debug_insights_open';

export default function InspectorPage() {
  const [state, setState] = useState<ExecutionState>('idle');
  const [response, setResponse] = useState<HTTPResponse>();
  const [error, setError] = useState<RequestError>();
  const [showWorkspace, setShowWorkspace] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 768 : true));
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [assertions, setAssertions] = useState<TestAssertion[]>([]);
  const [assertionResults, setAssertionResults] = useState<AssertionResult[]>([]);
  const [assertionStatus, setAssertionStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const [collections, setCollections] = useState<TestCollection[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [recentRuns, setRecentRuns] = useState<HistoryItem[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [selectedTestCaseId, setSelectedTestCaseId] = useState('');
  const [editingTestCaseId, setEditingTestCaseId] = useState('');
  const [renamingTestCaseId, setRenamingTestCaseId] = useState('');
  const [saveCollectionId, setSaveCollectionId] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [selectedTestNameDraft, setSelectedTestNameDraft] = useState('');
  const [environmentDraftName, setEnvironmentDraftName] = useState('');
  const [environmentDraftJson, setEnvironmentDraftJson] = useState(JSON.stringify({ baseUrl: '', token: '' }, null, 2));
  const [environmentWarnings, setEnvironmentWarnings] = useState<string[]>([]);
  const [lastResolvedRequest, setLastResolvedRequest] = useState<HTTPRequest>();
  const requestBuilderRef = useRef<RequestBuilderHandle | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // AI Features State
  const [isBeginnerMode, setIsBeginnerMode] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | BeginnerExplanation | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AssertionSuggestion[]>([]);
  const [responseAnomalies, setResponseAnomalies] = useState<ResponseAnomaly[]>([]);
  const [securityWarnings, setSecurityWarnings] = useState<SecurityWarning[]>([]);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [isDebugInsightsOpen, setIsDebugInsightsOpen] = useState(false);
  const [lastRequestDuration, setLastRequestDuration] = useState(0);

  const activeEnvironment = useMemo(
    () => environments.find((environment) => environment.isActive) ?? environments[0],
    [environments]
  );

  const selectedCollection = useMemo(
    () => collections.find((collection) => collection.id === selectedCollectionId) ?? collections[0],
    [collections, selectedCollectionId]
  );

  const saveCollection = useMemo(() => {
    return collections.find((collection) => collection.id === saveCollectionId) ?? collections.find((collection) => collection.name === 'General') ?? collections[0];
  }, [collections, saveCollectionId]);

  const parsedEnvironmentDraft = useMemo(() => {
    try {
      const parsed = JSON.parse(environmentDraftJson) as unknown;
      const isObject = Boolean(parsed) && typeof parsed === 'object' && !Array.isArray(parsed);
      return {
        valid: isObject,
        error: isObject ? '' : 'Environment variables must be a JSON object.',
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid JSON. Use a plain object like { "baseUrl": "...", "token": "..." }.',
      };
    }
  }, [environmentDraftJson]);

  const selectedTestCase = useMemo(() => {
    return collections.flatMap((collection) => collection.testCases).find((testCase) => testCase.id === selectedTestCaseId);
  }, [collections, selectedTestCaseId]);

  const reloadWorkspace = () => {
    const nextCollections = TestCasesManager.getAllCollections();
    const nextEnvironments = TestCasesManager.getAllEnvironments();

    setCollections(nextCollections);
    setEnvironments(nextEnvironments);
    setRecentRuns(RequestHistoryManager.loadHistory());
    setResponseAnomalies([]);
    setSecurityWarnings([]);

    if (!selectedCollectionId && nextCollections[0]) {
      setSelectedCollectionId(nextCollections[0].id);
    }

    if (!selectedTestCaseId && nextCollections[0]?.testCases[0]) {
      setSelectedTestCaseId(nextCollections[0].testCases[0].id);
    }
  };

  useEffect(() => {
    let nextCollections = TestCasesManager.getAllCollections();
    let nextEnvironments = TestCasesManager.getAllEnvironments();

    if (nextCollections.length === 0) {
      TestCasesManager.createCollection('General', 'Default test collection');
      nextCollections = TestCasesManager.getAllCollections();
    }

    if (nextEnvironments.length === 0) {
      TestCasesManager.saveEnvironment({
        id: 'environment_default',
        name: 'Default',
        variables: { baseUrl: '', token: '' },
        isActive: true,
      });
      nextEnvironments = TestCasesManager.getAllEnvironments();
    } else if (!nextEnvironments.some((environment) => environment.isActive)) {
      TestCasesManager.setActiveEnvironment(nextEnvironments[0].id);
      nextEnvironments = TestCasesManager.getAllEnvironments();
    }

    setCollections(nextCollections);
    setEnvironments(nextEnvironments);
    setRecentRuns(RequestHistoryManager.loadHistory());
    setSelectedCollectionId(nextCollections[0]?.id ?? '');
    setSelectedTestCaseId(nextCollections[0]?.testCases[0]?.id ?? '');
    setSaveCollectionId((current) => current || nextCollections.find((collection) => collection.name === 'General')?.id || nextCollections[0]?.id || '');
  }, []);

  useEffect(() => {
    if (!selectedTestCase) return;
    setSelectedTestNameDraft(selectedTestCase.name);
  }, [selectedTestCase?.id]);

  useEffect(() => {
    if (!activeEnvironment) return;
    setEnvironmentDraftName(activeEnvironment.name);
    setEnvironmentDraftJson(JSON.stringify(activeEnvironment.variables, null, 2));
  }, [activeEnvironment?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(DEBUG_INSIGHTS_OPEN_KEY);
      if (stored !== null) {
        setIsDebugInsightsOpen(stored === 'true');
      }
    } catch {
      // Ignore storage failures.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(DEBUG_INSIGHTS_OPEN_KEY, String(isDebugInsightsOpen));
    } catch {
      // Ignore storage failures.
    }
  }, [isDebugInsightsOpen]);

  const resolveRequestWithEnvironment = (request: HTTPRequest, environment?: TestEnvironmentSnapshot) => {
    const warnings: string[] = [];
    const mergedEnvironment = environment || activeEnvironment
      ? {
          name: environment?.name || activeEnvironment?.name || 'Active Environment',
          variables: {
            ...(activeEnvironment?.variables || {}),
            ...(environment?.variables || {}),
          },
        }
      : undefined;

    const resolve = (text?: string) => {
      if (text === undefined) return undefined;
      const result = TestCasesManager.resolveEnvVariables(text, mergedEnvironment);
      warnings.push(...result.warnings);
      return result.value;
    };

    const resolvedRequest: HTTPRequest = {
      ...request,
      url: resolve(request.url) ?? request.url,
      headers: request.headers
        ? Object.fromEntries(
            Object.entries(request.headers).map(([key, value]) => [key, resolve(value) ?? value])
          )
        : undefined,
      body: resolve(request.body),
      auth: request.auth
        ? {
            ...request.auth,
            credentials: resolve(request.auth.credentials) ?? request.auth.credentials,
          }
        : undefined,
    };

    return {
      resolvedRequest,
      warnings: Array.from(new Set(warnings)),
    };
  };

  const handleRequest = async (
    request: HTTPRequest,
    options?: {
      environmentOverride?: TestEnvironmentSnapshot;
      assertionsOverride?: TestAssertion[];
      testCase?: TestCase;
    }
  ) => {
    const currentAssertions = options?.assertionsOverride ?? assertions;
    const currentTestCase = options?.testCase ?? selectedTestCase;
    const environmentOverride = options?.environmentOverride;
    const { resolvedRequest, warnings } = resolveRequestWithEnvironment(request, environmentOverride);
    const requestForHistory = resolvedRequest;
    setLastResolvedRequest(resolvedRequest);

    setState('loading');
    setResponse(undefined);
    setError(undefined);
    setAssertionResults([]);
    setAssertionStatus('idle');
    setResponseAnomalies([]);
    setSecurityWarnings([]);
    setAiSuggestions([]);
    setAiExplanation(null);
    setIsLoadingExplanation(false);
    setAiAvailable(true);
    setIsDebugInsightsOpen(false);
    setEnvironmentWarnings(warnings);

    const unresolvedVariableWarning = warnings.find((warning) => warning.startsWith('Undefined variable'));
    if (unresolvedVariableWarning) {
      const variableName = unresolvedVariableWarning.replace('Undefined variable {{', '').replace('}}', '');
      setState('error');
      setError({
        category: 'network',
        message: `Missing environment variable: ${variableName}`,
        suggestedFix: `Define ${variableName} in the active environment before sending the request.`,
      });
      setAiSuggestions([]);
      return;
    }

    try {
      new URL(resolvedRequest.url);
    } catch {
      setState('error');
      setError({
        category: 'network',
        message: 'URL is missing valid protocol or hostname',
        suggestedFix: 'Use an absolute URL with http:// or https:// and a valid host.',
      });
      setAiSuggestions([]);
      return;
    }

    abortControllerRef.current = new AbortController();
    const startTime = Date.now();

    try {
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolvedRequest),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;
      setLastRequestDuration(duration);

      if (data.state === 'success' && data.response) {
        setResponse(data.response);
        setState('success');

        // AI/state: compute current-response insights only
        setResponseAnomalies(detectAnomalies(data.response));
        setSecurityWarnings(detectSecurityWarnings(resolvedRequest));

        if (currentAssertions.length > 0) {
          setAssertionStatus('running');
        }

        RequestHistoryManager.saveRequest(requestForHistory, 'success', data.response, undefined, duration);
        setRecentRuns(RequestHistoryManager.loadHistory());
      } else if (data.state === 'error' && data.error) {
        setError(data.error);
        setState('error');
        
        // Clear success-related AI state
        setResponseAnomalies([]);
        setSecurityWarnings([]);
        setAiSuggestions([]);
        setAiExplanation(null);
        setIsDebugInsightsOpen(false);
        
        RequestHistoryManager.saveRequest(requestForHistory, 'error', undefined, data.error, duration);
        setRecentRuns(RequestHistoryManager.loadHistory());
      }
    } catch {
      const duration = Date.now() - startTime;
      setLastRequestDuration(duration);

      if (abortControllerRef.current?.signal.aborted) {
        setState('cancelled');
        // Clear AI state on cancel
        setResponseAnomalies([]);
        setSecurityWarnings([]);
        setAiSuggestions([]);
        setAiExplanation(null);
        setIsDebugInsightsOpen(false);
        RequestHistoryManager.saveRequest(requestForHistory, 'cancelled', undefined, undefined, duration);
        setRecentRuns(RequestHistoryManager.loadHistory());
      } else {
        const errorObj: RequestError = {
          category: 'network',
          message: 'Failed to send request',
          suggestedFix: 'Check your connection and try again.',
        };
        setError(errorObj);
        setState('error');
        RequestHistoryManager.saveRequest(requestForHistory, 'error', undefined, errorObj, duration);
        setRecentRuns(RequestHistoryManager.loadHistory());
      }
    }

    abortControllerRef.current = null;
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setState('cancelled');
  };

  const handleHistorySelect = (request: HTTPRequest) => {
    setShowWorkspace(false);
    setEditingTestCaseId('');
    void handleRequest(request);
  };

  const handleAddAssertion = (assertion: TestAssertion) => {
    setAssertions((previous) => [...previous, assertion]);
  };

  const handleRemoveAssertion = (id: string) => {
    setAssertions((previous) => previous.filter((assertion) => assertion.id !== id));
  };

  useEffect(() => {
    if (!response || assertions.length === 0) {
      setAssertionResults([]);
      setAssertionStatus('idle');
      return;
    }

    setAssertionStatus('running');
    const results = TestAssertionsManager.evaluateAssertions(assertions, response);
    setAssertionResults(results);
    setAssertionStatus('complete');
  }, [assertions, response]);

  useEffect(() => {
    if (!response || !lastResolvedRequest || state !== 'success') {
      setAiSuggestions([]);
      return;
    }

    const nextSuggestions = generateLocalSuggestions(response, lastResolvedRequest, lastRequestDuration).filter(
      (suggestion) => !assertions.some(
        (assertion) => assertion.type === suggestion.type && String(assertion.expectedValue) === String(suggestion.expectedValue)
      )
    );

    setAiSuggestions(nextSuggestions);
  }, [assertions, lastRequestDuration, lastResolvedRequest, response, state]);

  const handleAddSuggestionAssertion = (suggestion: AssertionSuggestion) => {
    const assertion: TestAssertion = {
      id: nanoid(),
      type: suggestion.type,
      name: suggestion.name,
      expectedValue: suggestion.expectedValue,
      description: suggestion.reason,
    };
    handleAddAssertion(assertion);
  };

  // When adding a suggestion we should remove it from visible suggestions
  // and recompute suggestions immediately from current response + assertions.
  const handleAddSuggestionAndRefresh = (suggestion: AssertionSuggestion) => {
    handleAddSuggestionAssertion(suggestion);

    // remove the suggestion from the list
    setAiSuggestions((previous) => previous.filter((s) => s.id !== suggestion.id));

    // recompute suggestions against updated assertions
    if (response && lastResolvedRequest && state === 'success') {
      const next = generateLocalSuggestions(response, lastResolvedRequest, lastRequestDuration).filter(
        (s) => ![...assertions, { id: 'temp', type: suggestion.type, expectedValue: suggestion.expectedValue }].some(
          (a) => a.type === s.type && String(a.expectedValue) === String(s.expectedValue)
        )
      );
      setAiSuggestions(next);
    }
  };

  const handleExplanationReceived = (explanation: AIExplanation | BeginnerExplanation) => {
    setAiExplanation(explanation);
    setIsLoadingExplanation(false);
  };

  const handleRefreshExplanation = async () => {
    if (!error) return;
    // Clear old explanation immediately when user clicks Explain Again
    setAiExplanation(null);
    setIsLoadingExplanation(true);
    
    try {
      const responseSnippet = response?.body ? response.body.substring(0, 200) : undefined;
      const explainResponse = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: response?.status,
          errorCategory: error.category,
          errorMessage: error.message,
          responseSnippet,
          method: lastResolvedRequest?.method,
          isBeginnerMode,
        }),
      });
      
      const data = await explainResponse.json();
      if (data.isAvailable && data.explanation) {
        setAiExplanation(data.explanation);
      } else {
        setAiAvailable(false);
      }
    } catch (err) {
      console.error('Failed to get explanation:', err);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const handleSaveFromBuilder = (request: HTTPRequest, collectionId: string, testName?: string, forceNew = false) => {
    const targetCollectionId = collectionId || (saveCollection?.id ?? selectedCollection?.id ?? collections[0]?.id ?? TestCasesManager.createCollection('General').id);
    const environmentSnapshot = activeEnvironment
      ? {
          name: activeEnvironment.name,
          variables: { ...activeEnvironment.variables },
        }
      : undefined;
    const timestamp = new Date().toISOString();
    const existingTestCase = !forceNew && editingTestCaseId ? TestCasesManager.getTestCase(editingTestCaseId) : undefined;
    const resolvedName = testName?.trim() || existingTestCase?.name || `${request.method} Request`;

    const testCase: TestCase = {
      id: existingTestCase?.id ?? nanoid(),
      name: resolvedName,
      request,
      assertions: assertions.map((assertion) => ({ ...assertion })),
      environment: environmentSnapshot,
      collectionId: targetCollectionId,
      createdAt: existingTestCase?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    TestCasesManager.saveTestCase(testCase);
    setSelectedCollectionId(targetCollectionId);
    setSelectedTestCaseId(testCase.id);
    setEditingTestCaseId(testCase.id);
    setSelectedTestNameDraft(testCase.name);
    reloadWorkspace();
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    TestCasesManager.createCollection(newCollectionName.trim());
    setNewCollectionName('');
    reloadWorkspace();
  };

  const handleDeleteCollection = (collectionId: string) => {
    const collection = collections.find((entry) => entry.id === collectionId);
    collection?.testCases.forEach((testCase) => {
      TestCasesManager.deleteTestCase(testCase.id);
    });
    TestCasesManager.deleteCollection(collectionId);

    const remainingCollections = TestCasesManager.getAllCollections();
    setSelectedCollectionId(remainingCollections[0]?.id ?? '');
    setSelectedTestCaseId(remainingCollections[0]?.testCases[0]?.id ?? '');
    setSaveCollectionId(remainingCollections.find((collection) => collection.name === 'General')?.id ?? remainingCollections[0]?.id ?? '');
    reloadWorkspace();
  };

  const handleDeleteEnvironment = (environmentId: string) => {
    const all = TestCasesManager.getAllEnvironments();
    const target = all.find((environment) => environment.id === environmentId);

    if (all.length <= 1) {
      setEnvironmentWarnings(['Cannot delete the last environment']);
      return;
    }

    if (!target) {
      setEnvironmentWarnings(['Environment not found']);
      return;
    }

    if (target.name.toLowerCase() === 'default' && target.isActive) {
      setEnvironmentWarnings(['Switch active environment before deleting Default']);
      return;
    }

    if (target.isActive) {
      const fallback = all.find((environment) => environment.id !== environmentId);
      if (fallback) {
        TestCasesManager.setActiveEnvironment(fallback.id);
      }
    }

    TestCasesManager.deleteEnvironment(environmentId);
    const next = TestCasesManager.getAllEnvironments();
    setEnvironments(next);
    if (!next.some((e) => e.isActive)) {
      TestCasesManager.setActiveEnvironment(next[0].id);
    }
    reloadWorkspace();
  };

  const handleSelectTestCase = (testCase: TestCase) => {
    requestBuilderRef.current?.loadRequest(testCase.request);
    setAssertions(testCase.assertions);
    setSelectedTestCaseId(testCase.id);
    setEditingTestCaseId(testCase.id);
    setSelectedTestNameDraft(testCase.name);
    setRenamingTestCaseId('');
    if (testCase.collectionId) {
      setSelectedCollectionId(testCase.collectionId);
    }
  };

  const handleReplayTestCase = (testCase: TestCase) => {
    handleSelectTestCase(testCase);
    void handleRequest(testCase.request, {
      environmentOverride: testCase.environment,
      assertionsOverride: testCase.assertions,
      testCase,
    });
  };

  const handleSaveSelectedTestName = () => {
    if (!selectedTestCase) return;
    const updated = TestCasesManager.renameTestCase(selectedTestCase.id, selectedTestNameDraft.trim() || selectedTestCase.name);
    if (updated) {
      setRenamingTestCaseId('');
      reloadWorkspace();
    }
  };

  const handleCancelSelectedTestRename = () => {
    if (!selectedTestCase) return;
    setSelectedTestNameDraft(selectedTestCase.name);
    setRenamingTestCaseId('');
  };

  const handleBeginRenameSelectedTestCase = () => {
    if (!selectedTestCase) return;
    setSelectedTestNameDraft(selectedTestCase.name);
    setRenamingTestCaseId(selectedTestCase.id);
  };

  const handleMoveTestCase = (testCaseId: string, collectionId: string) => {
    const updated = TestCasesManager.moveTestCaseToCollection(testCaseId, collectionId);
    if (updated) {
      if (selectedTestCaseId === testCaseId) {
        setSelectedCollectionId(collectionId);
        setSelectedTestCaseId(updated.id);
      }
      reloadWorkspace();
    }
  };

  const handleDuplicateTestCase = (testCase: TestCase) => {
    const duplicated = TestCasesManager.duplicateTestCase(testCase.id);
    if (!duplicated) return;

    if (testCase.collectionId) {
      TestCasesManager.addTestCaseToCollection(testCase.collectionId, duplicated);
    }
    setSelectedTestCaseId(duplicated.id);
    reloadWorkspace();
  };

  const handleDeleteTestCase = (testCase: TestCase) => {
    if (testCase.collectionId) {
      TestCasesManager.removeTestCaseFromCollection(testCase.collectionId, testCase.id);
    }
    TestCasesManager.deleteTestCase(testCase.id);

    if (selectedTestCaseId === testCase.id) {
      setSelectedTestCaseId('');
      setAssertions([]);
      setEditingTestCaseId('');
      setRenamingTestCaseId('');
    }
    reloadWorkspace();
  };

  const handleWorkspaceHistoryClear = () => {
    setRecentRuns([]);
  };

  const handleCreateEnvironment = () => {
    if (!newEnvironmentName.trim()) return;

    TestCasesManager.saveEnvironment({
      id: nanoid(),
      name: newEnvironmentName.trim(),
      variables: { baseUrl: '', token: '' },
      isActive: false,
    });
    setNewEnvironmentName('');
    reloadWorkspace();
  };

  const handleSelectEnvironment = (id: string) => {
    TestCasesManager.setActiveEnvironment(id);
    const nextEnvironments = TestCasesManager.getAllEnvironments();
    setEnvironments(nextEnvironments);
    const active = nextEnvironments.find((environment) => environment.id === id);
    if (active) {
      setEnvironmentDraftName(active.name);
      setEnvironmentDraftJson(JSON.stringify(active.variables, null, 2));
    }
  };

  const handleSaveEnvironment = () => {
    if (!activeEnvironment) return;

    try {
      const variables = JSON.parse(environmentDraftJson) as Record<string, string>;
      TestCasesManager.saveEnvironment({
        ...activeEnvironment,
        name: environmentDraftName.trim() || activeEnvironment.name,
        variables,
      });
      setEnvironmentWarnings([]);
      reloadWorkspace();
    } catch {
      setEnvironmentWarnings(['Environment variables must be valid JSON']);
    }
  };

  const handleNewRequest = () => {
    requestBuilderRef.current?.reset?.();
    setAssertions([]);
    setAssertionResults([]);
    setAssertionStatus('idle');
    setResponse(undefined);
    setError(undefined);
    setState('idle');
    setSelectedTestCaseId('');
    setEditingTestCaseId('');
    setSelectedTestNameDraft('');
    setRenamingTestCaseId('');
    setLastResolvedRequest(undefined);
    setLastRequestDuration(0);
    setEnvironmentWarnings([]);

    // Clear AI-related state for true blank request experience.
    setResponseAnomalies([]);
    setSecurityWarnings([]);
    setAiSuggestions([]);
    setAiExplanation(null);
    setIsLoadingExplanation(false);
    setAiAvailable(true);
    setIsDebugInsightsOpen(false);

    setShowWorkspace(false);
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <Navbar 
        showLaunchButton={false} 
        isBeginnerMode={isBeginnerMode}
        onBeginnerModeChange={setIsBeginnerMode}
        aiAvailable={aiAvailable}
      />

      <div className="md:hidden border-b border-border/20 bg-background px-3 py-2.5 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowWorkspace(true)} className="cursor-pointer text-xs">
          <Menu className="w-4 h-4 mr-2" />
          Workspace
        </Button>
        <div className="flex-1 flex items-center justify-end text-xs text-muted-foreground">
          <Code2 className="w-3 h-3 mr-1" />
          {state === 'loading' && 'Sending...'}
          {state === 'success' && 'Success'}
          {state === 'error' && 'Error'}
          {state === 'cancelled' && 'Cancelled'}
          {state === 'idle' && 'Ready'}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* Mobile workspace drawer overlay */}
        <div className={`fixed inset-0 z-40 md:hidden ${showWorkspace ? '' : 'pointer-events-none'}`}>
          <div
            className={`fixed inset-0 bg-black/45 transition-opacity duration-300 ${showWorkspace ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setShowWorkspace(false)}
          />
          <aside
            className={`fixed left-0 top-0 bottom-0 w-80 max-w-[86vw] border-r border-border bg-background shadow-xl transform transition-transform duration-300 ease-out overflow-y-auto ${showWorkspace ? 'translate-x-0' : '-translate-x-full'}`}
            aria-hidden={!showWorkspace}
          >
            <div className="h-full py-4 px-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Workspace</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer" onClick={() => setShowWorkspace(false)} aria-label="Close sidebar">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Collections</h3>
                  <Badge variant="secondary" className="text-[10px] h-5">{collections.length}</Badge>
                </div>
                <div className="flex gap-2">
                  <Input value={newCollectionName} onChange={(event) => setNewCollectionName(event.target.value)} placeholder="New collection" className="h-8 text-xs" />
                  <Button size="sm" variant="outline" onClick={handleCreateCollection} className="h-8 px-2">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <Collapsible key={collection.id} defaultOpen={collection.id === selectedCollectionId}>
                      <div className={`rounded border ${selectedCollectionId === collection.id ? 'border-primary/40 bg-primary/5' : 'border-border/20 bg-background/50'}`}>
                        <div className="flex items-center gap-2 p-2">
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center gap-2 flex-1 text-left cursor-pointer">
                              <ChevronDown className="w-3 h-3 text-muted-foreground" />
                              <FolderOpen className="w-3 h-3 text-primary" />
                              <span className="text-xs font-medium truncate">{collection.name}</span>
                            </button>
                          </CollapsibleTrigger>
                          <Badge variant="secondary" className="text-[10px] h-5">{collection.testCases.length}</Badge>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteCollection(collection.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <CollapsibleContent className="px-2 pb-2 space-y-1">
                          {collection.testCases.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground px-2 py-1">No tests saved yet.</p>
                          ) : (
                            collection.testCases.map((testCase) => (
                              <div
                                key={testCase.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleSelectTestCase(testCase)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleSelectTestCase(testCase);
                                  }
                                }}
                                className={`w-full text-left rounded px-2 py-1.5 text-[11px] border transition cursor-pointer ${selectedTestCaseId === testCase.id ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-transparent hover:border-border/20 hover:bg-muted/60 text-muted-foreground'}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate font-mono">{testCase.name}</span>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <button type="button" onClick={(event) => { event.stopPropagation(); handleReplayTestCase(testCase); }} className="hover:text-foreground">
                                      <Play className="w-3 h-3" />
                                    </button>
                                    <button type="button" onClick={(event) => { event.stopPropagation(); handleDuplicateTestCase(testCase); }} className="hover:text-foreground">
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </section>

              <section className="space-y-3 border-t border-border/20 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Environment</h3>
                  <Badge variant="secondary" className="text-[10px] h-5">{environments.length}</Badge>
                </div>
                <div className="flex gap-2">
                  <Input value={newEnvironmentName} onChange={(event) => setNewEnvironmentName(event.target.value)} placeholder="New environment" className="h-8 text-xs" />
                  <Button size="sm" variant="outline" onClick={handleCreateEnvironment} className="h-8 px-2">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {environments.map((environment) => (
                    <div key={environment.id} className={`w-full flex items-center justify-between rounded border px-2 py-1.5 text-[11px] transition ${environment.id === activeEnvironment?.id ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border/20 bg-background/50 text-muted-foreground hover:bg-muted/50'}`}>
                      <button className="flex-1 text-left truncate cursor-pointer" onClick={() => handleSelectEnvironment(environment.id)}>
                        {environment.name}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]">{environment.id === activeEnvironment?.id ? 'Active' : ''}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 cursor-pointer" onClick={() => handleDeleteEnvironment(environment.id)} title="Delete environment">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded border border-border/20 bg-background/50 p-2 space-y-2">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-foreground">Environment name</p>
                    <Input value={environmentDraftName} onChange={(event) => setEnvironmentDraftName(event.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-foreground">Variables JSON</p>
                    <p className="text-[10px] text-muted-foreground">Use a simple object. Variables like <span className="font-mono">baseUrl</span> and <span className="font-mono">token</span> are resolved before execution.</p>
                    <Textarea value={environmentDraftJson} onChange={(event) => setEnvironmentDraftJson(event.target.value)} className="min-h-28 text-xs font-mono leading-relaxed" />
                  </div>
                  {!parsedEnvironmentDraft.valid && (
                    <p className="text-[11px] text-red-400">{parsedEnvironmentDraft.error}</p>
                  )}
                  <Button size="sm" onClick={handleSaveEnvironment} disabled={!parsedEnvironmentDraft.valid} className="w-full h-8 text-xs">
                    <Save className="w-3 h-3 mr-1" />
                    Save Environment
                  </Button>
                </div>
              </section>

              <SavedTestsPanel
                collections={collections}
                selectedTestCaseId={selectedTestCaseId}
                selectedTestCaseName={selectedTestNameDraft}
                selectedCollectionId={selectedCollectionId}
                isRenamingSelectedTestCase={renamingTestCaseId === selectedTestCaseId}
                onSelectTestCase={handleSelectTestCase}
                onReplayTestCase={handleReplayTestCase}
                onDuplicateTestCase={handleDuplicateTestCase}
                onDeleteTestCase={handleDeleteTestCase}
                onMoveTestCase={handleMoveTestCase}
                onSelectedTestNameChange={setSelectedTestNameDraft}
                onBeginRenameSelectedTestCase={handleBeginRenameSelectedTestCase}
                onRenameSelectedTestCase={handleSaveSelectedTestName}
                onCancelSelectedTestRename={handleCancelSelectedTestRename}
              />

              <RecentActivityPanel
                history={recentRuns}
                onSelectRequest={handleHistorySelect}
                onHistoryCleared={handleWorkspaceHistoryClear}
              />
            </div>
          </aside>
        </div>

        <div className={`hidden md:flex md:flex-col border-r border-border/20 bg-muted/30 overflow-hidden transition-all duration-300 ease-in-out min-w-0 ${historyCollapsed ? 'w-12' : 'w-72'}`}>
          <div className="p-3 border-b border-border/20 bg-background/40 sticky top-0 flex items-center justify-between">
            {!historyCollapsed && <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Workspace</h3>}
            <button
              onClick={() => setHistoryCollapsed((previous) => !previous)}
              className="ml-auto p-1 hover:bg-muted rounded transition cursor-pointer"
              style={{ flexShrink: 0 }}
              title={historyCollapsed ? 'Expand workspace' : 'Collapse workspace'}
            >
              {historyCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronLeft className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
          {!historyCollapsed && (
            <div className="overflow-y-auto p-4 space-y-4">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Collections</h3>
                  <Badge variant="secondary" className="text-[10px] h-5">{collections.length}</Badge>
                </div>
                <div className="flex gap-2">
                  <Input value={newCollectionName} onChange={(event) => setNewCollectionName(event.target.value)} placeholder="New collection" className="h-8 text-xs" />
                  <Button size="sm" variant="outline" onClick={handleCreateCollection} className="h-8 px-2">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <Collapsible key={collection.id} defaultOpen={collection.id === selectedCollectionId}>
                      <div className={`rounded border ${selectedCollectionId === collection.id ? 'border-primary/40 bg-primary/5' : 'border-border/20 bg-background/50'}`}>
                        <div className="flex items-center gap-2 p-2">
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center gap-2 flex-1 text-left cursor-pointer">
                              <ChevronDown className="w-3 h-3 text-muted-foreground" />
                              <FolderOpen className="w-3 h-3 text-primary" />
                              <span className="text-xs font-medium truncate">{collection.name}</span>
                            </button>
                          </CollapsibleTrigger>
                          <Badge variant="secondary" className="text-[10px] h-5">{collection.testCases.length}</Badge>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteCollection(collection.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <CollapsibleContent className="px-2 pb-2 space-y-1">
                          {collection.testCases.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground px-2 py-1">No tests saved yet.</p>
                          ) : (
                            collection.testCases.map((testCase) => (
                              <div
                                key={testCase.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleSelectTestCase(testCase)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleSelectTestCase(testCase);
                                  }
                                }}
                                className={`w-full text-left rounded px-2 py-1.5 text-[11px] border transition cursor-pointer ${selectedTestCaseId === testCase.id ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-transparent hover:border-border/20 hover:bg-muted/60 text-muted-foreground'}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate font-mono">{testCase.name}</span>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <button type="button" onClick={(event) => { event.stopPropagation(); handleReplayTestCase(testCase); }} className="hover:text-foreground">
                                      <Play className="w-3 h-3" />
                                    </button>
                                    <button type="button" onClick={(event) => { event.stopPropagation(); handleDuplicateTestCase(testCase); }} className="hover:text-foreground">
                                      <Copy className="w-3 h-3" />
                                    </button>
                                    <button type="button" onClick={(event) => { event.stopPropagation(); handleDeleteTestCase(testCase); }} className="hover:text-foreground">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </section>

              <section className="space-y-3 border-t border-border/20 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Environment</h3>
                  <Badge variant="secondary" className="text-[10px] h-5">{environments.length}</Badge>
                </div>
                <div className="flex gap-2">
                  <Input value={newEnvironmentName} onChange={(event) => setNewEnvironmentName(event.target.value)} placeholder="New environment" className="h-8 text-xs" />
                  <Button size="sm" variant="outline" onClick={handleCreateEnvironment} className="h-8 px-2">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {environments.map((environment) => (
                    <div key={environment.id} className={`w-full flex items-center justify-between rounded border px-2 py-1.5 text-[11px] transition ${environment.id === activeEnvironment?.id ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border/20 bg-background/50 text-muted-foreground hover:bg-muted/50'}`}>
                      <button className="flex-1 text-left truncate cursor-pointer" onClick={() => handleSelectEnvironment(environment.id)}>
                        {environment.name}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]">{environment.id === activeEnvironment?.id ? 'Active' : ''}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 cursor-pointer" onClick={() => handleDeleteEnvironment(environment.id)} title="Delete environment">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded border border-border/20 bg-background/50 p-2 space-y-2">
                  <Input value={environmentDraftName} onChange={(event) => setEnvironmentDraftName(event.target.value)} className="h-8 text-xs" />
                  <Textarea value={environmentDraftJson} onChange={(event) => setEnvironmentDraftJson(event.target.value)} className="min-h-28 text-xs font-mono" />
                  <Button size="sm" onClick={handleSaveEnvironment} className="w-full h-8 text-xs">
                    <Save className="w-3 h-3 mr-1" />
                    Save Environment
                  </Button>
                </div>
              </section>

              <SavedTestsPanel
                collections={collections}
                selectedTestCaseId={selectedTestCaseId}
                selectedTestCaseName={selectedTestNameDraft}
                selectedCollectionId={selectedCollectionId}
                isRenamingSelectedTestCase={renamingTestCaseId === selectedTestCaseId}
                onSelectTestCase={handleSelectTestCase}
                onReplayTestCase={handleReplayTestCase}
                onDuplicateTestCase={handleDuplicateTestCase}
                onDeleteTestCase={handleDeleteTestCase}
                onMoveTestCase={handleMoveTestCase}
                onSelectedTestNameChange={setSelectedTestNameDraft}
                onBeginRenameSelectedTestCase={handleBeginRenameSelectedTestCase}
                onRenameSelectedTestCase={handleSaveSelectedTestName}
                onCancelSelectedTestRename={handleCancelSelectedTestRename}
              />

              <RecentActivityPanel
                history={recentRuns}
                onSelectRequest={handleHistorySelect}
                onHistoryCleared={handleWorkspaceHistoryClear}
              />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-w-0">
          <div className="w-full md:w-1/2 basis-3/5 md:basis-1/2 border-b md:border-b-0 md:border-r border-border/20 bg-background flex flex-col overflow-hidden min-w-0">
            <div className="px-4 md:px-5 py-3 border-b border-border/20 bg-muted/30 sticky top-0 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Request Builder</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs cursor-pointer" onClick={handleNewRequest}>
                  <Plus className="w-3 h-3 mr-2" />
                  New Request
                </Button>
                <div className="text-xs text-muted-foreground font-mono">
                {state === 'loading' && '⏳ Executing...'}
                {state === 'success' && '✓ Success'}
                {state === 'error' && '✗ Error'}
                {state === 'cancelled' && '⊘ Cancelled'}
                {state === 'idle' && '⊙ Ready'}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 md:p-5">
              {environmentWarnings.length > 0 && (
                <div className="mb-4 rounded border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400 space-y-1">
                  {environmentWarnings.map((warning, idx) => (
                    <div key={`${idx}-${warning}`}>{warning}</div>
                  ))}
                </div>
              )}
              <RequestBuilder
                ref={requestBuilderRef}
                onSubmit={handleRequest}
                onSave={(request, collectionId, testName) => handleSaveFromBuilder(request, collectionId, testName, false)}
                onSaveAsNew={(request, collectionId, testName) => handleSaveFromBuilder(request, collectionId, testName, true)}
                collectionOptions={collections}
                saveCollectionId={saveCollection?.id ?? ''}
                onSaveCollectionChange={setSaveCollectionId}
                isLoading={state === 'loading'}
                onCancel={handleCancel}
                editingTestId={editingTestCaseId}
              />
            </div>
          </div>

          <div className="w-full md:w-1/2 basis-2/5 md:basis-1/2 bg-muted/20 flex flex-col overflow-hidden min-w-0">
            <div className="px-4 md:px-5 py-3 border-b border-border/20 bg-muted/30 sticky top-0">
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Response & Testing</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">
              <AssertionsPanel
                assertions={assertions}
                results={assertionResults}
                isRunning={assertionStatus === 'running'}
                onAddAssertion={handleAddAssertion}
                onRemoveAssertion={handleRemoveAssertion}
              />

              <div className="border-t border-border/20 pt-3 space-y-3">
                {state === 'success' && (responseAnomalies.length > 0 || securityWarnings.length > 0 || aiSuggestions.length > 0) && (
                  <AIInsights
                    anomalies={responseAnomalies}
                    securityWarnings={securityWarnings}
                    suggestions={aiSuggestions}
                      onAddSuggestion={handleAddSuggestionAndRefresh}
                    isOpen={isDebugInsightsOpen}
                    onOpenChange={setIsDebugInsightsOpen}
                  />
                )}

                <ResponseViewer
                  state={state}
                  response={response}
                  error={error}
                  request={lastResolvedRequest}
                  debugExplanation={aiExplanation}
                  debugAnomalies={responseAnomalies}
                  debugWarnings={securityWarnings}
                  aiAvailable={aiAvailable}
                  isBeginnerMode={isBeginnerMode}
                  isLoadingExplanation={isLoadingExplanation}
                  onExplainFailure={handleRefreshExplanation}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
