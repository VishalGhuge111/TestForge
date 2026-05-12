'use client';

import { useState } from 'react';
import { Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JSONViewerProps {
  content: string;
  isJson?: boolean;
}

export function JSONViewer({ content, isJson = false }: JSONViewerProps) {
  const [copied, setCopied] = useState(false);

  let parsed: unknown;
  let parseError = false;

  if (isJson) {
    try {
      parsed = JSON.parse(content);
    } catch {
      parseError = true;
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const size = new Blob([content]).size;
  const isLarge = size > 500 * 1024; // 500KB

  if (!isJson || parseError) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2 justify-end">
          {/* UI Update: Added orange hover and cursor pointer */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            className="cursor-pointer transition-colors hover:bg-orange-500! hover:text-white!"
          >
            <Copy className="w-4 h-4 mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-96 text-sm font-mono whitespace-pre-wrap wrap-break-word">
          {content.substring(0, 5000)}
          {content.length > 5000 && '\n... (truncated)'}
        </pre>
        {parseError && <p className="text-xs text-destructive">Invalid JSON</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 justify-between pb-2 border-b border-border/20">
        <p className="text-xs text-muted-foreground font-mono">{formatBytes(size)}</p>
        {/* UI Update: Added orange hover and cursor pointer */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopy} 
          className="text-xs h-7 cursor-pointer transition-colors hover:bg-orange-500! hover:text-white!"
        >
          <Copy className="w-3 h-3 mr-1" />
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      {isLarge ? (
        <div className="p-3 bg-muted/40 rounded text-xs text-muted-foreground font-mono">
          Large response ({formatBytes(size)}) — preview truncated
        </div>
      ) : (
        <div className="p-3 bg-muted/20 rounded overflow-auto max-h-96 text-sm font-mono space-y-0 leading-relaxed">
          <JSONNode data={parsed} expandLevel={1} />
        </div>
      )}
    </div>
  );
}

function JSONNode({ data, expandLevel, level = 0 }: { data: unknown; expandLevel: number; level?: number }) {
  const [expanded, setExpanded] = useState(level < expandLevel);
  const isObject = typeof data === 'object' && data !== null;
  const isArray = Array.isArray(data);
  const isEmpty = isArray ? (Array.isArray(data) ? data.length === 0 : false) : (isObject ? Object.keys(data as Record<string, unknown>).length === 0 : true);

  if (!isObject) {
    return <span className={getTypeColor(typeof data)}>{JSON.stringify(data)}</span>;
  }

  if (isEmpty) {
    return <span className="text-muted-foreground">{isArray ? '[]' : '{}'}</span>;
  }

  const entries: Array<[string | number, unknown]> = isArray
    ? (Array.isArray(data) ? (data as unknown[]).map((v, i) => [i, v]) : [])
    : Object.entries(data as Record<string, unknown>);

  return (
    <div className="inline">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-0.5 text-accent hover:text-accent/80 transition cursor-pointer p-0"
      >
        {expanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
        <span className="text-muted-foreground">{isArray ? '[' : '{'}</span>
      </button>

      {expanded && (
        <div className="ml-3">
          {entries.map(([key, value], idx) => (
            <div key={`${level}-${String(key)}-${idx}`} className="whitespace-pre-wrap wrap-break-word">
              {!isArray && (
                <>
                  <span className="text-blue-400">"{key}"</span>
                  <span className="text-muted-foreground">: </span>
                </>
              )}
              {typeof value === 'object' && value !== null ? (
                <JSONNode data={value} expandLevel={expandLevel} level={level + 1} />
              ) : (
                <>
                  {typeof value === 'string' && <span className="text-green-400">"{value}"</span>}
                  {typeof value === 'number' && <span className="text-yellow-400">{value}</span>}
                  {typeof value === 'boolean' && <span className="text-purple-400">{String(value)}</span>}
                  {value === null && <span className="text-muted-foreground">null</span>}
                </>
              )}
              {idx < entries.length - 1 && <span className="text-muted-foreground">,</span>}
            </div>
          ))}
        </div>
      )}

      <span className="text-muted-foreground">{isArray ? ']' : '}'}</span>
    </div>
  );
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'string':
      return 'text-green-400';
    case 'number':
      return 'text-yellow-400';
    case 'boolean':
      return 'text-purple-400';
    default:
      return 'text-muted-foreground';
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}