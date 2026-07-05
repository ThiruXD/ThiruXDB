import { useState, useEffect } from 'react';
import { ApiEndpoint, FetchLog } from '../types/database';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useFetchStore } from '../store/fetchStore';
import {
  RefreshCw, Play, CheckCircle, XCircle, Clock, AlertCircle, Loader2, Database,
} from 'lucide-react';

export function FetchPage() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [recentLogs, setRecentLogs] = useState<(FetchLog & { endpoint_name: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchingAll, setFetchingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [globalSkip, setGlobalSkip] = useState<number>(0);
  const [skipOffsets, setSkipOffsets] = useState<Record<string, number>>({});
  
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';
  
  const { fetchingIds, fetchProgress, startFetch, cancelFetch } = useFetchStore();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allEndpoints, logsData] = await Promise.all([
        api.getEndpoints(),
        api.getLogs({ limit: 10 }),
      ]);
      setEndpoints(allEndpoints.filter((e) => e.is_active));
      setRecentLogs(logsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setIsLoading(false);
  };

  const fetchFromEndpoint = async (endpoint: ApiEndpoint) => {
    await startFetch(endpoint, skipOffsets[endpoint.id] || 0, loadData);
  };

  const handleCancelFetch = (id: string) => {
    cancelFetch(id);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(endpoints.map(e => e.id)));
    else setSelectedIds(new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id); else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const fetchSelectedEndpoints = async () => {
    setFetchingAll(true);
    const selectedEndpoints = endpoints.filter(e => selectedIds.has(e.id));
    for (const ep of selectedEndpoints) await startFetch(ep, globalSkip, loadData);
    setFetchingAll(false);
  };

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-start gap-4 animate-pulse">
            <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 shrink-0 mt-1"></div>
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0"></div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded shrink-0 mt-2 sm:mt-0"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fetch Data</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Pull data from configured API endpoints</p>
        </div>
        {!isViewer && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 shrink-0">
              <span className="text-sm text-gray-500 dark:text-gray-400">Skip</span>
              <input type="number" min="0" value={globalSkip} onChange={(e) => setGlobalSkip(parseInt(e.target.value) || 0)} className="w-16 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100" />
            </div>
            <button onClick={fetchSelectedEndpoints} disabled={fetchingAll || selectedIds.size === 0} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition shadow-sm shadow-gray-900/10 dark:shadow-white/10 disabled:opacity-50 shrink-0">
              {fetchingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              Fetch Selected ({selectedIds.size})
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-start gap-4 animate-pulse">
                  <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 shrink-0 mt-1"></div>
                  <div className="flex-1 flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0"></div>
                      <div className="space-y-2">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : endpoints.length === 0 ? (
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4"><Database className="w-8 h-8 text-gray-400 dark:text-gray-500" /></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No active endpoints</h3>
          <p className="text-gray-500 dark:text-gray-400">Configure and activate API endpoints first</p>
        </div>
      ) : (
        <>
          {!isViewer && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={endpoints.length > 0 && selectedIds.size === endpoints.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:ring-offset-0 cursor-pointer transition shadow-sm"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">Select All</span>
              </label>
            </div>
          )}
          <div className="grid gap-4">
            {endpoints.map((endpoint) => {
              const isFetching = fetchingIds.has(endpoint.id);
              const progress = fetchProgress[endpoint.id];
              return (
                <div key={endpoint.id} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-hidden min-w-0">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="pt-1 shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(endpoint.id)}
                        onChange={(e) => handleSelectOne(endpoint.id, e.target.checked)}
                        className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:ring-offset-0 cursor-pointer transition shadow-sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between min-w-0">
                        <div className="flex items-center gap-4 min-w-0 flex-1 w-full">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${endpoint.last_error ? 'bg-yellow-500/20' : endpoint.last_fetched_at ? 'bg-green-500/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            {endpoint.last_error ? <AlertCircle className="w-5 h-5 text-yellow-400" /> : endpoint.last_fetched_at ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Database className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
                          </div>
                          <div className="min-w-0 flex-1 w-full">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate block">{endpoint.name}</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-500 font-mono truncate block">{endpoint.base_url}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0 border-t border-gray-100 dark:border-gray-700/50 sm:border-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                          {isFetching && progress && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium justify-between sm:justify-start">
                              <span>{progress.current} / {progress.total}</span>
                              <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${Math.min(100, (progress.current / (progress.total || 1)) * 100)}%` }} />
                              </div>
                            </div>
                          )}
                          {!isFetching && endpoint.last_fetched_at && <span className="text-sm text-gray-400 dark:text-gray-500 flex items-center justify-between sm:justify-start gap-1"><span>Last Fetched:</span> <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(endpoint.last_fetched_at).toLocaleString()}</span></span>}
                          
                          {!isViewer && !isFetching && (
                            <div className="flex items-center justify-between sm:justify-start gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Skip</span>
                              <input type="number" min="0" value={skipOffsets[endpoint.id] || 0} onChange={(e) => setSkipOffsets({ ...skipOffsets, [endpoint.id]: parseInt(e.target.value) || 0 })} className="w-14 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100" />
                            </div>
                          )}

                          {!isViewer && (isFetching ? (
                            <button onClick={() => handleCancelFetch(endpoint.id)} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition shadow-sm shadow-red-500/20 w-full sm:w-auto">
                              <XCircle className="w-5 h-5" />
                              Cancel
                            </button>
                          ) : (
                            <button onClick={() => fetchSingleEndpoint(endpoint)} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition shadow-sm w-full sm:w-auto">
                              <RefreshCw className="w-5 h-5" />
                              Fetch
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {endpoint.last_error && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span className="truncate">{endpoint.last_error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            );
          })}
        </div>
        </>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Fetch History</h2>
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
          {recentLogs.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-center py-8">No fetch history yet</p> : (
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700/50">
                <tr>
                  {['Endpoint','Status','Fetched','Created','Updated','Duration','Time'].map(h => <th key={h} className={`px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 ${h==='Endpoint'||h==='Status'||h==='Time' ? 'text-left' : 'text-right'}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:bg-gray-700/30">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{log.endpoint_name}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${log.status==='success'?'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400':log.status==='partial'?'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400':'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>{log.status==='success'?<CheckCircle className="w-3.5 h-3.5"/>:log.status==='partial'?<AlertCircle className="w-3.5 h-3.5"/>:<XCircle className="w-3.5 h-3.5"/>}{log.status}</span></td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{log.records_fetched}</td>
                    <td className="px-4 py-3 text-right text-green-400">{log.records_created}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{log.records_updated}</td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{log.duration_ms}ms</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-sm">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
