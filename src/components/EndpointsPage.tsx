import { useState, useEffect } from 'react';
import { ApiEndpoint } from '../types/database';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { EndpointForm } from './EndpointForm';
import {
  Plus,
  Edit,
  Trash2,
  Power,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<ApiEndpoint | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEndpoints();
      setEndpoints(data);
    } catch (err) {
      console.error('Failed to load endpoints:', err);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this endpoint? All associated records will also be deleted.')) {
      return;
    }
    setDeletingId(id);
    try {
      await api.deleteEndpoint(id);
      setEndpoints(endpoints.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete endpoint:', err);
    }
    setDeletingId(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(endpoints.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} endpoints? All associated records will also be deleted.`)) return;
    setIsBulkDeleting(true);
    try {
      await api.bulkDeleteEndpoints(Array.from(selectedIds));
      setEndpoints(endpoints.filter(e => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
    setIsBulkDeleting(false);
  };

  const handleToggleActive = async (endpoint: ApiEndpoint) => {
    try {
      const updated = await api.toggleEndpoint(endpoint.id);
      setEndpoints(endpoints.map((e) => (e.id === endpoint.id ? updated : e)));
    } catch (err) {
      console.error('Failed to toggle endpoint:', err);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEndpoint(null);
  };

  const handleFormSave = () => {
    fetchEndpoints();
    handleFormClose();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-gray-900 dark:text-gray-100 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Endpoints</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure and manage your data sources
          </p>
        </div>
        {!isViewer && (
          <button
            onClick={() => {
              setEditingEndpoint(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition shadow-sm shadow-gray-900/10 dark:shadow-white/10"
          >
            <Plus className="w-5 h-5" />
            Add Endpoint
          </button>
        )}
      </div>

      {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-start gap-4 animate-pulse">
                  <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-md"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : endpoints.length === 0 ? (
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No endpoints configured
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Add your first API endpoint to start fetching data
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-gray-700 dark:text-gray-300 hover:text-blue-300 font-medium"
          >
            + Add your first endpoint
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
            {!isViewer && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={endpoints.length > 0 && selectedIds.size === endpoints.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:ring-offset-0 cursor-pointer transition shadow-sm"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">Select All</span>
              </label>
            )}
            
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">{selectedIds.size} selected</span>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition disabled:opacity-50"
                >
                  {isBulkDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            )}
          </div>
          <div className="grid gap-4">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className={`bg-white dark:bg-gray-800/50 border rounded-lg p-4 transition flex items-start gap-3 sm:gap-4 min-w-0 ${
                  endpoint.is_active
                    ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600'
                    : 'border-gray-200 dark:border-gray-800 opacity-60'
                }`}
              >
                {!isViewer && (
                  <div className="pt-1 shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(endpoint.id)}
                      onChange={(e) => handleSelectOne(endpoint.id, e.target.checked)}
                      className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:ring-offset-0 cursor-pointer transition shadow-sm"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-4 sm:items-start">
                  <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        endpoint.is_active
                          ? endpoint.last_error
                            ? 'bg-yellow-500'
                            : endpoint.last_fetched_at
                            ? 'bg-green-500'
                            : 'bg-slate-500'
                          : 'bg-slate-600'
                      }`}
                    />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {endpoint.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        endpoint.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {endpoint.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {endpoint.collection_name && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        {endpoint.collection_name}
                      </span>
                    )}
                  </div>
                  {endpoint.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {endpoint.description}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400 dark:text-gray-500 min-w-0">
                    <p className="font-mono truncate block w-full sm:w-auto sm:max-w-md min-w-0">
                      {endpoint.base_url}
                    </p>
                    <span className="flex items-center gap-1 shrink-0">
                      {endpoint.auth_type === 'none' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {endpoint.auth_type === 'none' ? 'No Auth' : 'Protected'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400 dark:text-gray-500">
                    {endpoint.last_fetched_at ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Last fetched:{' '}
                        {new Date(endpoint.last_fetched_at).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">Never fetched</span>
                    )}
                    {endpoint.field_mappings &&
                      Array.isArray(endpoint.field_mappings) &&
                      endpoint.field_mappings.length > 0 && (
                        <span>
                          {endpoint.field_mappings.length} field mappings
                        </span>
                      )}
                  </div>
                  {endpoint.last_error && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="truncate">{endpoint.last_error}</span>
                    </div>
                  )}
                </div>
                
                  {!isViewer && (
                    <div className="flex items-center justify-end gap-2 shrink-0 border-t border-gray-100 dark:border-gray-700/50 sm:border-0 pt-3 sm:pt-0">
                    <button
                      onClick={() => handleToggleActive(endpoint)}
                      className={`p-2 rounded-lg transition ${
                        endpoint.is_active
                          ? 'text-yellow-400 hover:bg-yellow-500/10'
                          : 'text-green-400 hover:bg-green-500/10'
                      }`}
                      title={endpoint.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingEndpoint(endpoint);
                        setShowForm(true);
                      }}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(endpoint.id)}
                      disabled={deletingId === endpoint.id}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === endpoint.id ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        </>
      )}

      {showForm && (
        <EndpointForm
          endpoint={editingEndpoint}
          onSave={handleFormSave}
          onCancel={handleFormClose}
        />
      )}
    </div>
  );
}
