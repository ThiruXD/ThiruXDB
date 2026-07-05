import { useState, useEffect } from 'react';
import { ApiEndpoint, EndpointFormData, FieldMapping } from '../types/database';
import { api } from '../lib/api';
import { X, Plus, Trash2, Save, Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface EndpointFormProps {
  endpoint?: ApiEndpoint | null;
  onSave: () => void;
  onCancel: () => void;
}

const defaultFormData: EndpointFormData = {
  name: '', description: '', collection_name: '', id_field: '', base_url: '', auth_type: 'none', auth_config: {},
  field_mappings: [], response_path: '', pagination_type: 'none', pagination_config: {}, path_variables: [], is_active: true,
};

export function EndpointForm({ endpoint, onSave, onCancel }: EndpointFormProps) {
  const [formData, setFormData] = useState<EndpointFormData>(defaultFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; sampleData?: unknown } | null>(null);
  const [newMapping, setNewMapping] = useState<FieldMapping>({ sourceField: '', targetField: '', transform: 'string' });
  const [newPathVariable, setNewPathVariable] = useState({ variable: '', source_collection: '', source_field: '' });

  useEffect(() => {
    if (endpoint) {
      setFormData({
        name: endpoint.name,
        description: endpoint.description || '',
        collection_name: endpoint.collection_name || '',
        id_field: endpoint.id_field || '',
        base_url: endpoint.base_url,
        auth_type: endpoint.auth_type,
        auth_config: (endpoint.auth_config as EndpointFormData['auth_config']) || {},
        field_mappings: (endpoint.field_mappings as FieldMapping[]) || [],
        response_path: endpoint.response_path,
        pagination_type: endpoint.pagination_type,
        pagination_config: (endpoint.pagination_config as EndpointFormData['pagination_config']) || {},
        path_variables: endpoint.path_variables || [],
        is_active: endpoint.is_active,
      });
    } else {
      setFormData(defaultFormData);
    }
    setTestResult(null);
  }, [endpoint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (endpoint) {
        await api.updateEndpoint(endpoint.id, formData);
      } else {
        await api.createEndpoint(formData);
      }
      onSave();
    } catch (err) {
      alert('Error saving endpoint: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (formData.auth_type === 'bearer') {
        const token = (formData.auth_config as { token?: string }).token;
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } else if (formData.auth_type === 'api_key') {
        const kh = (formData.auth_config as { headers?: Record<string, string> }).headers;
        if (kh) Object.assign(headers, kh);
      } else if (formData.auth_type === 'basic') {
        const { username, password } = formData.auth_config as { username?: string; password?: string };
        if (username && password) headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
      }
      const response = await fetch(formData.base_url, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setTestResult({ success: true, message: 'Connection successful!', sampleData: data });
    } catch (err) {
      setTestResult({ success: false, message: `Connection failed: ${(err as Error).message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const addMapping = () => {
    if (newMapping.sourceField && newMapping.targetField) {
      setFormData((prev) => ({ ...prev, field_mappings: [...prev.field_mappings, newMapping] }));
      setNewMapping({ sourceField: '', targetField: '', transform: 'string' });
    }
  };

  const removeMapping = (index: number) => {
    setFormData((prev) => ({ ...prev, field_mappings: prev.field_mappings.filter((_, i) => i !== index) }));
  };

  const addPathVariable = () => {
    if (newPathVariable.variable && newPathVariable.source_collection && newPathVariable.source_field) {
      setFormData((prev) => ({ ...prev, path_variables: [...prev.path_variables, newPathVariable] }));
      setNewPathVariable({ variable: '', source_collection: '', source_field: '' });
    }
  };

  const removePathVariable = (index: number) => {
    setFormData((prev) => ({ ...prev, path_variables: prev.path_variables.filter((_, i) => i !== index) }));
  };

  const inputCls = "w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{endpoint ? 'Edit Endpoint' : 'Add New Endpoint'}</h2>
          <button onClick={onCancel} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="My API" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Collection Name *</label>
                <input type="text" value={formData.collection_name} onChange={(e) => setFormData({ ...formData, collection_name: e.target.value })} className={inputCls} placeholder="e.g. Movies, Users" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputCls} placeholder="Optional description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <label className="flex items-center gap-2 mt-3">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:ring-offset-0 cursor-pointer transition shadow-sm" />
                  <span className="text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Base URL *</label>
              <input type="url" value={formData.base_url} onChange={(e) => setFormData({ ...formData, base_url: e.target.value })} className={`${inputCls} font-mono text-sm`} placeholder="https://api.example.com/data" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Response Data Path (JSON path to array)</label>
                <input type="text" value={formData.response_path} onChange={(e) => setFormData({ ...formData, response_path: e.target.value })} className={`${inputCls} font-mono text-sm`} placeholder="data.items or empty" />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">E.g., "data.results"</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Key Field</label>
                <input type="text" value={formData.id_field} onChange={(e) => setFormData({ ...formData, id_field: e.target.value })} className={`${inputCls} font-mono text-sm`} placeholder="e.g. id, uuid" />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Prevents duplicates. Leave empty to auto-detect "id" or "_id"</p>
              </div>
            </div>

            {/* Authentication */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Authentication</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {(['none', 'api_key', 'bearer', 'basic'] as const).map((type) => (
                  <button key={type} type="button" onClick={() => setFormData({ ...formData, auth_type: type, auth_config: {} })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${formData.auth_type === type ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-slate-600'}`}>
                    {type.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
              {formData.auth_type === 'bearer' && (
                <input type="password" placeholder="Bearer Token" value={(formData.auth_config as { token?: string }).token || ''} onChange={(e) => setFormData({ ...formData, auth_config: { token: e.target.value } })} className={inputCls} />
              )}
              {formData.auth_type === 'api_key' && (
                <div className="space-y-2">
                  <input type="text" placeholder="Header name (e.g., X-API-Key)" value={Object.keys((formData.auth_config as { headers?: Record<string, string> }).headers || {})[0] || ''} onChange={(e) => setFormData({ ...formData, auth_config: { headers: { [e.target.value]: Object.values((formData.auth_config as { headers?: Record<string, string> }).headers || {})[0] || '' } } })} className={inputCls} />
                  <input type="password" placeholder="API Key Value" value={Object.values((formData.auth_config as { headers?: Record<string, string> }).headers || {})[0] || ''} onChange={(e) => { const key = Object.keys((formData.auth_config as { headers?: Record<string, string> }).headers || {})[0] || 'X-API-Key'; setFormData({ ...formData, auth_config: { headers: { [key]: e.target.value } } }); }} className={inputCls} />
                </div>
              )}
              {formData.auth_type === 'basic' && (
                <div className="space-y-2">
                  <input type="text" placeholder="Username" value={(formData.auth_config as { username?: string }).username || ''} onChange={(e) => setFormData({ ...formData, auth_config: { ...formData.auth_config, username: e.target.value } })} className={inputCls} />
                  <input type="password" placeholder="Password" value={(formData.auth_config as { password?: string }).password || ''} onChange={(e) => setFormData({ ...formData, auth_config: { ...formData.auth_config, password: e.target.value } })} className={inputCls} />
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Pagination</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {(['none', 'offset', 'cursor', 'page'] as const).map((type) => (
                  <button key={type} type="button" onClick={() => setFormData({ ...formData, pagination_type: type, pagination_config: {} })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${formData.pagination_type === type ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-slate-600'}`}>
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
              {formData.pagination_type === 'offset' && (
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Limit param (e.g., limit)" value={formData.pagination_config.limit_param || ''} onChange={(e) => setFormData({ ...formData, pagination_config: { ...formData.pagination_config, limit_param: e.target.value } })} className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100" />
                  <input type="text" placeholder="Offset param (e.g., offset)" value={formData.pagination_config.offset_param || ''} onChange={(e) => setFormData({ ...formData, pagination_config: { ...formData.pagination_config, offset_param: e.target.value } })} className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100" />
                </div>
              )}
              {formData.pagination_type === 'page' && (
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Page param (e.g., page)" value={formData.pagination_config.page_param || ''} onChange={(e) => setFormData({ ...formData, pagination_config: { ...formData.pagination_config, page_param: e.target.value } })} className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100" />
                  <input type="text" placeholder="Limit param (e.g., per_page)" value={formData.pagination_config.limit_param || ''} onChange={(e) => setFormData({ ...formData, pagination_config: { ...formData.pagination_config, limit_param: e.target.value } })} className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100" />
                </div>
              )}
              {formData.pagination_type === 'cursor' && (
                <input type="text" placeholder="Cursor param (e.g., cursor)" value={formData.pagination_config.cursor_param || ''} onChange={(e) => setFormData({ ...formData, pagination_config: { ...formData.pagination_config, cursor_param: e.target.value } })} className={inputCls} />
              )}
            </div>

            {/* Path Variables */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Dynamic Path Variables</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Replace parts of the URL dynamically (e.g. {`{studentID}`}) using data from another collection.</p>
              
              <div className="space-y-4">
                {formData.path_variables.map((pv, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-300 dark:border-gray-600">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Variable in URL</p>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">{pv.variable}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Source Collection</p>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">{pv.source_collection}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Source Field</p>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">{pv.source_field}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePathVariable(idx)}
                      className="p-2 text-red-400 hover:bg-slate-600 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="flex flex-wrap items-end gap-3 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-300 dark:border-gray-600 border-dashed">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Variable (e.g. {`{id}`})</label>
                      <input
                        type="text"
                        value={newPathVariable.variable}
                        onChange={(e) => setNewPathVariable({ ...newPathVariable, variable: e.target.value })}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                        placeholder="{studentID}"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Collection</label>
                      <input
                        type="text"
                        value={newPathVariable.source_collection}
                        onChange={(e) => setNewPathVariable({ ...newPathVariable, source_collection: e.target.value })}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                        placeholder="Students"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Field path</label>
                      <input
                        type="text"
                        value={newPathVariable.source_field}
                        onChange={(e) => setNewPathVariable({ ...newPathVariable, source_field: e.target.value })}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                        placeholder="mapped_data.id"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addPathVariable}
                    disabled={!newPathVariable.variable || !newPathVariable.source_collection || !newPathVariable.source_field}
                    className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Field Mappings */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Field Mappings</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Map API response fields to standardized names. Leave empty to store raw data only.</p>
              <div className="space-y-2 mb-4">
                {formData.field_mappings.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2">
                    <span className="font-mono text-sm text-gray-700 dark:text-gray-300 flex-1">{mapping.sourceField}</span>
                    <span className="text-gray-400 dark:text-gray-500">→</span>
                    <span className="font-mono text-sm text-green-400 flex-1">{mapping.targetField}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">({mapping.transform})</span>
                    <button type="button" onClick={() => removeMapping(index)} className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <input type="text" placeholder="Source field" value={newMapping.sourceField} onChange={(e) => setNewMapping({ ...newMapping, sourceField: e.target.value })} className="flex-1 min-w-32 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100" />
                <input type="text" placeholder="Target field" value={newMapping.targetField} onChange={(e) => setNewMapping({ ...newMapping, targetField: e.target.value })} className="flex-1 min-w-32 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100" />
                <select value={newMapping.transform} onChange={(e) => setNewMapping({ ...newMapping, transform: e.target.value as FieldMapping['transform'] })} className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100">
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                </select>
                <button type="button" onClick={addMapping} className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition flex items-center gap-1"><Plus className="w-4 h-4" />Add</button>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`rounded-lg p-4 ${testResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                  <span className={testResult.success ? 'text-green-400' : 'text-red-400'}>{testResult.message}</span>
                </div>
                {testResult.sampleData && (
                  <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 rounded p-3 overflow-x-auto max-h-40">
                    {JSON.stringify(testResult.sampleData, null, 2).slice(0, 500)}...
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={handleTest} disabled={isTesting || !formData.base_url} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-slate-600 transition disabled:opacity-50">
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Test Connection
            </button>
            <div className="flex w-full sm:w-auto gap-3 justify-end">
              <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-slate-600 transition">Cancel</button>
              <button type="submit" disabled={isLoading || !formData.name || !formData.base_url} className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-50">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Endpoint
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
