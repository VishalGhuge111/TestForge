import type { TestRunHistoryItem } from './types';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'testforge_test_run_history';
const MAX_RUNS = 20;

function canUseStorage(): boolean {
  return typeof window !== 'undefined';
}

function loadRunsFromStorage(): TestRunHistoryItem[] {
  if (!canUseStorage()) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed) ? (parsed as TestRunHistoryItem[]).slice(0, MAX_RUNS) : [];
  } catch {
    return [];
  }
}

export class TestRunHistoryManager {
  static loadRuns(): TestRunHistoryItem[] {
    return loadRunsFromStorage();
  }

  static saveRun(run: Omit<TestRunHistoryItem, 'id' | 'timestamp'>): TestRunHistoryItem {
    const item: TestRunHistoryItem = {
      ...run,
      id: nanoid(),
      timestamp: new Date().toISOString(),
    };

    if (canUseStorage()) {
      try {
        const existing = loadRunsFromStorage();
        const updated = [item, ...existing].slice(0, MAX_RUNS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage failures.
      }
    }

    return item;
  }

  static clearRuns(): void {
    if (!canUseStorage()) return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }
}
