'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Trash2 } from 'lucide-react';
import type { HTTPRequest, HistoryItem } from '@/lib/types';
import { RequestHistoryManager } from '@/lib/request-history-manager';

interface RecentActivityPanelProps {
  history: HistoryItem[];
  onSelectRequest: (request: HTTPRequest) => void;
  onHistoryCleared: () => void;
}

const statusColor = (status: number) => {
  const first = status.toString()[0];
  switch (first) {
    case '2':
      return 'text-green-400';
    case '3':
      return 'text-blue-400';
    case '4':
      return 'text-yellow-400';
    case '5':
      return 'text-red-400';
    default:
      return 'text-muted-foreground';
  }
};

export function RecentActivityPanel({ history, onSelectRequest, onHistoryCleared }: RecentActivityPanelProps) {
  const [open, setOpen] = useState(false);

  const handleClear = () => {
    if (confirm('Clear all request history?')) {
      RequestHistoryManager.clearHistory();
      onHistoryCleared();
    }
  };

  return (
    <section className="space-y-2 border-t border-border/20 pt-4">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between gap-2 px-1">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left cursor-pointer">
              <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Recent Activity</h3>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] h-5">
              {history.length}
            </Badge>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                title="Clear activity"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <CollapsibleContent className="pt-2">
          <div className="max-h-64 overflow-y-auto pr-1 space-y-0.5">
            {history.length === 0 ? (
              <p className="px-2 py-2 text-[10px] text-muted-foreground">No recent activity yet.</p>
            ) : (
              history.slice(0, 10).map((item) => {
                // Truncate URL to ~80 chars for display
                const displayUrl = item.request.url.length > 80
                  ? item.request.url.substring(0, 80) + '…'
                  : item.request.url;
                
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectRequest(item.request)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectRequest(item.request);
                      }
                    }}
                    className="rounded border border-border/20 bg-background/40 px-2 py-1.5 text-[10px] text-muted-foreground transition hover:bg-muted/50 hover:border-border/30 cursor-pointer"
                    title={item.request.url}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1 flex items-center gap-1.5">
                        <span className="font-mono text-[9px] font-semibold bg-muted/70 px-1 py-0.5 rounded text-accent shrink-0">
                          {item.request.method}
                        </span>
                        <span className={`font-mono text-[9px] font-semibold shrink-0 ${item.response ? statusColor(item.response.status) : 'text-muted-foreground'}`}>
                          {item.response ? item.response.status : item.state === 'error' ? '⊘' : '…'}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground/70 shrink-0 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[9px] text-foreground/70 opacity-75">{displayUrl}</p>
                  </div>
                );
              })
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}