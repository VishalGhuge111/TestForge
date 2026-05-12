'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Save } from 'lucide-react';
import type { HTTPRequest, HTTPMethod } from '@/lib/types';

interface CollectionOption {
  id: string;
  name: string;
}

export interface RequestBuilderHandle {
  getRequest: () => HTTPRequest;
  loadRequest: (request: HTTPRequest) => void;
  reset: () => void;
}

interface RequestBuilderProps {
  onSubmit: (request: HTTPRequest) => void;
  isLoading?: boolean;
  onCancel?: () => void;
  onSave?: (request: HTTPRequest, collectionId: string, testName?: string) => void;
  onSaveAsNew?: (request: HTTPRequest, collectionId: string, testName?: string) => void;
  collectionOptions?: CollectionOption[];
  saveCollectionId?: string;
  onSaveCollectionChange?: (collectionId: string) => void;
  editingTestId?: string;
}

const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const RequestBuilder = forwardRef<RequestBuilderHandle, RequestBuilderProps>(function RequestBuilder(
  { onSubmit, isLoading = false, onCancel, onSave, onSaveAsNew, collectionOptions = [], saveCollectionId = '', onSaveCollectionChange, editingTestId },
  ref,
) {
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [method, setMethod] = useState<HTTPMethod>('GET');
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [body, setBody] = useState('');
  const [timeout, setTimeout] = useState(15000);
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic'>('none');
  const [authCredentials, setAuthCredentials] = useState('');
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  const [showInlineSave, setShowInlineSave] = useState(false);
  const [inlineName, setInlineName] = useState('');
  const [inlineCollection, setInlineCollection] = useState(saveCollectionId || (collectionOptions[0]?.id ?? ''));

  useImperativeHandle(ref, () => ({
    getRequest: () => ({
      url,
      method,
      headers,
      body: body || undefined,
      timeout,
      auth:
        authType !== 'none'
          ? { type: authType, credentials: authCredentials }
          : undefined,
    }),
    loadRequest: (request) => {
      setUrl(request.url || '');
      setMethod(request.method || 'GET');
      setHeaders(request.headers || {});
      setBody(request.body || '');
      setTimeout(request.timeout || 15000);
      setAuthType(request.auth?.type || 'none');
      setAuthCredentials(request.auth?.credentials || '');
    },
    reset: () => {
      setUrl('');
      setMethod('GET');
      setHeaders({});
      setBody('');
      setTimeout(15000);
      setAuthType('none');
      setAuthCredentials('');
      setHeaderKey('');
      setHeaderValue('');
    },
  }), [authCredentials, authType, body, headers, method, timeout, url]);

  const handleAddHeader = () => {
    if (headerKey.trim()) {
      setHeaders((prev) => ({ ...prev, [headerKey]: headerValue }));
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    setHeaders((prev) => {
      const newHeaders = { ...prev };
      delete newHeaders[key];
      return newHeaders;
    });
  };

  const buildRequest = (): HTTPRequest => ({
    url,
    method,
    headers,
    body: body || undefined,
    timeout,
    auth: authType !== 'none' ? { type: authType, credentials: authCredentials } : undefined,
  });

  const handleSubmit = () => onSubmit(buildRequest());
  const handleSave = () => onSave?.(buildRequest(), saveCollectionId);

  const handleInlineSaveConfirm = () => {
    onSave?.(buildRequest(), inlineCollection);
    setShowInlineSave(false);
    setInlineName('');
  };

  const handleSaveAsNewConfirm = () => {
    onSaveAsNew?.(buildRequest(), inlineCollection);
    setShowInlineSave(false);
    setInlineName('');
  };

  const openInlineSave = () => {
    setShowInlineSave(true);
    setInlineCollection(saveCollectionId || collectionOptions[0]?.id || '');
    setInlineName('');
  };

  const closeInlineSave = () => {
    setShowInlineSave(false);
    setInlineName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4 md:space-y-5">
      {/* URL Input */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 block">URL</label>
        <Input
          placeholder="https://api.example.com/endpoint"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          className="font-mono text-sm bg-muted/40"
        />
      </div>

      {/* Method & Timeout */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 block">Method</label>
          <Select value={method} onValueChange={(v: HTTPMethod) => setMethod(v)}>
            <SelectTrigger className="cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map((m) => (
                <SelectItem key={m} value={m} className="cursor-pointer">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 block">Timeout</label>
          <Input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(parseInt(e.target.value) || 15000)}
            min="1000"
            max="60000"
            disabled={isLoading}
            className="cursor-text"
          />
        </div>
      </div>

      {/* Authentication */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 block">Auth</label>
        <div className="space-y-2">
          <Select value={authType} onValueChange={(v: 'none' | 'bearer' | 'basic') => setAuthType(v)}>
            <SelectTrigger className="cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="cursor-pointer">None</SelectItem>
              <SelectItem value="bearer" className="cursor-pointer">Bearer Token</SelectItem>
              <SelectItem value="basic" className="cursor-pointer">Basic Auth</SelectItem>
            </SelectContent>
          </Select>
          {authType !== 'none' && (
            <Input
              placeholder={authType === 'bearer' ? 'Your token' : 'username:password (base64)'}
              value={authCredentials}
              onChange={(e) => setAuthCredentials(e.target.value)}
              type="password"
              disabled={isLoading}
            />
          )}
        </div>
      </div>

      {/* Headers */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 block">Headers</label>
        <div className="space-y-2">
          {Object.entries(headers).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded-md hover:bg-muted/80 transition">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-foreground">{key}</p>
                <p className="text-xs text-muted-foreground truncate">{value}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleRemoveHeader(key)} disabled={isLoading} className="cursor-pointer">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Header name"
              value={headerKey}
              onChange={(e) => setHeaderKey(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') handleAddHeader(); }}
              disabled={isLoading}
              className="flex-1"
            />
            <Input
              placeholder="Header value"
              value={headerValue}
              onChange={(e) => setHeaderValue(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') handleAddHeader(); }}
              disabled={isLoading}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={handleAddHeader} disabled={isLoading || !headerKey.trim()} className="cursor-pointer shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 block">Body</label>
          <Textarea
            placeholder='{"key": "value"}'
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isLoading}
            className="font-mono text-sm"
            rows={6}
          />
        </div>
      )}

      {/* ── Action Area ── */}
      <div className="space-y-2">

        {/* ROW 1: Send Request — always full width, cancel only when loading */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !url}
            className={`w-full cursor-pointer font-semibold relative overflow-hidden group ${isLoading ? 'animate-pulse' : ''}`}
            style={isLoading ? { backgroundImage: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))' } : undefined}
            onKeyPress={handleKeyPress}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="relative w-4 h-4">
                  <div
                    className="absolute inset-0 rounded-full animate-spin"
                    style={{ backgroundImage: 'linear-gradient(to right, white, transparent)' }}
                  />
                </div>
                <span className="font-mono">Executing...</span>
              </div>
            ) : (
              <>
                <span className="relative z-10">Send Request</span>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }}
                />
              </>
            )}
          </Button>
          {isLoading && onCancel && (
            <Button variant="outline" onClick={onCancel} className="w-12 cursor-pointer hover:border-red-400 hover:text-red-400">
              ✕
            </Button>
          )}
        </div>

        {/* ROW 2: Save area */}
        {onSave && (
          editingTestId ? (
            /* ── Editing an existing test ── */
            showInlineSave ? (
              /* "Save As New" inline UI — one row on desktop, stacked on mobile */
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={inlineCollection} onValueChange={(v) => setInlineCollection(v)}>
                  <SelectTrigger className="cursor-pointer h-9 sm:w-40 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {collectionOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="cursor-pointer">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Test name"
                  value={inlineName}
                  onChange={(e) => setInlineName(e.target.value)}
                  className="h-9 text-sm flex-1 min-w-0"
                />
                <Button
                  onClick={handleSaveAsNewConfirm}
                  disabled={isLoading || !url}
                  className="cursor-pointer shrink-0 h-9"
                >
                  Save As New
                </Button>
                <Button
                  variant="outline"
                  onClick={closeInlineSave}
                  className="cursor-pointer shrink-0 h-9 border-border text-foreground hover:bg-muted hover:text-foreground"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              /* Normal editing row: collection select + Save Test + Save As New */
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={saveCollectionId} onValueChange={(value) => onSaveCollectionChange?.(value)}>
                  <SelectTrigger className="cursor-pointer h-9 sm:w-40 shrink-0">
                    <SelectValue placeholder="General" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectionOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="cursor-pointer">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isLoading || !url}
                  className="cursor-pointer h-9 border-border text-foreground hover:bg-muted hover:text-foreground"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Test
                </Button>
                {onSaveAsNew && (
                  <Button
                    variant="outline"
                    onClick={openInlineSave}
                    disabled={isLoading || !url}
                    className="cursor-pointer h-9 border-border text-foreground hover:bg-muted hover:text-foreground"
                  >
                    Save As New
                  </Button>
                )}
              </div>
            )
          ) : (
            /* ── New test mode ── */
            showInlineSave ? (
              /* Inline save: collection dropdown + name input + Save + Cancel — one row on desktop, stacked on mobile */
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={inlineCollection} onValueChange={(v) => setInlineCollection(v)}>
                  <SelectTrigger className="cursor-pointer h-9 sm:w-40 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {collectionOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="cursor-pointer">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Test name"
                  value={inlineName}
                  onChange={(e) => setInlineName(e.target.value)}
                  className="h-9 text-sm flex-1 min-w-0"
                />
                <Button
                  onClick={handleInlineSaveConfirm}
                  disabled={isLoading || !url}
                  className="cursor-pointer shrink-0 h-9"
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={closeInlineSave}
                  className="cursor-pointer shrink-0 h-9 border-border text-foreground hover:bg-muted hover:text-foreground"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              /* Just the Save Test trigger — auto width */
              <Button
                variant="outline"
                onClick={openInlineSave}
                disabled={isLoading || !url}
                className="cursor-pointer w-auto h-9 border-border text-foreground hover:bg-muted hover:text-foreground"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save Test
              </Button>
            )
          )
        )}

        {/* Ctrl+Enter shortcut — hidden while loading or inline save is open */}
        {!isLoading && !showInlineSave && (
          <p className="text-xs text-muted-foreground text-center font-mono">
            Shortcut:{' '}
            <kbd
              className="border border-primary/30 px-1.5 py-0.5 rounded text-foreground font-mono"
              style={{ backgroundImage: 'linear-gradient(to right, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.2))' }}
            >
              Ctrl+Enter
            </kbd>
          </p>
        )}
      </div>
    </div>
  );
});
