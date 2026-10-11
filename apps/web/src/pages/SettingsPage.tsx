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
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-400" />
          <span>System & Account Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Review your authenticated profile, application role, and runtime system integration status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Active Identity</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 font-mono text-[11px] uppercase">Full Name</span>
              <div className="font-semibold text-slate-200 mt-0.5">{user?.fullName || 'Anonymous'}</div>
            </div>

            <div>
              <span className="text-slate-500 font-mono text-[11px] uppercase">Corporate Email</span>
              <div className="font-mono text-slate-300 mt-0.5">{user?.email || 'N/A'}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 font-mono text-[11px] uppercase">Department</span>
                <div className="text-slate-300 mt-0.5">{user?.department || 'Engineering'}</div>
              </div>
              <div>
                <span className="text-slate-500 font-mono text-[11px] uppercase">Employee ID</span>
                <div className="text-slate-300 font-mono mt-0.5">{user?.employeeId || 'EMP-0000'}</div>
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-mono text-[11px] uppercase">Assigned Application Role</span>
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-brand-500/10 text-brand-300 border border-brand-500/30">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System & Database Integration */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Backend Integration Status</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <div className="font-medium text-slate-200">Express REST API</div>
                <div className="text-[11px] text-slate-500 font-mono">http://localhost:3001/api/v1</div>
              </div>
              {health?.status === 'ok' ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Online</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
                  <AlertCircle className="w-4 h-4" />
                  <span>Connecting...</span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <div className="font-medium text-slate-200">Database Engine</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {health?.databaseMode === 'postgresql-live' ? 'Supabase PostgreSQL (Live)' : 'PostgreSQL Driver (Mock/Dev)'}
                </div>
              </div>
              <Database className="w-4 h-4 text-slate-400" />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Phase 1 Delivery:</strong> Portfolio Creation & Management, Supabase Auth session token verification, Universal Read Access, Optimistic Concurrency Control, and Deletion Protection.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
