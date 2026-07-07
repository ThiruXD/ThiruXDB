/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User, ActivityLog, UserRole, UserFormData } from '../types/database';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Activity,
  UserPlus,
  Shield,
  Clock,
  Laptop,
  Globe,
  Trash2,
  Edit,
  Save,
  X,
  Download,
  MapPin,
  Search,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { syntaxHighlight } from '../lib/utils';

export function UsersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'apikeys' | 'settings'>('users');

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingLogsForUser, setViewingLogsForUser] = useState<User | null>(null);

  // Activity Logs State
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form State
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    role: 'viewer',
    is_active: true,
    restricted_pages: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // IP Lookup Modal State
  const [ipModal, setIpModal] = useState<{ isOpen: boolean; ip: string; data: any; loading: boolean; error: string | null; copied: boolean }>({
    isOpen: false,
    ip: '',
    data: null,
    loading: false,
    error: null,
    copied: false
  });

  const handleIpLookup = async (ip: string) => {
    setIpModal({ isOpen: true, ip, data: null, loading: true, error: null, copied: false });
    try {
      const data = await api.lookupIp(ip);
      setIpModal(prev => ({ ...prev, data, loading: false }));
    } catch (err: any) {
      setIpModal(prev => ({ ...prev, error: err.message, loading: false }));
    }
  };

  const copyIpData = () => {
    if (ipModal.data) {
      navigator.clipboard.writeText(JSON.stringify(ipModal.data, null, 2));
      setIpModal(prev => ({ ...prev, copied: true }));
      setTimeout(() => setIpModal(prev => ({ ...prev, copied: false })), 2000);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else fetchLogs(page);
  }, [activeTab, page]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
    setIsLoadingUsers(false);
  };

  const fetchLogs = async (p: number) => {
    setIsLoadingLogs(true);
    try {
      const data = await api.getActivityLogs({ page: p, limit: 20 });
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    }
    setIsLoadingLogs(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
      } else {
        await api.createUser(formData);
      }
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const openForm = (u?: User) => {
    if (u) {
      setEditingUser(u);
      setFormData({ username: u.username, role: u.role, is_active: u.is_active, restricted_pages: u.restricted_pages || [] });
    } else {
      setEditingUser(null);
      setFormData({ username: '', password: '', role: 'viewer', is_active: true, restricted_pages: [] });
    }
    setShowForm(true);
  };

  if (user?.role !== 'admin') {
    return <div className="text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Security</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage users, roles, and view activity logs</p>
        </div>
        {activeTab === 'users' && (
          <button onClick={() => openForm()} className="flex items-center justify-center sm:justify-start gap-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition shadow-sm shadow-gray-900/10 dark:shadow-white/10 shrink-0 w-full sm:w-auto">
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-4 border-b border-gray-200 dark:border-gray-700 pb-px">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium whitespace-nowrap transition ${activeTab === 'users' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
            }`}
        >
          <Users className="w-4 h-4" /> Users
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium whitespace-nowrap transition ${activeTab === 'activity' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
            }`}
        >
          <Activity className="w-4 h-4" /> Activity Logs
        </button>
        <button
          onClick={() => setActiveTab('apikeys')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium whitespace-nowrap transition ${activeTab === 'apikeys' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
            }`}
        >
          <Globe className="w-4 h-4" /> API Gateway
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium whitespace-nowrap transition ${activeTab === 'settings' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
            }`}
        >
          <Shield className="w-4 h-4" /> Security Settings
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4 pt-4">          <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {isLoadingUsers ? (
            <div className="animate-pulse">
              <div className="h-12 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"></div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex border-b border-gray-200 dark:border-gray-800 p-4 gap-4">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                <thead className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Username</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Last Seen</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:bg-gray-700/20 transition">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{u.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                          u.role === 'editor' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' :
                            'bg-slate-500/10 text-gray-500 dark:text-gray-400'
                          }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.is_active ? <span className="text-green-400">Active</span> : <span className="text-red-400">Disabled</span>}
                      </td>
                      <td className="px-6 py-4">
                        {u.last_seen ? new Date(u.last_seen).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button onClick={() => setViewingLogsForUser(u)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-400 transition" title="View Logs"><Activity className="w-4 h-4" /></button>
                        {u.username !== (import.meta.env.VITE_ADMIN_USERNAME) && (
                          <button onClick={() => openForm(u)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 transition" title="Edit"><Edit className="w-4 h-4" /></button>
                        )}
                        {u.id !== user?.id && (
                          <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-400 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      )}
      
      {/* API Keys Tab */}
      {activeTab === 'apikeys' && <APIKeysPanel />}

      {/* Settings Tab */}
      {activeTab === 'settings' && <SettingsPanel />}

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {isLoadingLogs ? (
            <div className="animate-pulse">
              <div className="h-12 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"></div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex border-b border-gray-200 dark:border-gray-800 p-4 gap-4">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                  <thead className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Time</th>
                      <th className="px-6 py-4 font-medium">User</th>
                      <th className="px-6 py-4 font-medium">Action</th>
                      <th className="px-6 py-4 font-medium">IP Address</th>
                      <th className="px-6 py-4 font-medium">Device Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:bg-gray-700/20 transition">
                        <td className="px-6 py-4 whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1 text-gray-400 dark:text-gray-500" />{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{log.username}</td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{log.action}</td>
                        <td className="px-6 py-4 font-mono text-xs">
                          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Globe className="w-3 h-3 text-gray-400 dark:text-gray-500" /> {log.ip_address}
                            <button onClick={() => handleIpLookup(log.ip_address)} className="ml-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition" title="Lookup IP">
                              <Search className="w-3 h-3" />
                            </button>
                          </div>
                          {log.location_data && (
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1">
                              <MapPin className="w-3 h-3" /> {log.location_data.city}, {log.location_data.country}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Laptop className="w-3 h-3 text-gray-400 dark:text-gray-500" /> {log.device_info}
                          </div>
                          {log.location_data?.isp && (
                            <div className="text-gray-400 dark:text-gray-500 mt-1 pl-4">ISP: {log.location_data.isp}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded disabled:opacity-50">Prev</button>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded disabled:opacity-50">Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editingUser ? 'Edit User' : 'New User'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} disabled={!!editingUser} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 disabled:opacity-50" />
              </div>
              {!(editingUser?.username === 'admin') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{editingUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                  <input required={!editingUser} type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select disabled={editingUser?.username === 'admin'} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 disabled:opacity-50">
                  <option value="admin">Admin (Full Access)</option>
                  <option value="editor">Editor (Can't manage users)</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>

              {!(editingUser?.username === 'admin') && (
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Restricted Pages</label>
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    {[
                      { id: 'endpoints', label: 'API Endpoints' },
                      { id: 'fetch', label: 'Fetch Data' },
                      { id: 'data', label: 'Data Browser' },
                      { id: 'logs', label: 'Fetch Logs' },
                      { id: 'livelogs', label: 'Live Terminal Logs' },
                      { id: 'export', label: 'File Export & Copy' },
                    ].map((page) => (
                      <div key={page.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`restrict-${page.id}`}
                          checked={(formData.restricted_pages || []).includes(page.id)}
                          onChange={e => {
                            const current = formData.restricted_pages || [];
                            const next = e.target.checked
                              ? [...current, page.id]
                              : current.filter(p => p !== page.id);
                            setFormData({ ...formData, restricted_pages: next });
                          }}
                          className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 cursor-pointer transition shadow-sm"
                        />
                        <label htmlFor={`restrict-${page.id}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                          Restrict <span className="font-semibold">{page.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingUser && editingUser.id !== user?.id && (
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:ring-offset-0 cursor-pointer transition shadow-sm" />
                  <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Account Active</label>
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* User Logs Modal */}
      {viewingLogsForUser && (
        <UserLogsModal user={viewingLogsForUser} onClose={() => setViewingLogsForUser(null)} onIpLookup={handleIpLookup} />
      )}

      {/* IP Lookup Modal */}
      {ipModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 gap-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 min-w-0">
                <Globe className="w-5 h-5 text-gray-400 shrink-0" />
                <span className="truncate">IP Lookup: {ipModal.ip}</span>
              </h3>
              <button onClick={() => setIpModal(prev => ({ ...prev, isOpen: false }))} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition shrink-0"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              {ipModal.loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-24 w-full bg-gray-100 dark:bg-gray-900 rounded"></div>
                </div>
              ) : ipModal.error ? (
                <div className="text-red-500 text-sm">{ipModal.error}</div>
              ) : ipModal.data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500 block">Location</span><span className="text-gray-900 dark:text-white font-medium">{ipModal.data.city}, {ipModal.data.country_name}</span></div>
                    <div className="min-w-0"><span className="text-gray-500 block">ISP</span><span className="text-gray-900 dark:text-white font-medium block truncate" title={ipModal.data.org}>{ipModal.data.org}</span></div>
                    <div className="min-w-0"><span className="text-gray-500 block">Organization</span><span className="text-gray-900 dark:text-white font-medium block truncate" title={ipModal.data.org || '-'}>{ipModal.data.org || '-'}</span></div>
                    <div><span className="text-gray-500 block">Timezone</span><span className="text-gray-900 dark:text-white font-medium">{ipModal.data.timezone}</span></div>
                  </div>
                  <div className="relative mt-4">
                    <div className="absolute top-2 right-2">
                      <div className="flex gap-2">
                        {!(user?.restricted_pages || []).includes('export') && (
                          <button onClick={copyIpData} className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition" title="Copy JSON">
                            {ipModal.copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                        <button onClick={() => setIpModal(prev => ({ ...prev, isOpen: false }))} className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition" title="Close">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <pre
                      className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto max-h-[40vh] sm:max-h-[50vh]"
                      dangerouslySetInnerHTML={{ __html: syntaxHighlight(JSON.stringify(ipModal.data, null, 2)) }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserLogsModal({ user, onClose, onIpLookup }: { user: User; onClose: () => void; onIpLookup: (ip: string) => void }) {
  const { user: currentUser } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const fetchLogs = async (p: number) => {
    setIsLoading(true);
    try {
      const data = await api.getActivityLogs({ page: p, limit: 20, userId: user.id });
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch up to 10000 logs for export
      const data = await api.getActivityLogs({ page: 1, limit: 10000, userId: user.id });

      const csvHeader = 'Time,Action,IP Address,City,Country,ISP,Device Info\n';
      const csvRows = data.logs.map(log => {
        return [
          new Date(log.created_at).toISOString(),
          log.action,
          log.ip_address,
          log.location_data?.city || '',
          log.location_data?.country || '',
          log.location_data?.isp || '',
          `"${log.device_info}"`
        ].join(',');
      });

      const csvContent = csvHeader + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity_logs_${user.username}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export logs');
    }
    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Logs for {user.username}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Showing up to 10,000 most recent actions</p>
            </div>
            <div className="flex items-center gap-3">
              {!(currentUser?.restricted_pages || []).includes('export') && (
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
                >
                  {isExporting ? <span className="animate-spin">⌛</span> : <Download className="w-4 h-4" />}
                  Export CSV
                </button>
              )}
              <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && logs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden animate-pulse">
              <div className="h-12 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"></div>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex border-b border-gray-200 dark:border-gray-800 p-4 gap-4">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">No activity logs found for this user.</div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                  <thead className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Time</th>
                      <th className="px-6 py-4 font-medium">Action</th>
                      <th className="px-6 py-4 font-medium">IP Address & Location</th>
                      <th className="px-6 py-4 font-medium">Device & Network Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-white dark:bg-gray-800/50 transition">
                        <td className="px-6 py-4 whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1 text-gray-400 dark:text-gray-500" />{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">{log.action}</td>
                        <td className="px-6 py-4 font-mono text-xs">
                          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Globe className="w-3 h-3 text-gray-400 dark:text-gray-500" /> {log.ip_address}
                            <button onClick={() => onIpLookup(log.ip_address)} className="ml-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition" title="Lookup IP">
                              <Search className="w-3 h-3" />
                            </button>
                          </div>
                          {log.location_data && (
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1">
                              <MapPin className="w-3 h-3" /> {log.location_data.city}, {log.location_data.country}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Laptop className="w-3 h-3 text-gray-400 dark:text-gray-500" /> {log.device_info}
                          </div>
                          {log.location_data?.isp && (
                            <div className="text-gray-400 dark:text-gray-500 mt-1 pl-4 truncate max-w-xs" title={log.location_data.org || log.location_data.isp}>
                              ISP: {log.location_data.isp}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {Math.max(1, totalPages)}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg disabled:opacity-50 hover:bg-slate-600 transition">Previous</button>
            <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg disabled:opacity-50 hover:bg-slate-600 transition">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [timeout, setTimeoutVal] = useState('24h');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(data => setTimeoutVal(data.session_timeout || '24h')).catch(console.error);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateSettings({ session_timeout: timeout });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Security Settings</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Session Timeout Duration
          </label>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <input
              type="text"
              value={timeout}
              onChange={(e) => setTimeoutVal(e.target.value)}
              className="w-full sm:flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white"
              placeholder="e.g., 24h, 30m, 7d"
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition shadow-sm whitespace-nowrap"
            >
              {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Controls how long a user stays logged in before being forced to re-authenticate. <br/>
            Valid formats: <b className="text-gray-700 dark:text-gray-300">30m</b> (30 minutes), <b className="text-gray-700 dark:text-gray-300">12h</b> (12 hours), <b className="text-gray-700 dark:text-gray-300">7d</b> (7 days). <br/>
            Note: Changing this only applies to newly generated session tokens.
          </p>
        </div>
      </div>
    </div>
  );
}

function APIKeysPanel() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  
  // Rate Limiting State
  const [rateLimitMax, setRateLimitMax] = useState(10);
  const [rateLimitWindow, setRateLimitWindow] = useState('s'); // 's', 'm', 'h'
  
  // Quota State
  const [quotaMax, setQuotaMax] = useState(1000);
  const [quotaWindow, setQuotaWindow] = useState('day'); // 'day', 'week', 'month'

  const [expiresIn, setExpiresIn] = useState('never'); // 'never', '30d', '6m', '1y'

  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await api.getApiKeys();
      setKeys(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await api.createApiKey(
        newKeyName, 
        { max: rateLimitMax, window: rateLimitWindow },
        { max: quotaMax, window: quotaWindow },
        expiresIn
      );
      setGeneratedKey(res.full_key);
      setNewKeyName('');
      fetchKeys();
    } catch (e) {
      alert('Failed to generate key');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action is permanent and will instantly break any apps using it.')) return;
    try {
      await api.deleteApiKey(id);
      fetchKeys();
    } catch (e) {
      alert('Failed to revoke key');
    }
  };

  return (
    <div className="space-y-6">
      {generatedKey && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 relative">
          <button onClick={() => setGeneratedKey(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-green-800 dark:text-green-400 font-bold mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> API Key Generated Successfully!
          </h3>
          <p className="text-green-700 dark:text-green-500 mb-4 text-sm">
            Please copy this key immediately. For security reasons, we only store the hash of this key and it will NEVER be shown again!
          </p>
          <div className="flex gap-2">
            <code className="flex-1 bg-white dark:bg-black border border-green-200 dark:border-green-800 p-3 rounded text-sm break-all font-mono">
              {generatedKey}
            </code>
            <button 
              onClick={() => { navigator.clipboard.writeText(generatedKey); alert('Copied!'); }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Public API Gateway</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Generate API Keys to securely query aggregated data from external applications via <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded text-xs text-indigo-500">/api/v1/public/:collection</code></p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Key Name</label>
            <input
              type="text"
              placeholder="e.g., Marketing App"
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Rate Limit (Short-term)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                value={rateLimitMax}
                onChange={(e) => setRateLimitMax(parseInt(e.target.value) || 1)}
              />
              <span className="text-gray-500 self-center text-sm">per</span>
              <select 
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-900 dark:text-white"
                value={rateLimitWindow}
                onChange={(e) => setRateLimitWindow(e.target.value)}
              >
                <option value="s">Second</option>
                <option value="m">Minute</option>
                <option value="h">Hour</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Quota (Long-term)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                value={quotaMax}
                onChange={(e) => setQuotaMax(parseInt(e.target.value) || 1)}
              />
              <span className="text-gray-500 self-center text-sm">per</span>
              <select 
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-900 dark:text-white"
                value={quotaWindow}
                onChange={(e) => setQuotaWindow(e.target.value)}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Expiration</label>
            <select 
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
            >
              <option value="never">Never Expire</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="3m">3 Months</option>
              <option value="6m">6 Months</option>
              <option value="1y">1 Year</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleCreate}
            disabled={!newKeyName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 whitespace-nowrap"
          >
            Generate Key
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading API Keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No API keys generated yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Key Name</th>
                  <th className="px-6 py-4 font-medium">Prefix</th>
                  <th className="px-6 py-4 font-medium">Created By</th>
                  <th className="px-6 py-4 font-medium">Last Used</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                {keys.map((k) => (
                  <tr key={k._id} className="hover:bg-gray-50 dark:bg-gray-700/20 transition">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{k.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{k.prefix}</td>
                    <td className="px-6 py-4">{k.created_by}</td>
                    <td className="px-6 py-4">
                      {k.last_used ? new Date(k.last_used).toLocaleString() : <span className="text-gray-400">Never</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(k._id)} className="p-2 text-gray-400 hover:text-red-400 transition" title="Revoke Key">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
