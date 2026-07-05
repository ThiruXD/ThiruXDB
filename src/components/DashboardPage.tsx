import { useState, useEffect } from 'react';
import { ApiEndpoint, DataRecord, FetchLog } from '../types/database';
import { api } from '../lib/api';
import {
  Database,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  AlertCircle,
  Loader2,
  Server,
} from 'lucide-react';

interface SystemStatus {
  mongoUri: string;
  mongoStatus: string;
  databaseName: string;
}

interface DashboardStats {
  totalEndpoints: number;
  activeEndpoints: number;
  totalRecords: number;
  recordsThisWeek: number;
  lastFetchTime: string | null;
  errors: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEndpoints: 0,
    activeEndpoints: 0,
    totalRecords: 0,
    recordsThisWeek: 0,
    lastFetchTime: null,
    errors: 0,
  });
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [recentRecords, setRecentRecords] = useState<DataRecord[]>([]);
  const [recentLogs, setRecentLogs] = useState<(FetchLog & { endpoint_name: string })[]>([]);
  const [perEndpoint, setPerEndpoint] = useState<Record<string, number>>({});
  const [isSyncingStats, setIsSyncingStats] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboard();
      setSystem(data.system);
      setStats(data.stats);
      setEndpoints(data.endpoints);
      setRecentRecords(data.recentRecords);
      setRecentLogs(data.recentLogs);
      setPerEndpoint(data.perEndpoint);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your API data sources</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setIsSyncingStats(true);
              try {
                await api.syncEndpointStats();
                await loadDashboardData();
              } catch (err) {
                console.error(err);
              }
              setIsSyncingStats(false);
            }}
            disabled={isSyncingStats}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition disabled:opacity-50 border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingStats ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncingStats ? 'Syncing...' : 'Sync Stats'}</span>
          </button>
          <button
            onClick={loadDashboardData}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition border border-transparent hover:border-slate-700"
            title="Refresh Dashboard"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* System Status Banner */}
      {system && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className={`p-2 rounded-lg ${system.mongoStatus === 'Connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-white font-medium">Database Status</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${system.mongoStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-slate-400">{system.mongoStatus} to <span className="font-mono text-slate-300">{system.databaseName}</span></span>
              </div>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-500 mb-1">Connection URI</p>
            <p className="font-mono text-sm text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">{system.mongoUri}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Records"
          value={stats.totalRecords.toLocaleString()}
          subtitle={`${stats.recordsThisWeek.toLocaleString()} this week`}
          icon={Database}
          color="blue"
        />
        <StatCard
          title="API Endpoints"
          value={stats.activeEndpoints.toString()}
          subtitle={`${stats.totalEndpoints} total`}
          icon={ExternalLink}
          color="green"
        />
        <StatCard
          title="Last Sync"
          value={
            stats.lastFetchTime
              ? new Date(stats.lastFetchTime).toLocaleDateString()
              : 'Never'
          }
          subtitle={
            stats.lastFetchTime
              ? new Date(stats.lastFetchTime).toLocaleTimeString()
              : 'No data fetched yet'
          }
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Errors"
          value={stats.errors.toString()}
          subtitle={
            stats.errors > 0 ? 'Attention needed' : 'All systems healthy'
          }
          icon={stats.errors > 0 ? AlertCircle : CheckCircle}
          color={stats.errors > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoints Status */}
        <div className="lg:col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Endpoints</h2>
            <span className="text-sm text-slate-400">
              {stats.activeEndpoints} active
            </span>
          </div>

          {endpoints.length === 0 ? (
            <div className="text-center py-8">
              <ExternalLink className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No endpoints configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {endpoints.slice(0, 5).map((endpoint) => (
                <div
                  key={endpoint.id}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
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
                    <div>
                      <p className="text-white text-sm font-medium">
                        {endpoint.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {endpoint.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  {endpoint.last_error && (
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
              ))}
              {endpoints.length > 5 && (
                <p className="text-xs text-slate-500 text-center pt-2">
                  +{endpoints.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>

          {recentLogs.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No activity yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Fetch data from endpoints to see activity
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : log.status === 'partial' ? (
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        {log.endpoint_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {log.records_created + log.records_updated} records
                        processed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      {log.duration_ms}ms
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Distribution Chart */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Records by Endpoint
        </h2>

        {endpoints.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No data to display
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {endpoints.map((endpoint) => {
              const recordCount = perEndpoint[endpoint.id] || 0;
              const percentageOfTotal =
                stats.totalRecords > 0
                  ? Math.round((recordCount / stats.totalRecords) * 100)
                  : 0;

              return (
                <div key={endpoint.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 flex flex-col justify-between">
                  <span className="text-sm font-medium text-slate-300 truncate mb-2" title={endpoint.name}>
                    {endpoint.name}
                  </span>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-white">
                      {recordCount.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md">
                      {percentageOfTotal}% of total db
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'red';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-400 shadow-blue-500/25',
    green: 'from-green-500 to-emerald-400 shadow-green-500/25',
    purple: 'from-purple-500 to-pink-400 shadow-purple-500/25',
    red: 'from-red-500 to-orange-400 shadow-red-500/25',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
