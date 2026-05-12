'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Star } from 'lucide-react';
import type { HTTPRequest, HistoryItem } from '@/lib/types';
import { RequestHistoryManager } from '@/lib/request-history-manager';

interface HistoryPanelProps {
  onSelectRequest: (request: HTTPRequest) => void;
}

export function HistoryPanel({ onSelectRequest }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistory();

    // Load favorites from localStorage
    try {
      const fav = localStorage.getItem('testforge_favorites');
      if (fav) {
        setFavorites(new Set(JSON.parse(fav)));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const loadHistory = () => {
    const items = RequestHistoryManager.loadHistory();
    setHistory(items);
  };

  const handleSelect = (request: HTTPRequest) => {
    onSelectRequest(request);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    RequestHistoryManager.deleteItem(id);
    loadHistory();
  };

  const handleClear = () => {
    if (confirm('Clear all request history?')) {
      RequestHistoryManager.clearHistory();
      setHistory([]);
    }
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
    try {
      localStorage.setItem('testforge_favorites', JSON.stringify([...newFavorites]));
    } catch {
      // Ignore storage errors
    }
  };

  const statusColor = (status: string) => {
    const first = status[0];
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

  return (
    <div className="h-full flex flex-col p-4">
      <div className="px-3 py-2 border-b border-border/20 bg-background/40 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          {history.length} {history.length === 1 ? 'req' : 'reqs'}
        </span>
        {history.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear} 
            className="cursor-pointer text-xs h-6 px-1.5 hover:bg-red-500/10 hover:text-red-400"
            title="Clear all history"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="text-center py-8 px-3">
            <p className="text-xs text-muted-foreground">No history</p>
            <p className="text-xs text-muted-foreground mt-1">Make a request to view it here</p>
          </div>
        ) : (
          <div className="space-y-0.5 p-1.5">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.request)}
                className="w-full text-left p-2 rounded hover:bg-primary/5 border border-transparent hover:border-border/20 transition-all group cursor-pointer"
                title={item.request.url}
              >
                <div className="flex items-start gap-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-mono font-bold bg-muted/60 px-1.5 py-0.5 rounded shrink-0 text-accent">
                        {item.request.method}
                      </span>
                      {item.response && (
                        <span className={`text-xs font-mono font-bold ${statusColor(item.response.status.toString())} shrink-0`}>
                          {item.response.status}
                        </span>
                      )}
                      {item.state === 'error' && <span className="text-xs text-red-400 font-bold shrink-0">✗</span>}
                      {item.state === 'cancelled' && <span className="text-xs text-yellow-400 font-bold shrink-0">⊘</span>}
                    </div>
                    <p className="text-xs text-foreground/80 truncate font-mono mb-0.5">{item.request.url}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => handleToggleFavorite(item.id, e)}
                      className="cursor-pointer p-1 hover:bg-yellow-500/10 rounded"
                      title="Favorite"
                    >
                      <Star
                        className={`w-3 h-3 ${favorites.has(item.id) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`}
                      />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="cursor-pointer p-1 hover:bg-red-500/10 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
