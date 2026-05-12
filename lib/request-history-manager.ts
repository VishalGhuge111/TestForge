import type { HistoryItem, HTTPRequest, HTTPResponse, RequestError, ExecutionState } from './types';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'testforge_request_history';
const MAX_HISTORY_ITEMS = 30;

export class RequestHistoryManager {
  static loadHistory(): HistoryItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored) as HistoryItem[];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY_ITEMS) : [];
    } catch {
      console.error('[v0] Failed to load request history');
      return [];
    }
  }

  static saveRequest(
    request: HTTPRequest,
    state: ExecutionState,
    response?: HTTPResponse,
    error?: RequestError,
    duration?: number
  ): HistoryItem {
    const item: HistoryItem = {
      id: nanoid(),
      request,
      response: response && state === 'success' ? { ...response } : undefined,
      error: error && state === 'error' ? error : undefined,
      timestamp: new Date().toISOString(),
      duration: duration || 0,
      state,
    };

    if (typeof window === 'undefined') return item;

    try {
      const history = this.loadHistory();
      const updated = [item, ...history].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('[v0] Failed to save request to history:', err);
    }

    return item;
  }

  static clearHistory(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('[v0] Failed to clear history:', err);
    }
  }

  static deleteItem(id: string): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.loadHistory();
      const updated = history.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('[v0] Failed to delete history item:', err);
    }
  }

  static exportAsJson(): string {
    const history = this.loadHistory();
    return JSON.stringify(history, null, 2);
  }

  static getStorageSize(): number {
    if (typeof window === 'undefined') return 0;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Blob([stored]).size : 0;
    } catch {
      return 0;
    }
  }
}
