'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { TestAssertion, AssertionResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, CheckCircle, XCircle } from 'lucide-react';

interface AssertionsPanelProps {
  assertions: TestAssertion[];
  results?: AssertionResult[];
  isRunning?: boolean;
  onAddAssertion: (assertion: TestAssertion) => void;
  onRemoveAssertion: (id: string) => void;
}

export function AssertionsPanel({ assertions, results, isRunning = false, onAddAssertion, onRemoveAssertion }: AssertionsPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<TestAssertion>>({
    type: 'statusCode',
    expectedValue: '200',
  });

  const handleAddAssertion = () => {
    if (formData.type && formData.expectedValue !== undefined) {
      const assertion: TestAssertion = {
        id: nanoid(),
        type: formData.type as any,
        name: formData.name || `${formData.type} check`,
        expectedValue: formData.expectedValue as any,
      };
      onAddAssertion(assertion);
      setFormData({ type: 'statusCode', expectedValue: '200' });
      setIsAdding(false);
    }
  };

  const getAssertionResult = (assertionId: string) => {
    return results?.find(r => r.assertion.id === assertionId);
  };

  const assertionLabel: Record<string, string> = {
    statusCode: 'Status Code Equals',
    responseContainsKey: 'Response Contains Key',
    responseContainsValue: 'Response Contains Value',
    responseTimeLessThan: 'Response Time < ms',
    headerExists: 'Header Exists',
    contentTypeIncludes: 'Content-Type Includes',
    bodyIsEmpty: 'Response Body is Empty',
  };

  const summary = results
    ? {
        passed: results.filter((result) => result.passed).length,
        failed: results.filter((result) => !result.passed).length,
        total: results.length,
      }
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Assertions ({assertions.length})</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs h-7 cursor-pointer transition-colors hover:bg-orange-500! hover:text-white!"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      {isAdding && (
        <div className="border border-border/20 rounded p-3 space-y-2 bg-muted/20">
          <Select
            value={formData.type || 'statusCode'}
            onValueChange={(value) => setFormData({ ...formData, type: value as TestAssertion['type'] })}
          >
            <SelectTrigger className="text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="statusCode">Status Code</SelectItem>
              <SelectItem value="responseContainsKey">Response Contains Key</SelectItem>
              <SelectItem value="responseContainsValue">Response Contains Value</SelectItem>
              <SelectItem value="responseTimeLessThan">Response Time Less Than</SelectItem>
              <SelectItem value="headerExists">Header Exists</SelectItem>
              <SelectItem value="contentTypeIncludes">Content-Type Includes</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Expected value"
            value={formData.expectedValue || ''}
            onChange={(e) => setFormData({ ...formData, expectedValue: e.target.value })}
            className="text-xs h-8"
          />

          <Input
            placeholder="Description (optional)"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="text-xs h-8"
          />

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddAssertion}
              className="
                text-xs flex-1 h-7 cursor-pointer
                transition-colors
                bg-slate-900 text-white
                hover:bg-orange-500! hover:text-white!
                dark:bg-slate-100 dark:text-slate-900
                dark:hover:bg-orange-500! dark:hover:text-white!
              "
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAdding(false)}
              className="
                text-xs flex-1 h-7 cursor-pointer
                hover:bg-transparent! hover:text-current!
                dark:hover:bg-transparent! dark:hover:text-current!
                active:scale-100
                transition-none
              "
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {assertions.map((assertion) => {
          const result = getAssertionResult(assertion.id);
          const passed = result?.passed ?? null;

          return (
            <div
              key={assertion.id}
              className="flex items-start gap-2 p-2 rounded border border-border/20 text-xs bg-muted/10"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold">
                    {assertionLabel[assertion.type]}
                  </span>
                  {passed !== null && (
                    passed ? (
                      <CheckCircle className="w-3 h-3 text-green-400" style={{ flexShrink: 0 }} />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" style={{ flexShrink: 0 }} />
                    )
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Expected: {String(assertion.expectedValue)}
                </p>
                {result && (
                  <div className="mt-1 space-y-1">
                    <p className={`text-xs ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                      {result.message || result.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Actual: {String(result.actualValue)}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => onRemoveAssertion(assertion.id)}
                className="text-muted-foreground hover:text-red-400 transition p-1 cursor-pointer"
                style={{ flexShrink: 0 }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {assertions.length === 0 && !isAdding && (
          <p className="text-xs text-muted-foreground text-center py-2">No assertions added yet</p>
        )}
      </div>

      {isRunning && (
        <div className="rounded border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-400 animate-pulse">
          Running assertions...
        </div>
      )}

      {summary && summary.total > 0 && (
        <div className="pt-2 border-t border-border/20 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Summary</span>
            <span className={`font-semibold ${summary.failed === 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.passed}/{summary.total} passed
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-[11px] h-5 px-2">
              Passed {summary.passed}
            </Badge>
            <Badge variant="secondary" className="text-[11px] h-5 px-2">
              Failed {summary.failed}
            </Badge>
            <Badge variant="secondary" className="text-[11px] h-5 px-2">
              Total {summary.total}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}