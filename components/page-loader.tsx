'use client';

import { useEffect, useState } from 'react';

export function PageLoader() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => {
      // Only show loader for actual navigation delays
      const timer = setTimeout(() => setIsLoading(true), 200);
      return () => clearTimeout(timer);
    };

    const handleStop = () => {
      setIsLoading(false);
    };

    // Handle visibility changes for fast navigation
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsLoading(false);
      }
    };

    window.addEventListener('beforeunload', handleStart);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-[9999] flex items-center justify-center pointer-events-none">
      <div className="space-y-3 text-center">
        <div className="flex justify-center gap-1">
          <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '80ms' }} />
          <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '160ms' }} />
        </div>
        <p className="text-xs text-muted-foreground font-mono">Loading...</p>
      </div>
    </div>
  );
}
