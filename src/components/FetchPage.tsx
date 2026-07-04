import { useState, useEffect } from 'react';
import { ApiEndpoint, FetchLog } from '../types/database';
import { api } from '../lib/api';
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

  if (isLoading) return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fetch Data</h1>
          <p className="text-slate-400 mt-1">Pull data from configured API endpoints</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5">
            <span className="text-sm text-slate-400">Skip</span>
            <input type="number" min="0" value={globalSkip} onChange={(e) => setGlobalSkip(parseInt(e.target.value) || 0)} className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <button onClick={fetchSelectedEndpoints} disabled={fetchingAll || selectedIds.size === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-500/20 disabled:opacity-50">
            {fetchingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Fetch Selected ({selectedIds.size})
          </button>
        </div>
      </div>

      {endpoints.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4"><Database className="w-8 h-8 text-slate-500" /></div>
          <h3 className="text-lg font-semibold text-white mb-2">No active endpoints</h3>
          <p className="text-slate-400">Configure and activate API endpoints first</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={endpoints.length > 0 && selectedIds.size === endpoints.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-slate-300 font-medium">Select All</span>
            </label>
          </div>
          <div className="grid gap-4">
            {endpoints.map((endpoint) => {
              const isFetching = fetchingIds.has(endpoint.id);
              const progress = fetchProgress[endpoint.id];
              return (
                <div key={endpoint.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="pt-1 shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(endpoint.id)}
                        onChange={(e) => handleSelectOne(endpoint.id, e.target.checked)}
                        className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${endpoint.last_error ? 'bg-yellow-500/20' : endpoint.last_fetched_at ? 'bg-green-500/20' : 'bg-slate-700'}`}>
                            {endpoint.last_error ? <AlertCircle className="w-5 h-5 text-yellow-400" /> : endpoint.last_fetched_at ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Database className="w-5 h-5 text-slate-500" />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-white truncate">{endpoint.name}</h3>
                            <p className="text-sm text-slate-500 font-mono truncate">{endpoint.base_url}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 shrink-0">
                          {isFetching && progress && (
                            <div className="flex items-center gap-2 text-sm text-blue-400 font-medium">
                              <span>{progress.current} / {progress.total}</span>
                              <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${Math.min(100, (progress.current / (progress.total || 1)) * 100)}%` }} />
                              </div>
                            </div>
                          )}
                          {!isFetching && endpoint.last_fetched_at && <span className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(endpoint.last_fetched_at).toLocaleString()}</span>}
                          
                          {!isFetching && (
                            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                              <span className="text-xs text-slate-400">Skip</span>
                              <input type="number" min="0" value={skipOffsets[endpoint.id] || 0} onChange={(e) => setSkipOffsets({ ...skipOffsets, [endpoint.id]: parseInt(e.target.value) || 0 })} className="w-14 bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                          )}

                          {isFetching ? (
                            <button onClick={() => handleCancelFetch(endpoint.id)} className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition shadow-lg shadow-red-500/20">
                              <XCircle className="w-5 h-5" />
                              Cancel
                            </button>
                          ) : (
                            <button onClick={() => fetchFromEndpoint(endpoint)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-500/20">
                              <Play className="w-5 h-5" />
                              Fetch
                            </button>
                          )}
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
        <h2 className="text-lg font-semibold text-white mb-4">Recent Fetch History</h2>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          {recentLogs.length === 0 ? <p className="text-slate-500 text-center py-8">No fetch history yet</p> : (
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  {['Endpoint','Status','Fetched','Created','Updated','Duration','Time'].map(h => <th key={h} className={`px-4 py-3 text-sm font-medium text-slate-400 ${h==='Endpoint'||h==='Status'||h==='Time' ? 'text-left' : 'text-right'}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-white">{log.endpoint_name}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-sm ${log.status==='success'?'text-green-400':log.status==='partial'?'text-yellow-400':'text-red-400'}`}>{log.status==='success'?<CheckCircle className="w-4 h-4"/>:log.status==='partial'?<AlertCircle className="w-4 h-4"/>:<XCircle className="w-4 h-4"/>}{log.status}</span></td>
                    <td className="px-4 py-3 text-right text-slate-300">{log.records_fetched}</td>
                    <td className="px-4 py-3 text-right text-green-400">{log.records_created}</td>
                    <td className="px-4 py-3 text-right text-blue-400">{log.records_updated}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{log.duration_ms}ms</td>
                    <td className="px-4 py-3 text-slate-500 text-sm">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
