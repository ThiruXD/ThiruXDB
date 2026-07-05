/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
import { useState, useEffect } from 'react';
import { FetchLog, ApiEndpoint } from '../types/database';
import { api } from '../lib/api';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-sm ${
                        log.status === 'success'
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
