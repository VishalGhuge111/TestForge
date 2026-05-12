'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Copy, FolderOpen, FolderPlus, Pencil, Play, Search, Trash2 } from 'lucide-react';
import type { TestCase, TestCollection } from '@/lib/types';

interface SavedTestsPanelProps {
  collections: TestCollection[];
  selectedTestCaseId: string;
  selectedTestCaseName: string;
  selectedCollectionId: string;
  isRenamingSelectedTestCase: boolean;
  onSelectTestCase: (testCase: TestCase) => void;
  onReplayTestCase: (testCase: TestCase) => void;
  onDuplicateTestCase: (testCase: TestCase) => void;
  onDeleteTestCase: (testCase: TestCase) => void;
  onMoveTestCase: (testCaseId: string, collectionId: string) => void;
  onSelectedTestNameChange: (value: string) => void;
  onBeginRenameSelectedTestCase: () => void;
  onRenameSelectedTestCase: () => void;
  onCancelSelectedTestRename?: () => void;
}

type SavedTestEntry = TestCase & { collectionName?: string };

export function SavedTestsPanel({
  collections,
  selectedTestCaseId,
  selectedTestCaseName,
  selectedCollectionId,
  isRenamingSelectedTestCase,
  onSelectTestCase,
  onReplayTestCase,
  onDuplicateTestCase,
  onDeleteTestCase,
  onMoveTestCase,
  onSelectedTestNameChange,
  onBeginRenameSelectedTestCase,
  onRenameSelectedTestCase,
  onCancelSelectedTestRename,
}: SavedTestsPanelProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(true);
  const [showCollectionSelect, setShowCollectionSelect] = useState<string | null>(null);

  const savedTests = useMemo<SavedTestEntry[]>(() => {
    return collections
      .flatMap((collection) =>
        collection.testCases.map((testCase) => ({
          ...testCase,
          collectionName: collection.name,
        }))
      )
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }, [collections]);

  const filteredTests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return savedTests.slice(0, 10);

    return savedTests
      .filter((testCase) => {
        const searchable = [
          testCase.name,
          testCase.request.method,
          testCase.request.url,
          testCase.collectionName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchable.includes(normalized);
      })
      .slice(0, 10);
  }, [query, savedTests]);

  return (
    <section className="space-y-2 border-t border-border/20 pt-4 min-w-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between gap-2 px-1">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left cursor-pointer">
              <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Saved Tests</h3>
            </button>
          </CollapsibleTrigger>
          <Badge variant="secondary" className="text-[10px] h-5">
            {savedTests.length}
          </Badge>
        </div>

        <CollapsibleContent className="space-y-3 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search saved tests"
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="max-h-80 overflow-y-auto pr-1 space-y-2">
            {filteredTests.length === 0 ? (
              <p className="px-2 py-3 text-[11px] text-muted-foreground">No saved tests match this filter.</p>
            ) : (
              filteredTests.map((testCase) => {
                const isSelected = selectedTestCaseId === testCase.id;

                return (
                  <div
                    key={testCase.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectTestCase(testCase)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectTestCase(testCase);
                      }
                    }}
                    className={`rounded border px-2 py-1 transition cursor-pointer min-w-0 ${
                      isSelected
                        ? 'border-primary/30 bg-background/70 text-foreground shadow-sm'
                        : 'border-border/20 bg-background/50 text-muted-foreground hover:bg-muted/60 hover:border-border/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-mono font-semibold text-foreground truncate">{testCase.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground shrink-0">
                            {testCase.request.method}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono truncate text-muted-foreground">{testCase.request.url}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <FolderOpen className="w-3 h-3" />
                            {testCase.collectionName || 'Unassigned'}
                          </span>
                          {testCase.assertions.length > 0 && <span>{testCase.assertions.length} assertions</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(event) => {
                            event.stopPropagation();
                            onReplayTestCase(testCase);
                          }}
                          title="Replay"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDuplicateTestCase(testCase);
                          }}
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(event) => {
                            event.stopPropagation();
                            setShowCollectionSelect(
                              showCollectionSelect === testCase.id ? null : testCase.id
                            );
                          }}
                          title="Move to collection"
                        >
                          <FolderPlus className="w-3 h-3" />
                        </Button>
                        {isSelected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(event) => {
                              event.stopPropagation();
                              onBeginRenameSelectedTestCase();
                            }}
                            title="Rename"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteTestCase(testCase);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                      {showCollectionSelect === testCase.id ? (
                        <Select
                          value={testCase.collectionId || selectedCollectionId || ''}
                          onValueChange={(collectionId) => {
                            onMoveTestCase(testCase.id, collectionId);
                            setShowCollectionSelect(null);
                          }}
                        >
                          <SelectTrigger className="h-7 text-[10px] flex-1 min-w-0">
                            <SelectValue placeholder="Assign collection" />
                          </SelectTrigger>
                          <SelectContent>
                            {collections.map((collection) => (
                              <SelectItem
                                key={collection.id}
                                value={collection.id}
                                className="cursor-pointer"
                              >
                                {collection.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}
                    </div>

                    {isSelected && isRenamingSelectedTestCase && (
                      <div className="mt-2 space-y-2" onClick={(event) => event.stopPropagation()}>
                        <Input
                          value={selectedTestCaseName}
                          onChange={(event) => onSelectedTestNameChange(event.target.value)}
                          autoFocus
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              onRenameSelectedTestCase();
                            }
                            if (event.key === 'Escape') {
                              event.preventDefault();
                              onCancelSelectedTestRename?.();
                            }
                          }}
                          className="h-7 text-xs"
                          placeholder="Rename saved test"
                        />
                        <Button size="sm" variant="default" className="h-7 text-[10px] w-full" onClick={onRenameSelectedTestCase}>
                          Rename
                        </Button>
                      </div>
                    )}
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