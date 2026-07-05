import { useState, useEffect, useMemo } from 'react';
import { DataRecord, ApiEndpoint } from '../types/database';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Eye, Trash2,
  Download, X, Database, FileJson, Table, Grid, Edit, Copy
} from 'lucide-react';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function DataBrowserPage() {
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selectedRecord, setSelectedRecord] = useState<DataRecord | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';

  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => { loadEndpoints(); }, []);
  useEffect(() => { if (activeCollection !== null) loadRecords(); }, [page, pageSize, selectedEndpoint, dateFrom, dateTo, activeCollection]);

  const loadEndpoints = async () => {
    try {
      const data = await api.getEndpoints();
      setEndpoints(data);
    } catch (err) {
      console.error('Failed to load endpoints:', err);
    }
  };

  const loadRecords = async () => {
    if (activeCollection === null) return;
    setIsLoading(true);
    try {
      const collectionParam = activeCollection === 'all' || activeCollection === 'uncategorized' ? undefined : activeCollection;
      const result = await api.getRecords({ page, pageSize, endpoint_id: selectedEndpoint, collection_name: collectionParam, date_from: dateFrom, date_to: dateTo });
      setRecords(result.data);
      setTotalCount(result.count);
    } catch (err) {
      console.error('Failed to load records:', err);
    }
    setIsLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { loadRecords(); return; }
    setIsLoading(true);
    setPage(1);
    try {
      const result = await api.searchRecords({ q: searchQuery, page: 1, pageSize, endpoint_id: selectedEndpoint });
      setRecords(result.data);
      setTotalCount(result.count);
    } catch (err) {
      console.error('Search failed:', err);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    setDeletingId(id);
    try {
      await api.deleteRecord(id);
      setRecords(records.filter((r) => r.id !== id));
      setTotalCount((prev) => prev - 1);
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
    setDeletingId(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(records.map(r => r.id)));
    else setSelectedIds(new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id); else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) return;
    setIsBulkDeleting(true);
    try {
      await api.bulkDeleteRecords(Array.from(selectedIds));
      setRecords(records.filter(r => !selectedIds.has(r.id)));
      setTotalCount(prev => prev - selectedIds.size);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
    setIsBulkDeleting(false);
  };

  const handleExport = (format: 'json' | 'csv') => {
    const dataToExport = records.map((r) => ({ id: r.id, external_id: r.external_id, raw_data: r.raw_data, mapped_data: r.mapped_data, fetched_at: r.fetched_at }));
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `data-export-${new Date().toISOString().split('T')[0]}.json`; a.click();
      URL.revokeObjectURL(url);
    } else {
      const flattened = dataToExport.map((r) => {
        const flat: Record<string, string> = { id: r.id, external_id: r.external_id || '', fetched_at: r.fetched_at };
        const mapped = r.mapped_data as Record<string, unknown>;
        if (mapped) Object.entries(mapped).forEach(([key, value]) => { flat[key] = String(value); });
        return flat;
      });
      const headers = Array.from(new Set(flattened.flatMap((r) => Object.keys(r))));
      const csv = [headers.join(','), ...flattened.map((r) => headers.map((h) => JSON.stringify(r[h] || '')).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `data-export-${new Date().toISOString().split('T')[0]}.csv`; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const clearFilters = () => {
    setSearchQuery(''); setSelectedEndpoint('all'); setDateFrom(''); setDateTo(''); setPage(1); loadRecords();
  };

  const getEndpointName = (id: string) => endpoints.find((e) => e.id === id)?.name || 'Unknown';

  const getColumns = useMemo(() => {
    if (records.length === 0) return [];
    const firstRecord = records[0].mapped_data;
    if (!firstRecord || typeof firstRecord !== 'object') return [];
    return Object.keys(firstRecord).slice(0, 5); // Show first 5 mapped fields
  }, [records]);

  const isModified = (record: DataRecord) => {
    if (!record.created_at || !record.updated_at) return false;
    return new Date(record.updated_at).getTime() - new Date(record.created_at).getTime() > 1000;
  };

  const endpointsByCollection = useMemo(() => {
    const grouped: Record<string, ApiEndpoint[]> = {};
    const others: ApiEndpoint[] = [];
    endpoints.forEach(ep => {
      if (ep.collection_name) {
        if (!grouped[ep.collection_name]) grouped[ep.collection_name] = [];
        grouped[ep.collection_name].push(ep);
      } else {
        others.push(ep);
      }
    });
    return { grouped, others };
  }, [endpoints]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          {activeCollection !== null && (
            <button onClick={() => { setActiveCollection(null); setRecords([]); setTotalCount(0); }} className="p-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-700 transition" title="Back to Collections">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Browser</h1>
            {activeCollection !== null && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">{totalCount.toLocaleString()} records {activeCollection !== 'all' ? `in ${activeCollection}` : ''}</p>
            )}
          </div>
        </div>
        {activeCollection !== null && (
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={loadRecords} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition" title="Refresh"><RefreshCw className="w-5 h-5" /></button>
            <button onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition">{viewMode === 'table' ? <Grid className="w-5 h-5" /> : <Table className="w-5 h-5" />}</button>
            <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"><Download className="w-4 h-4" />CSV</button>
            <button onClick={() => handleExport('json')} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"><FileJson className="w-4 h-4" />JSON</button>
          </div>
        )}
      </div>

      {activeCollection === null ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div onClick={() => setActiveCollection('all')} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:border-gray-900 dark:hover:border-white transition group flex flex-col items-center justify-center text-center gap-3">
             <Database className="w-10 h-10 text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:text-gray-300 transition" />
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Records</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400">View all endpoints</p>
          </div>
          {Object.keys(endpointsByCollection.grouped).map(col => (
            <div key={col} onClick={() => setActiveCollection(col)} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:border-gray-900 dark:hover:border-white transition group flex flex-col items-center justify-center text-center gap-3">
               <Database className="w-10 h-10 text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:text-gray-300 transition" />
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{col}</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400">{endpointsByCollection.grouped[col].length} Endpoints</p>
            </div>
          ))}
          {endpointsByCollection.others.length > 0 && (
            <div onClick={() => setActiveCollection('uncategorized')} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:border-gray-900 dark:hover:border-white transition group flex flex-col items-center justify-center text-center gap-3">
               <Database className="w-10 h-10 text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:text-gray-300 transition" />
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Uncategorized</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400">{endpointsByCollection.others.length} Endpoints</p>
            </div>
          )}
        </div>
      ) : (
        <>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Search records..." className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100" />
            </div>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition ${showFilters ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}><Filter className="w-5 h-5" />Filters</button>
          <button onClick={handleSearch} className="px-6 py-2.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition">Search</button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Source Endpoint</label>
              <select value={selectedEndpoint} onChange={(e) => { setSelectedEndpoint(e.target.value); setPage(1); }} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100">
                <option value="all">All Endpoints</option>
                {Object.entries(endpointsByCollection.grouped).map(([collection, eps]) => (
                  <optgroup key={collection} label={`Collection: ${collection}`}>
                    {eps.map(ep => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
                  </optgroup>
                ))}
                {endpointsByCollection.others.length > 0 && (
                  <optgroup label={Object.keys(endpointsByCollection.grouped).length > 0 ? "Other Endpoints" : "Endpoints"}>
                    {endpointsByCollection.others.map(ep => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
                  </optgroup>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Date From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Date To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100" />
            </div>
          </div>
        )}

        {(selectedEndpoint !== 'all' || dateFrom || dateTo || searchQuery) && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mt-4"><X className="w-4 h-4" />Clear filters</button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{selectedIds.size} records selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition text-sm disabled:opacity-50"
          >
            {isBulkDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete Selected
          </button>
        </div>
      )}

      {/* Data Grid/Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden animate-pulse">
          <div className="h-12 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"></div>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex border-b border-gray-200 dark:border-gray-800 p-4 gap-4">
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4"><Database className="w-8 h-8 text-gray-400 dark:text-gray-500" /></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No records found</h3>
          <p className="text-gray-500 dark:text-gray-400">Fetch data from your endpoints first</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700/50">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={records.length > 0 && selectedIds.size === records.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:ring-offset-0 cursor-pointer transition shadow-sm"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Source</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">External ID</th>
                  {getColumns.map((col) => <th key={col} className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">{col}</th>)}
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Fetched</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {records.map((record) => (
                  <tr key={record.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition ${isModified(record) ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`} onClick={() => setSelectedRecord(record)}>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id)}
                        onChange={(e) => handleSelectOne(record.id, e.target.checked)}
                        className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:ring-offset-0 cursor-pointer transition shadow-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        {isModified(record) && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified since creation" />}
                        {getEndpointName(record.endpoint_id)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">{record.external_id || '-'}</td>
                    {getColumns.map((col) => { const mapped = record.mapped_data as Record<string, unknown>; return <td key={col} className="px-4 py-3 text-gray-700 dark:text-gray-300">{mapped?.[col] !== undefined ? String(mapped[col]).slice(0, 30) : '-'}</td>; })}
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-sm whitespace-nowrap">{new Date(record.fetched_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedRecord(record)} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition" title="View"><Eye className="w-4 h-4" /></button>
                        {!isViewer && (
                          <button onClick={() => handleDelete(record.id)} disabled={deletingId === record.id} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition disabled:opacity-50" title="Delete">{deletingId === record.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
        <div className="flex items-center justify-between bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={records.length > 0 && selectedIds.size === records.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:ring-offset-0 cursor-pointer transition shadow-sm"
            />
            <span className="text-gray-700 dark:text-gray-300 font-medium">Select All Current Page</span>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <div key={record.id} onClick={() => setSelectedRecord(record)} className={`bg-white dark:bg-gray-800/50 border rounded-lg p-4 cursor-pointer transition relative ${isModified(record) ? 'border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700 shadow-[inset_4px_0_0_0_#f59e0b]' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
              <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(record.id)}
                  onChange={(e) => handleSelectOne(record.id, e.target.checked)}
                  className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:ring-offset-0 cursor-pointer transition shadow-sm"
                />
              </div>
              <div className="flex items-center justify-between mb-3 pr-8">
                <span className="text-xs text-gray-400 dark:text-gray-500">{getEndpointName(record.endpoint_id)}</span>
                <span className="text-xs text-gray-300 dark:text-gray-600">{new Date(record.fetched_at).toLocaleDateString()}</span>
              </div>
              <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-hidden max-h-32 font-mono">{JSON.stringify(viewMode === 'grid' ? record.raw_data : record.mapped_data, null, 2).slice(0, 200)}...</pre>
            </div>
          ))}
        </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Per page:</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-gray-900 dark:text-white text-sm">
              {ITEMS_PER_PAGE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      )}
      </>
      )}

      {selectedRecord && (
        <RecordDetailModal record={selectedRecord} endpointName={getEndpointName(selectedRecord.endpoint_id)} onClose={() => setSelectedRecord(null)} onDeleted={() => { setSelectedRecord(null); loadRecords(); }} isViewer={isViewer} />
      )}
    </div>
  );
}

function RecordDetailModal({ record, endpointName, onClose, onDeleted, isViewer }: { record: DataRecord; endpointName: string; onClose: () => void; onDeleted: () => void; isViewer?: boolean }) {
  const [view, setView] = useState<'mapped' | 'raw'>('raw');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(JSON.stringify(record.mapped_data, null, 2));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (isViewer) return;
    setIsSaving(true);
    try {
      const parsed = JSON.parse(editedData);
      await api.updateRecord(record.id, parsed);
      onDeleted();
    } catch {
      alert('Invalid JSON');
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return;
    setIsDeleting(true);
    try {
      await api.deleteRecord(record.id);
      onDeleted();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
    setIsDeleting(false);
  };

  const handleCopyJSON = () => {
    const data = view === 'mapped' ? record.mapped_data : record.raw_data;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    // Optional: add a small toast notification here if you have one
  };

  const handleDownloadJSON = () => {
    const data = view === 'mapped' ? record.mapped_data : record.raw_data;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `record-${record.id}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Record Details</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{endpointName} • ID: {record.external_id || record.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex gap-2">
              <button onClick={() => setView('mapped')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'mapped' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Mapped Data</button>
              <button onClick={() => setView('raw')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'raw' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Raw JSON</button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopyJSON} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm">
                <Copy className="w-4 h-4" /> Copy
              </button>
              <button onClick={handleDownloadJSON} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>

          {isEditing && view === 'mapped' ? (
            <div className="space-y-4">
              <textarea value={editedData} onChange={(e) => setEditedData(e.target.value)} className="w-full h-64 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-4 font-mono text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100" />
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          ) : (
            <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto font-mono text-sm text-gray-700 dark:text-gray-300">{JSON.stringify(view === 'mapped' ? record.mapped_data : record.raw_data, null, 2)}</pre>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400 dark:text-gray-500">Fetched at:</span><span className="ml-2 text-gray-900 dark:text-white">{new Date(record.fetched_at).toLocaleString()}</span></div>
            <div><span className="text-gray-400 dark:text-gray-500">Created at:</span><span className="ml-2 text-gray-900 dark:text-white">{new Date(record.created_at).toLocaleString()}</span></div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          {!isViewer && (
            <button onClick={handleDelete} disabled={isDeleting} className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"><Trash2 className="w-4 h-4" />{isDeleting ? 'Deleting...' : 'Delete'}</button>
          )}
          <div className="flex gap-2">
            {!isViewer && view === 'mapped' && <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"><Edit className="w-4 h-4" />Edit</button>}
            <button onClick={onClose} className="px-6 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
