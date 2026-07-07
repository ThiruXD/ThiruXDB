/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
/**
 * Typed API client — replaces @supabase/supabase-js.
 * All functions call the Express /api/* backend which talks to MongoDB.
 */

import type {
  ApiEndpoint,
  DataRecord,
  FetchLog,
  EndpointFormData,
  User,
  UserFormData,
  ActivityLog,
} from '../types/database';

export interface ApiKey {
  _id: string;
  name: string;
  prefix: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
  last_used: string | null;
}

const BASE = '/api';

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Attach token if logged in
  const token = localStorage.getItem('thiruxdb_jwt');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(BASE + url, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Endpoints ─────────────────────────────────────────────────────────────

export const api = {
  // Endpoints
  getEndpoints: (): Promise<ApiEndpoint[]> =>
    request('/endpoints'),

  testEndpoint: (data: Partial<EndpointFormData>): Promise<any> =>
    request('/endpoints/test', { method: 'POST', body: JSON.stringify(data) }),

  createEndpoint: (data: EndpointFormData): Promise<ApiEndpoint> =>
    request('/endpoints', { method: 'POST', body: JSON.stringify(data) }),

  updateEndpoint: (id: string, data: EndpointFormData): Promise<ApiEndpoint> =>
    request(`/endpoints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  toggleEndpoint: (id: string): Promise<ApiEndpoint> =>
    request(`/endpoints/${id}/toggle`, { method: 'PATCH' }),

  updateEndpointStatus: (
    id: string,
    payload: { last_fetched_at?: string | null; last_error?: string | null }
  ): Promise<ApiEndpoint> =>
    request(`/endpoints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteEndpoint: (id: string): Promise<{ success: boolean }> =>
    request(`/endpoints/${id}`, { method: 'DELETE' }),

  bulkDeleteEndpoints: (ids: string[]): Promise<{ success: boolean; deletedCount: number }> =>
    request('/endpoints/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  // Records
  getRecords: (params: {
    page?: number;
    pageSize?: number;
    endpoint_id?: string;
    collection_name?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{ data: DataRecord[]; count: number }> => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.endpoint_id) q.set('endpoint_id', params.endpoint_id);
    if (params.collection_name) q.set('collection_name', params.collection_name);
    if (params.date_from) q.set('date_from', params.date_from);
    if (params.date_to) q.set('date_to', params.date_to);
    return request(`/records?${q.toString()}`);
  },

  searchRecords: (params: {
    q: string;
    page?: number;
    pageSize?: number;
    endpoint_id?: string;
    collection_name?: string;
  }): Promise<{ data: DataRecord[]; count: number }> => {
    const q = new URLSearchParams({ q: params.q });
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.endpoint_id) q.set('endpoint_id', params.endpoint_id);
    if (params.collection_name) q.set('collection_name', params.collection_name);
    return request(`/records/search?${q.toString()}`);
  },

  getRecordCounts: (): Promise<{ total: number; perEndpoint: Record<string, number> }> =>
    request('/records/counts'),

  upsertRecord: (data: {
    endpoint_id: string;
    collection_name?: string | null;
    external_id: string | null;
    raw_data: unknown;
    mapped_data: unknown;
  }): Promise<{ action: 'created' | 'updated' }> =>
    request('/records', { method: 'POST', body: JSON.stringify(data) }),

  updateRecord: (id: string, mapped_data: unknown): Promise<DataRecord> =>
    request(`/records/${id}`, { method: 'PUT', body: JSON.stringify({ mapped_data }) }),

  deleteRecord: (id: string): Promise<{ success: boolean }> =>
    request(`/records/${id}`, { method: 'DELETE' }),

  bulkDeleteRecords: (ids: string[]): Promise<{ success: boolean; deletedCount: number }> =>
    request('/records/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  // Logs
  getLogs: (params: {
    endpoint_id?: string;
    limit?: number;
  }): Promise<(FetchLog & { endpoint_name: string })[]> => {
    const q = new URLSearchParams();
    if (params.endpoint_id) q.set('endpoint_id', params.endpoint_id);
    if (params.limit) q.set('limit', String(params.limit));
    return request(`/logs?${q.toString()}`);
  },

  createLog: (data: {
    endpoint_id: string;
    status: 'success' | 'error' | 'partial';
    records_fetched: number;
    records_created: number;
    records_updated: number;
    error_message: string | null;
    duration_ms: number;
  }): Promise<FetchLog> =>
    request('/logs', { method: 'POST', body: JSON.stringify(data) }),

  getSettings: (): Promise<{ session_timeout: string }> => request('/users/settings'),
  updateSettings: (data: { session_timeout: string }): Promise<{ success: boolean }> => 
    request('/users/settings', { method: 'POST', body: JSON.stringify(data) }),

  getApiKeys: (): Promise<ApiKey[]> => request('/apikeys'),
  createApiKey: (name: string): Promise<{ success: boolean, key: ApiKey, full_key: string }> => 
    request('/apikeys', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteApiKey: (id: string): Promise<{ success: boolean }> =>
    request(`/apikeys/${id}`, { method: 'DELETE' }),

  deleteLog: (id: string): Promise<{ success: boolean }> =>
    request(`/logs/${id}`, { method: 'DELETE' }),

  clearLogs: (endpointId?: string): Promise<{ success: boolean; deletedCount: number }> => {
    const query = endpointId && endpointId !== 'all' ? `?endpoint_id=${endpointId}` : '';
    return request(`/logs/all${query}`, { method: 'DELETE' });
  },

  // Sync Engine
  startSync: (id: string, skipOffset: number = 0): Promise<{ message: string }> =>
    request(`/endpoints/${id}/sync`, { method: 'POST', body: JSON.stringify({ skipOffset }) }),

  getSyncStatus: (id: string): Promise<{ status: 'idle' | 'downloading' | 'running' | 'completed' | 'partial' | 'error'; current: number; total: number; download_loaded?: number; download_total?: number; download_speed?: number; error: string | null; cancelled: boolean }> =>
    request(`/endpoints/${id}/sync-status`),

  getActiveSyncs: (): Promise<{ activeIds: string[] }> =>
    request('/endpoints/active-syncs'),

  cancelSync: (id: string): Promise<{ message: string }> =>
    request(`/endpoints/${id}/cancel-sync`, { method: 'POST' }),

  getLiveLogs: (id: string): Promise<any[]> =>
    request(`/endpoints/${id}/live-logs`),

  clearLiveLogs: (id: string): Promise<{ success: boolean }> =>
    request(`/endpoints/${id}/live-logs`, { method: 'DELETE' }),

  syncEndpointStats: (): Promise<{ message: string }> =>
    request('/endpoints/sync-stats', { method: 'POST' }),

  // Dashboard
  getDashboard: (): Promise<{
    system: {
      mongoUri: string;
      mongoStatus: string;
      databaseName: string;
    };
    stats: {
      totalEndpoints: number;
      activeEndpoints: number;
      totalRecords: number;
      recordsThisWeek: number;
      lastFetchTime: string | null;
      errors: number;
    };
    endpoints: ApiEndpoint[];
    recentRecords: DataRecord[];
    perEndpoint: Record<string, number>;
  }> => request('/dashboard'),

  // Users (Admin only)
  getUsers: (): Promise<User[]> =>
    request('/users'),

  createUser: (data: UserFormData): Promise<User> =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),

  updateUser: (id: string, data: Partial<UserFormData>): Promise<User> =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteUser: (id: string): Promise<{ success: boolean }> =>
    request(`/users/${id}`, { method: 'DELETE' }),

  lookupIp: (ip: string): Promise<any> =>
    request(`/users/ip-lookup/${ip}`),

  getActivityLogs: (params: { page?: number; limit?: number; userId?: string }): Promise<{
    logs: ActivityLog[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.userId) q.set('user_id', params.userId);
    return request(`/users/activity?${q.toString()}`);
  },
};
