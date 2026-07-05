/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
import { useState, useEffect } from 'react';
import { ApiEndpoint } from '../types/database';
import { api } from '../lib/api';

type FetchProgress = { 
  current: number; 
  total: number; 
  status?: string; 
  download_loaded?: number; 
  download_total?: number; 
  download_speed?: number;
};

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
      this._startPolling(endpoint.id, onComplete);
    } catch (err) {
      console.error('Failed to start fetch:', err);
      this.finishFetch(endpoint.id, onComplete);
    }
  }

  async restoreFetches(onCompleteMap?: Record<string, () => void>) {
    try {
      const { activeIds } = await api.getActiveSyncs();
      activeIds.forEach(id => {
        if (!this.fetchingIds.has(id)) {
          this.fetchingIds.add(id);
          this._startPolling(id, onCompleteMap?.[id]);
        }
      });
      if (activeIds.length > 0) this.notify();
    } catch (err) {
      console.error('Failed to restore fetches:', err);
    }
  }

  private _startPolling(id: string, onComplete?: () => void) {
    if (this.pollIntervals[id]) clearInterval(this.pollIntervals[id]);
    
    this.pollIntervals[id] = setInterval(async () => {
      try {
        const status = await api.getSyncStatus(id);
        
        if (status.status === 'idle') {
          this.finishFetch(id, onComplete);
        } else if (status.status === 'running' || status.status === 'downloading') {
          this.fetchProgress[id] = { 
            current: status.current, 
            total: status.total,
            status: status.status,
            download_loaded: status.download_loaded,
            download_total: status.download_total,
            download_speed: status.download_speed
          };
          this.notify();
        } else if (status.status === 'completed' || status.status === 'partial' || status.status === 'error') {
          this.finishFetch(id, onComplete);
        }
      } catch (err) {
        console.error('Failed to get sync status:', err);
        this.finishFetch(id, onComplete);
      }
    }, 1000);
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
    restoreFetches: (onCompleteMap?: Record<string, () => void>) => fetchStore.restoreFetches(onCompleteMap),
  };
}
