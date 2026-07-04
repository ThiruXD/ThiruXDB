import { useState, useEffect } from 'react';
import { ApiEndpoint } from '../types/database';
import { api } from '../lib/api';

type FetchProgress = { current: number; total: number };

class FetchStore {
  fetchingIds = new Set<string>();
  fetchProgress: Record<string, FetchProgress> = {};
  cancelTokens: Record<string, boolean> = {};
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

  cancelFetch(id: string) {
    this.cancelTokens[id] = true;
    this.notify();
  }

  isCancelled(id: string) {
    return this.cancelTokens[id] === true;
  }

  async startFetch(endpoint: ApiEndpoint, skipOffset: number = 0, onComplete?: () => void) {
    if (this.fetchingIds.has(endpoint.id)) return;

    this.fetchingIds.add(endpoint.id);
    this.cancelTokens[endpoint.id] = false;
    this.notify();

    const startTime = Date.now();
    let status: 'success' | 'error' | 'partial' = 'success';
    let errorMessage: string | null = null;
    let recordsFetched = 0, recordsCreated = 0, recordsUpdated = 0;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const authConfig = endpoint.auth_config as Record<string, unknown>;
      if (endpoint.auth_type === 'bearer' && authConfig?.token) {
        headers['Authorization'] = `Bearer ${authConfig.token}`;
      } else if (endpoint.auth_type === 'api_key') {
        const ha = authConfig?.headers as Record<string, string> | undefined;
        if (ha) Object.assign(headers, ha);
      } else if (endpoint.auth_type === 'basic') {
        const { username, password } = authConfig as { username?: string; password?: string };
        if (username && password) headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
      }

      const response = await fetch(endpoint.base_url, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const jsonData = await response.json();
      let data = jsonData;
      if (endpoint.response_path) {
        for (const path of endpoint.response_path.split('.')) data = data?.[path];
      }

      let items = Array.isArray(data) ? data : [data].filter(Boolean);
      if (skipOffset > 0) {
        items = items.slice(skipOffset);
      }
      
      recordsFetched = items.length;
      const mappings = endpoint.field_mappings as Array<{ sourceField: string; targetField: string; transform?: string }> | null;

      this.fetchProgress[endpoint.id] = { current: 0, total: items.length };
      this.notify();

      for (let i = 0; i < items.length; i++) {
        if (this.isCancelled(endpoint.id)) {
          errorMessage = 'Cancelled by user';
          status = 'partial';
          break;
        }

        const item = items[i];
        let externalId = null;
        if (endpoint.id_field) {
          externalId = item?.[endpoint.id_field]?.toString() || null;
        } else {
          externalId = item?.id?.toString() || item?._id?.toString() || null;
        }

        let mappedData: Record<string, unknown> = {};
        if (mappings && mappings.length > 0) {
          for (const mapping of mappings) {
            const value = item?.[mapping.sourceField];
            if (value !== undefined) {
              let tv: unknown = value;
              if (mapping.transform === 'number') tv = Number(value);
              else if (mapping.transform === 'boolean') tv = Boolean(value);
              else if (mapping.transform === 'date') tv = new Date(value).toISOString();
              else tv = String(value);
              mappedData[mapping.targetField] = tv;
            }
          }
        }
        const result = await api.upsertRecord({ 
          endpoint_id: endpoint.id, 
          collection_name: endpoint.collection_name,
          external_id: externalId, 
          raw_data: item, 
          mapped_data: mappedData 
        });
        if (result.action === 'updated') recordsUpdated++; else recordsCreated++;

        if (i % 5 === 0 || i === items.length - 1) {
          this.fetchProgress[endpoint.id] = { current: i + 1, total: items.length };
          this.notify();
        }
      }

      await api.updateEndpointStatus(endpoint.id, { last_fetched_at: new Date().toISOString(), last_error: null });
    } catch (err) {
      status = 'error';
      errorMessage = (err as Error).message;
      await api.updateEndpointStatus(endpoint.id, { last_error: errorMessage });
    }

    await api.createLog({ endpoint_id: endpoint.id, status, records_fetched: recordsFetched, records_created: recordsCreated, records_updated: recordsUpdated, error_message: errorMessage, duration_ms: Date.now() - startTime });
    
    this.fetchingIds.delete(endpoint.id);
    delete this.cancelTokens[endpoint.id];
    delete this.fetchProgress[endpoint.id];
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
