/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import { useState, useEffect } from 'react';
import { FetchLog, ApiEndpoint } from '../types/database';
import { api } from '../lib/api';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Trash2, Trash } from 'lucide-react';

export function LogsPage() {
  const [logs, setLogs] = useState<(FetchLog & { endpoint_name: string })[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedEndpoint]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [endpointsData, logsData] = await Promise.all([
        api.getEndpoints(),
        api.getLogs({ endpoint_id: selectedEndpoint, limit: 100 }),
      ]);
      setEndpoints(endpointsData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
    setIsLoading(false);
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return;
    try {
      await api.deleteLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear these logs?')) return;
    try {
      await api.clearLogs(selectedEndpoint);
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="h-12 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"></div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex border-b border-gray-200 dark:border-gray-800 p-4 gap-4">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fetch Logs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            History of data fetch operations
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedEndpoint}
            onChange={(e) => setSelectedEndpoint(e.target.value)}
            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
          >
            <option value="all">All Endpoints</option>
            {endpoints.map((ep) => (
              <option key={ep.id} value={ep.id}>
                {ep.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleClearAll}
            disabled={logs.length === 0}
            className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No fetch logs found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Endpoint
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Records
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Updated
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Duration
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Time
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Error
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-sm ${log.status === 'success'
                            ? 'text-green-400'
                            : log.status === 'partial'
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                      >
                        {log.status === 'success' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : log.status === 'partial' ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{log.endpoint_name}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {log.records_fetched}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400">
                      {log.records_created}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {log.records_updated}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                      {log.duration_ms}ms
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-sm whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-red-400 text-sm max-w-xs truncate">
                      {log.error_message || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete log"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
