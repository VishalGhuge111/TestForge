'use client';

import React from 'react';
import { Settings, Lightbulb } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface AISettingsProps {
  isBeginnerMode: boolean;
  onBeginnerModeChange: (enabled: boolean) => void;
  aiAvailable: boolean;
}

export function AISettings({
  isBeginnerMode,
  onBeginnerModeChange,
  aiAvailable,
}: AISettingsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0"
          title="AI Settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="beginner-mode" className="flex items-center gap-2 cursor-pointer">
              <Lightbulb className="w-4 h-4" />
              <span>Beginner Explain Mode</span>
            </Label>
            <Switch
              id="beginner-mode"
              checked={isBeginnerMode}
              onCheckedChange={onBeginnerModeChange}
              disabled={!aiAvailable}
            />
          </div>
          
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <p>
              {isBeginnerMode
                ? '✓ AI explanations will use simple language for learners'
                : 'AI explanations will be technical and detailed'}
            </p>
            
            {!aiAvailable && (
              <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                ⚠️ AI features not available. Set OPENAI_API_KEY to enable.
              </p>
            )}
            
            <p className="text-slate-500 dark:text-slate-500">
              This only affects AI-powered explanations. All other features work regardless.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
