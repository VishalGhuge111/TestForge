'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { AISettings } from '@/components/ai-insights/AISettings';
import { Github, Zap } from 'lucide-react';

interface NavbarProps {
  showLaunchButton?: boolean;
  isBeginnerMode?: boolean;
  onBeginnerModeChange?: (enabled: boolean) => void;
  aiAvailable?: boolean;
}

export function Navbar({ 
  showLaunchButton = true,
  isBeginnerMode = false,
  onBeginnerModeChange,
  aiAvailable = true,
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 border-b-2 border-primary/20 bg-background/80 backdrop-blur-xl w-full">
      <div className="w-full px-0 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer active:scale-95 pl-4">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-md flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg dark:text-white text-black">TestForge</span>
        </Link>
        <div className="flex items-center gap-1 pr-4">
          <Link href="/docs" className="text-xs font-medium text-muted-foreground hover:text-foreground transition px-3 py-1.5 rounded hover:bg-muted">
            Docs
          </Link>
          <ThemeToggle />
          {onBeginnerModeChange && (
            <AISettings
              isBeginnerMode={isBeginnerMode}
              onBeginnerModeChange={onBeginnerModeChange}
              aiAvailable={aiAvailable}
            />
          )}
          <a
            href="https://github.com/VishalGhuge111/TestForge"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition cursor-pointer p-2 rounded-md hover:bg-muted"
          >
            <Github className="w-5 h-5" />
          </a>
          {showLaunchButton && (
            <Link href="/inspector" className="hidden md:block">
              <Button className="cursor-pointer ml-2">
                Launch Inspector
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>  
  );
}
