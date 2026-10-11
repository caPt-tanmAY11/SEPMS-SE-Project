import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, User, Shield, Server, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  const { data: health, isLoading: healthLoading } = useQuery<any>({
    queryKey: ['systemHealth'],
    queryFn: () => apiRequest('/health'),
    refetchInterval: 15000
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-600" />
          <span>System & Account Settings</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review your authenticated profile, application role, and runtime system integration status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>Active Identity</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-mono text-[11px] uppercase">Full Name</span>
              <div className="font-semibold text-slate-800 mt-0.5">{user?.fullName || 'Anonymous'}</div>
            </div>

            <div>
              <span className="text-slate-400 font-mono text-[11px] uppercase">Corporate Email</span>
              <div className="font-mono text-slate-700 mt-0.5">{user?.email || 'N/A'}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-mono text-[11px] uppercase">Department</span>
                <div className="text-slate-700 mt-0.5">{user?.department || 'Engineering'}</div>
              </div>
              <div>
                <span className="text-slate-400 font-mono text-[11px] uppercase">Employee ID</span>
                <div className="text-slate-700 font-mono mt-0.5">{user?.employeeId || 'EMP-0000'}</div>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-mono text-[11px] uppercase">Assigned Application Role</span>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono font-bold text-[11px] bg-brand-50 text-brand-700 border-brand-200">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{user?.role}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Runtime System Health Card */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Server className="w-4 h-4 text-emerald-600" />
            <span>Runtime & Integration Health</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-mono text-[11px] uppercase">Backend API Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-slate-800">
                  {healthLoading ? 'Checking...' : health?.status === 'ok' ? 'Online & Healthy' : 'Degraded'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-mono text-[11px] uppercase">Database Mode</span>
              <div className="flex items-center gap-2 mt-1 font-mono text-slate-700">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-semibold text-indigo-700">{health?.databaseMode || 'Detecting...'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-mono text-[11px] uppercase">Service Version</span>
              <div className="font-mono text-slate-700 mt-0.5">{health?.version || '1.0.0'}</div>
            </div>

            <div>
              <span className="text-slate-400 font-mono text-[11px] uppercase">Server Timestamp</span>
              <div className="font-mono text-slate-500 text-[11px] mt-0.5">
                {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
