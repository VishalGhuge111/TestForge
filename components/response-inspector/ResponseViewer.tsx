'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, Eye, EyeOff, HelpCircle, Loader2 } from 'lucide-react';
import type { HTTPRequest, HTTPResponse, RequestError, ExecutionState } from '@/lib/types';
import type { AIExplanation, BeginnerExplanation, ResponseAnomaly, SecurityWarning } from '@/lib/ai-types';
import { JSONViewer } from './JSONViewer';

interface ResponseViewerProps {
  state: ExecutionState;
  response?: HTTPResponse;
  error?: RequestError;
  request?: HTTPRequest;
  debugExplanation?: AIExplanation | BeginnerExplanation | null;
  debugAnomalies?: ResponseAnomaly[];
  debugWarnings?: SecurityWarning[];
  aiAvailable?: boolean;
  isBeginnerMode?: boolean;
  isLoadingExplanation?: boolean;
  onExplainFailure?: () => void;
}

function isBeginnerExplanation(
  explanation: AIExplanation | BeginnerExplanation
): explanation is BeginnerExplanation {
  return 'simplifiedCause' in explanation;
}

function getExplanationCause(explanation: AIExplanation | BeginnerExplanation) {
  return isBeginnerExplanation(explanation) ? explanation.simplifiedCause : explanation.likelyCause;
}

function getExplanationSteps(explanation: AIExplanation | BeginnerExplanation) {
  return isBeginnerExplanation(explanation) ? explanation.whatToTry : explanation.debuggingSteps;
}

function getExplanationDocs(explanation: AIExplanation | BeginnerExplanation) {
  return isBeginnerExplanation(explanation) ? explanation.learnMore : explanation.relevantDocs;
}

function compactText(value: string, maxLength = 140) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

const STATE_COLORS: Record<ExecutionState, string> = {
  idle: 'bg-muted',
  loading: 'bg-blue-500/10 text-blue-400',
  success: 'bg-green-500/10 text-green-400',
  error: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-yellow-500/10 text-yellow-400',
};

const STATUS_COLORS: Record<string, string> = {
  '2': 'text-green-400',
  '3': 'text-blue-400',
  '4': 'text-yellow-400',
  '5': 'text-red-400',
};

