import { useState, useEffect } from 'react';
import { ApiEndpoint } from '../types/database';
import { api } from '../lib/api';

type FetchProgress = { current: number; total: number };

class FetchStore {
  fetchingIds = new Set<string>();
  fetchProgress: Record<string, FetchProgress> = {};
  pollIntervals: Record<string, ReturnType<typeof setInterval>> = {};
  listeners = new Set<() => void>();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((l) => l());
  }

  isFetching(id: string) {
    return this.fetchingIds.has(id);
  }

  getProgress(id: string) {
    return this.fetchProgress[id];
  }

  async cancelFetch(id: string) {
    try {
      await api.cancelSync(id);
    } catch (err) {
      console.error('Failed to cancel fetch:', err);
    }
  }

  async startFetch(endpoint: ApiEndpoint, skipOffset: number = 0, onComplete?: () => void) {
    if (this.fetchingIds.has(endpoint.id)) return;

    this.fetchingIds.add(endpoint.id);
    this.notify();

    try {
      await api.startSync(endpoint.id, skipOffset);

      // Start polling status
      this.pollIntervals[endpoint.id] = setInterval(async () => {
        try {
          const status = await api.getSyncStatus(endpoint.id);
          
          if (status.status === 'idle') {
            // Edge case: backend doesn't know about this job anymore
            this.finishFetch(endpoint.id, onComplete);
          } else if (status.status === 'running') {
            this.fetchProgress[endpoint.id] = { current: status.current, total: status.total };
            this.notify();
          } else if (status.status === 'completed' || status.status === 'partial' || status.status === 'error') {
            this.finishFetch(endpoint.id, onComplete);
          }
        } catch (err) {
          console.error('Failed to get sync status:', err);
          this.finishFetch(endpoint.id, onComplete);
        }
      }, 1000);

    } catch (err) {
      console.error('Failed to start fetch:', err);
      this.finishFetch(endpoint.id, onComplete);
    }
  }

  private finishFetch(id: string, onComplete?: () => void) {
    if (this.pollIntervals[id]) {
      clearInterval(this.pollIntervals[id]);
      delete this.pollIntervals[id];
    }
    this.fetchingIds.delete(id);
    delete this.fetchProgress[id];
    this.notify();
    if (onComplete) onComplete();
  }
}

export const fetchStore = new FetchStore();

export function useFetchStore() {
  const [state, setState] = useState({
    fetchingIds: new Set(fetchStore.fetchingIds),
    fetchProgress: { ...fetchStore.fetchProgress },
  });

  useEffect(() => {
    return fetchStore.subscribe(() => {
      setState({
        fetchingIds: new Set(fetchStore.fetchingIds),
        fetchProgress: { ...fetchStore.fetchProgress },
      });
    });
  }, []);

  return {
    fetchingIds: state.fetchingIds,
    fetchProgress: state.fetchProgress,
    startFetch: (endpoint: ApiEndpoint, skipOffset: number = 0, onComplete?: () => void) => fetchStore.startFetch(endpoint, skipOffset, onComplete),
    cancelFetch: (id: string) => fetchStore.cancelFetch(id),
  };
}
