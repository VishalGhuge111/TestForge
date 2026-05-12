'use client';

import React, { useState } from 'react';
import { HelpCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequestError } from '@/lib/types';
import type { AIExplanation, BeginnerExplanation } from '@/lib/ai-types';

interface ExplainErrorButtonProps {
  error: RequestError;
  onExplanationReceived: (explanation: AIExplanation | BeginnerExplanation) => void;
  isBeginnerMode: boolean;
  status?: number;
  method?: string;
  responseSnippet?: string;
}

export function ExplainErrorButton({
  error,
  onExplanationReceived,
  isBeginnerMode,
  status,
  method,
  responseSnippet,
}: ExplainErrorButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const handleExplain = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          errorCategory: error.category,
          errorMessage: error.message,
          responseSnippet,
          method,
          isBeginnerMode,
        }),
      });
      
      const data = await response.json();
      
      if (data.isAvailable && data.explanation) {
        onExplanationReceived(data.explanation);
      } else {
        setHasError(true);
      }
    } catch (err) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleExplain}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Explaining...
          </>
        ) : (
          <>
            <HelpCircle className="w-4 h-4" />
            Explain Failure
          </>
        )}
      </Button>
      
      {hasError && (
        <span className="text-xs text-red-600 dark:text-red-400">
          Failed to explain error
        </span>
      )}
    </div>
  );
}