export function ResponseViewer({
  state,
  response,
  error,
  request,
  debugExplanation,
  debugAnomalies = [],
  debugWarnings = [],
  aiAvailable = true,
  isBeginnerMode = false,
  isLoadingExplanation = false,
  onExplainFailure,
}: ResponseViewerProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [showSensitiveValues, setShowSensitiveValues] = useState(false);

  const outgoingHeaders = buildOutgoingHeaders(request);

  if (state === 'idle') {
    return (
      <div className="min-h-64 flex items-center justify-center text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center mx-auto">
            <span className="text-2xl">⊙</span>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">No response yet</p>
            <p className="text-xs text-muted-foreground mt-1">Configure URL and click Send to inspect response</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-xs text-muted-foreground font-mono">Executing request...</p>
        </div>
      </div>
    );
  }

  if (state === 'cancelled') {
    return (
      <div className="min-h-64 flex items-center justify-center text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">⊘</span>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Request cancelled</p>
            <p className="text-xs text-muted-foreground mt-1">Send a new request to start again</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error' && error) {
    const explanationCause = debugExplanation ? getExplanationCause(debugExplanation) : '';
    const explanationChecks = debugExplanation ? getExplanationSteps(debugExplanation) : [];
    const suggestedChecks: string[] = [];

    if (explanationChecks.length > 0) {
      suggestedChecks.push(...explanationChecks);
    }
    if (error.suggestedFix) {
      suggestedChecks.push(error.suggestedFix);
    }
    debugAnomalies.forEach((anomaly) => {
      if (anomaly.suggestion) {
        suggestedChecks.push(anomaly.suggestion);
      }
    });
    debugWarnings.forEach((warning) => {
      suggestedChecks.push(`Review ${warning.location}: ${warning.message}`);
    });

    const checks = Array.from(new Set(suggestedChecks.map((entry) => entry.trim()).filter(Boolean))).slice(0, 3);
    const detailsSummary = [
      `Category: ${error.category}`,
      error.details,
      debugExplanation ? getExplanationDocs(debugExplanation) : '',
    ]
      .filter(Boolean)
      .join(' | ');

    return (
      <div className="space-y-3">
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg space-y-2.5">
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-red-400 mb-1 text-sm">{error.message}</h3>
              <p className="text-xs uppercase tracking-wide text-red-400/70 font-medium">
                {error.category}
              </p>
            </div>
          </div>

          {(debugAnomalies.length > 0 || debugWarnings.length > 0 || debugExplanation || (aiAvailable && onExplainFailure)) && (
            <div className="rounded border border-white/10 bg-background/35 p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">Error Analysis</p>
                  <p className="text-[10px] text-muted-foreground truncate">Compact local diagnostics</p>
                </div>
                {aiAvailable && onExplainFailure && !debugExplanation && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onExplainFailure}
                    disabled={isLoadingExplanation}
                    // UI Updated: Forced orange hover style
                    className="h-7 text-[10px] cursor-pointer transition-colors hover:bg-orange-500! hover:text-white!"
                  >
                    {isLoadingExplanation ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Explaining
                      </>
                    ) : (
                      <>
                        <HelpCircle className="w-3 h-3 mr-1" />
                        Explain Failure
                      </>
                    )}
                  </Button>
                )}
              </div>

              {isLoadingExplanation && (
                <div className="border border-border/30 rounded bg-background/50 px-2 py-2 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
                    Analyzing error...
                  </div>
                </div>
              )}

              {!isLoadingExplanation && (
                <div className="space-y-1.5">
                  <div className="rounded border border-border/30 bg-background/50 px-2 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">CAUSE</p>
                    <p className="text-[11px] text-foreground/85 mt-1 leading-snug line-clamp-2">
                      {compactText(explanationCause || error.suggestedFix || error.message, 150)}
                    </p>
                  </div>

                  <div className="rounded border border-border/30 bg-background/50 px-2 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">CHECK</p>
                    <div className="mt-1 space-y-0.5">
                      {(checks.length > 0 ? checks : ['Retry with corrected URL/method and verify required auth/headers.']).map((check, index) => (
                        <p key={`${index}-${check}`} className="text-[11px] text-muted-foreground leading-snug line-clamp-2">- {compactText(check, 120)}</p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded border border-border/30 bg-background/50 px-2 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">DETAILS</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                      {compactText(detailsSummary || 'No extra diagnostic details available for this failure.', 170)}
                    </p>
                  </div>
                </div>
              )}

              {aiAvailable && onExplainFailure && debugExplanation && !isLoadingExplanation && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onExplainFailure}
                    disabled={isLoadingExplanation}
                    // UI Updated: Forced orange hover style
                    className="h-6 px-2 text-[10px] cursor-pointer transition-colors hover:bg-orange-500! hover:text-white!"
                  >
                    <HelpCircle className="w-3 h-3 mr-1" />
                    Explain Again
                  </Button>
                </div>
              )}
              {!aiAvailable && !debugExplanation && (
                <p className="text-[10px] text-muted-foreground">AI insight unavailable.</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state === 'success' && response) {
    const statusColor = STATUS_COLORS[response.status.toString()[0]] || 'text-gray-400';
    const statusBgColor = statusColor.replace('text-', 'bg-').replace('400', '500/10');

    return (
      <div className="space-y-4">
        {/* Success Animation */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div
            className="p-3 border border-green-500/20 rounded flex items-center gap-3"
            style={{ backgroundImage: 'linear-gradient(to right, rgba(34,197,94,0.10), rgba(34,197,94,0.05), transparent)' }}
          >
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xs text-green-400 font-mono">✓ Response received successfully</p>
          </div>
        </div>

        {/* Response Metadata - Sticky */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-sm -mx-4 -mt-4 px-4 py-3 border-b border-border/20">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className={`p-2 rounded ${statusBgColor}`}>
              <p className="text-xs text-muted-foreground font-mono mb-0.5">status</p>
              <p className={`font-mono font-bold text-sm ${statusColor}`}>
                {response.status}
              </p>
            </div>
            <div className="p-2 rounded bg-blue-500/10">
              <p className="text-xs text-muted-foreground font-mono mb-0.5">duration</p>
              <p className="font-mono font-bold text-sm text-blue-400">{response.duration}ms</p>
            </div>
            <div className="p-2 rounded bg-cyan-500/10">
              <p className="text-xs text-muted-foreground font-mono mb-0.5">size</p>
              <p className="font-mono font-bold text-sm text-cyan-400">{formatBytes(response.size)}</p>
            </div>
            <div className="p-2 rounded bg-purple-500/10 col-span-2 md:col-span-1">
              <p className="text-xs text-muted-foreground font-mono mb-0.5">type</p>
              <p className="font-mono font-bold text-sm text-purple-400 truncate">{response.contentType}</p>
            </div>
          </div>
        </div>

        {/* Response Tabs */}
        <Tabs defaultValue="body" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/40 border border-border/40">
            <TabsTrigger value="body" className="cursor-pointer">Body</TabsTrigger>
            <TabsTrigger value="headers" className="cursor-pointer">Headers</TabsTrigger>
            <TabsTrigger value="raw" className="cursor-pointer">Raw</TabsTrigger>
          </TabsList>

          <TabsContent value="body" className="space-y-2">
            <JSONViewer content={response.body} isJson={response.contentType.includes('json')} />
          </TabsContent>

          <TabsContent value="headers" className="space-y-2">
            <div className="space-y-3 max-h-96 overflow-auto pr-1">
              <HeaderSection
                title="Request Headers Sent"
                subtitle={request ? `${request.method} ${request.url}` : 'Resolved headers passed to the proxy'}
                items={formatHeaders(outgoingHeaders, showSensitiveValues)}
                emptyText="No request headers were sent"
                onCopy={() => copyHeaders(outgoingHeaders)}
                showSensitiveValues={showSensitiveValues}
                onToggleSensitive={() => setShowSensitiveValues((previous) => !previous)}
              />
              <HeaderSection
                title="Response Headers Received"
                subtitle={response ? `${response.status} ${response.statusText}` : 'Response headers from the endpoint'}
                items={formatHeaders(response.headers, true)}
                emptyText="No response headers available"
                onCopy={() => copyHeaders(response.headers)}
                showSensitiveValues={true}
                onToggleSensitive={undefined}
              />
            </div>
          </TabsContent>

          <TabsContent value="raw">
            <ResponseContent content={response.body} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return null;
}

function ResponseContent({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLarge = new Blob([content]).size > 500 * 1024; // 500KB

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 justify-between">
        <p className="text-xs text-muted-foreground">
          {isLarge ? 'Response is too large to display. Download or copy the full response.' : ''}
        </p>
        <div className="flex gap-2">
          {/* UI Updated: Forced orange hover style */}
          <Button variant="outline" size="sm" onClick={handleCopy} className="cursor-pointer transition-colors hover:bg-orange-500! hover:text-white!">
            <Copy className="w-4 h-4 mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          {isLarge && (
            // UI Updated: Forced orange hover style
            <Button variant="outline" size="sm" onClick={() => downloadResponse(content)} className="cursor-pointer transition-colors hover:bg-orange-500! hover:text-white!">
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          )}
        </div>
      </div>
      {!isLarge && (
        <pre className="p-4 bg-card/40 border border-border/40 rounded-lg overflow-auto max-h-96 text-sm font-mono text-muted-foreground">
          {content.substring(0, 10000)}
          {content.length > 10000 && '\n... (truncated, download for full response)'}
        </pre>
      )}
    </div>
  );
}

function HeaderSection({
  title,
  subtitle,
  items,
  emptyText,
  onCopy,
  showSensitiveValues,
  onToggleSensitive,
}: {
  title: string;
  subtitle: string;
  items: Array<{ key: string; value: string; displayValue: string; sensitive: boolean }>;
  emptyText: string;
  onCopy: () => void;
  showSensitiveValues: boolean;
  onToggleSensitive?: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/40 overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/40 bg-card/90 backdrop-blur px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleSensitive && (
            // UI Updated: Forced orange hover style
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] cursor-pointer transition-colors hover:bg-orange-500! hover:text-white!" onClick={onToggleSensitive}>
              {showSensitiveValues ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
              {showSensitiveValues ? 'Hide secrets' : 'Show secrets'}
            </Button>
          )}
          {/* UI Updated: Forced orange hover style */}
          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] cursor-pointer transition-colors hover:bg-orange-500! hover:text-white!" onClick={onCopy}>
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copy
          </Button>
        </div>
      </div>
      <div className="divide-y divide-border/30">
        {items.length === 0 ? (
          <div className="px-3 py-4 text-xs text-muted-foreground">{emptyText}</div>
        ) : (
          items.map((item) => (
            <div key={item.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="font-mono font-semibold text-accent break-all">{item.key}</div>
                <div className="font-mono text-muted-foreground break-all">{item.displayValue}</div>
              </div>
              <div className="flex items-start">
                <button
                  onClick={() => navigator.clipboard.writeText(`${item.key}: ${item.value}`)}
                  className="rounded border border-border/40 px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-orange-500! hover:text-white! transition cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function buildOutgoingHeaders(request?: HTTPRequest): Record<string, string> {
  if (!request) return {};

  const headers: Record<string, string> = { ...(request.headers || {}) };

  if (request.auth?.type === 'bearer' && request.auth.credentials) {
    headers.Authorization = `Bearer ${request.auth.credentials}`;
  } else if (request.auth?.type === 'basic' && request.auth.credentials) {
    headers.Authorization = `Basic ${request.auth.credentials}`;
  }

  if (request.body && !hasHeader(headers, 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function formatHeaders(headers: Record<string, string>, showSensitiveValues: boolean) {
  return Object.entries(headers).map(([key, value]) => ({
    key,
    value,
    displayValue: maskHeaderValue(key, value, showSensitiveValues),
    sensitive: isSensitiveHeader(key),
  }));
}

function copyHeaders(headers: Record<string, string>) {
  const text = Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  void navigator.clipboard.writeText(text);
}

function hasHeader(headers: Record<string, string>, key: string) {
  const lowered = key.toLowerCase();
  return Object.keys(headers).some((header) => header.toLowerCase() === lowered);
}

function isSensitiveHeader(key: string) {
  const lowered = key.toLowerCase();
  return lowered.includes('authorization') || lowered.includes('token') || lowered.includes('secret') || lowered.includes('cookie') || lowered.includes('api-key');
}

function maskHeaderValue(key: string, value: string, showSensitiveValues: boolean) {
  if (showSensitiveValues || !isSensitiveHeader(key)) return value;

  if (key.toLowerCase() === 'authorization') {
    const [scheme, ...rest] = value.split(' ');
    if (rest.length === 0) return '••••••••';
    const token = rest.join(' ');
    return `${scheme} ${token.slice(0, 3)}••••••`;
  }

  if (value.length <= 4) return '••••';
  return `${value.slice(0, 2)}••••${value.slice(-2)}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function downloadResponse(content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `response-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}