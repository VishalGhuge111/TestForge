'use client';

import React from 'react';
import { ChevronDown, Zap, AlertTriangle, ShieldAlert, Lightbulb } from 'lucide-react';
import { ResponseAnomaly, SecurityWarning, AssertionSuggestion, AIExplanation, BeginnerExplanation } from '@/lib/ai-types';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface AIInsightsProps {
  anomalies?: ResponseAnomaly[];
  securityWarnings?: SecurityWarning[];
  suggestions?: AssertionSuggestion[];
  explanation?: AIExplanation | BeginnerExplanation | null;
  isLoading?: boolean;
  onAddSuggestion?: (suggestion: AssertionSuggestion) => void;
  onRefreshExplanation?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AIInsights({
  anomalies = [],
  securityWarnings = [],
  suggestions = [],
  explanation,
  isLoading = false,
  onAddSuggestion,
  onRefreshExplanation,
  isOpen = false,
  onOpenChange,
}: AIInsightsProps) {
  const isMobile = useIsMobile();
  const hasAnyInsights = anomalies.length > 0 || securityWarnings.length > 0 || suggestions.length > 0 || Boolean(explanation);
  
  // Logic updated: Dropdown behavior is now universal
  const shouldShowContent = isOpen && (hasAnyInsights || isLoading);

  const toggleInsights = () => {
    // Logic updated: Allow toggling on all devices
    onOpenChange?.(!isOpen);
  };
  
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/30">
      <button
        onClick={toggleInsights}
        // Style updated: Cursor is now always a pointer
        className="w-full flex items-center justify-between p-0 text-left cursor-pointer"
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          Debug Insights
          {!hasAnyInsights && !isLoading && (
            <span className="text-[11px] normal-case tracking-normal text-muted-foreground ml-2">No current insights</span>
          )}
        </div>
        {/* Logic updated: Chevron is now always visible */}
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
      </button>

      {shouldShowContent && (
        <div className="space-y-3 pt-1">
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                <Lightbulb className="w-4 h-4" />
                Suggested Assertions ({suggestions.length})
              </div>
              <div className="space-y-1.5">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex items-start gap-2 rounded border border-slate-200 bg-white p-2 text-xs transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{suggestion.name}</div>
                      <div className="text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{suggestion.reason}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            suggestion.confidence === 'high'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : suggestion.confidence === 'medium'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {suggestion.confidence} confidence
                        </span>
                      </div>
                    </div>
                    {onAddSuggestion && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent accordion from toggling when clicking the button
                          onAddSuggestion(suggestion);
                        }}
                        className="
                          text-xs
                          cursor-pointer
                          h-7
                          border-orange-500/30
                          hover:border-orange-500
                          hover:bg-orange-500
                          hover:text-white
                          dark:hover:bg-orange-500
                          dark:hover:text-white
                          transition-colors
                        " 
                      >
                        Add
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {anomalies.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                <AlertTriangle className="w-4 h-4" />
                Detected Anomalies ({anomalies.length})
              </div>
              <div className="space-y-1.5">
                {anomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className={`rounded border px-2 py-1.5 text-xs ${
                      anomaly.severity === 'critical'
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        : anomaly.severity === 'warning'
                        ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                        : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                    }`}
                  >
                    <div
                      className={`font-medium ${
                        anomaly.severity === 'critical'
                          ? 'text-red-700 dark:text-red-400'
                          : anomaly.severity === 'warning'
                          ? 'text-yellow-700 dark:text-yellow-400'
                          : 'text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {anomaly.message}
                    </div>
                    {anomaly.suggestion && (
                      <div className="text-slate-600 dark:text-slate-400 mt-1">💡 {anomaly.suggestion}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {securityWarnings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                <ShieldAlert className="w-4 h-4" />
                Security Warnings ({securityWarnings.length})
              </div>
              <div className="space-y-1.5">
                {securityWarnings.map((warning) => (
                  <div
                    key={warning.id}
                    className={`rounded border px-2 py-1.5 text-xs ${
                      warning.severity === 'critical'
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        : warning.severity === 'warning'
                        ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                        : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                    }`}
                  >
                    <div
                      className={`font-medium ${
                        warning.severity === 'critical'
                          ? 'text-red-700 dark:text-red-400'
                          : warning.severity === 'warning'
                          ? 'text-yellow-700 dark:text-yellow-400'
                          : 'text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {warning.message}
                    </div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">📍 {warning.location}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}