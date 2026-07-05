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
  Search
} from 'lucide-react';

export function UsersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users');
  
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
    is_active: true
  });

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
      setFormData({ username: u.username, role: u.role, is_active: u.is_active });
    } else {
      setEditingUser(null);
      setFormData({ username: '', password: '', role: 'viewer', is_active: true });
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
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-px">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition ${
            activeTab === 'users' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4" /> Users
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition ${
            activeTab === 'activity' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
          }`}
        >
          <Activity className="w-4 h-4" /> Activity Logs
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => openForm()} className="flex items-center gap-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition shadow-sm shadow-gray-900/10 dark:shadow-white/10">
              <UserPlus className="w-4 h-4" /> Add User
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
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
                        <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${
                          u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
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
                        <button onClick={() => setViewingLogsForUser(u)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-400 transition" title="View Logs"><Activity className="w-4 h-4"/></button>
                        <button onClick={() => openForm(u)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 transition" title="Edit"><Edit className="w-4 h-4"/></button>
                        {u.id !== user?.id && (
                          <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-400 transition" title="Delete"><Trash2 className="w-4 h-4"/></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
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
                    <td className="px-6 py-4 whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1 text-gray-400 dark:text-gray-500"/>{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{log.username}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{log.action}</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <Globe className="w-3 h-3 text-gray-400 dark:text-gray-500" /> {log.ip_address}
                        <a href={`https://ipinfo.io/${log.ip_address}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition" title="Lookup IP">
                          <Search className="w-3 h-3" />
                        </a>
                      </div>
                      {log.location_data && (
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1">
                          <MapPin className="w-3 h-3" /> {log.location_data.city}, {log.location_data.country}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <Laptop className="w-3 h-3 text-gray-400 dark:text-gray-500"/> {log.device_info}
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
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} disabled={!!editingUser} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{editingUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input required={!editingUser} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100">
                  <option value="admin">Admin (Full Access)</option>
                  <option value="editor">Editor (Can't manage users)</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>
              {editingUser && editingUser.id !== user?.id && (
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded" />
                  <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Account Active</label>
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition flex items-center justify-center gap-2">
                  <Save className="w-4 h-4"/> Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* User Logs Modal */}
      {viewingLogsForUser && (
        <UserLogsModal user={viewingLogsForUser} onClose={() => setViewingLogsForUser(null)} />
      )}
    </div>
  );
}

function UserLogsModal({ user, onClose }: { user: User; onClose: () => void }) {
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
      link.setAttribute('download', `activity_logs_${user.username}_${new Date().toISOString().slice(0,10)}.csv`);
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
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Activity className="w-5 h-5 text-gray-700 dark:text-gray-300" /> Activity Logs: {user.username}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detailed history of this user's actions</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-gray-900 dark:text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {isExporting ? <span className="animate-spin">⌛</span> : <Download className="w-4 h-4" />}
              Export CSV
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading logs...</div>
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
                        <td className="px-6 py-4 whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1 text-gray-400 dark:text-gray-500"/>{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">{log.action}</td>
                        <td className="px-6 py-4 font-mono text-xs">
                          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Globe className="w-3 h-3 text-gray-400 dark:text-gray-500" /> {log.ip_address}
                            <a href={`https://ipinfo.io/${log.ip_address}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition" title="Lookup IP">
                              <Search className="w-3 h-3" />
                            </a>
                          </div>
                          {log.location_data && (
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1">
                              <MapPin className="w-3 h-3" /> {log.location_data.city}, {log.location_data.country}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Laptop className="w-3 h-3 text-gray-400 dark:text-gray-500"/> {log.device_info}
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
