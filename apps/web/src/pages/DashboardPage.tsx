import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FolderKanban, 
  CheckCircle2, 
  Archive, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface StatsResponse {
  totalPortfolios: number;
  activePortfolios: number;
  archivedPortfolios: number;
  recentPortfolios: Array<{
    id: string;
    name: string;
    target_budget: string;
    currency: string;
    status: 'ACTIVE' | 'ARCHIVED';
    created_at: string;
    owner_name: string;
  }>;
}

export const DashboardPage: React.FC = () => {
  const { user, canCreatePortfolio } = useAuth();

  const { data: stats, isLoading, error } = useQuery<StatsResponse>({
    queryKey: ['portfolioStats'],
    queryFn: () => apiRequest<StatsResponse>('/portfolios/stats')
  });

  const formatCurrency = (amount: string | number, currency: string) => {
    const num = Number(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Engineering Portfolio Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Centralized hub for tracking software engineering portfolios, technical assets, and lifecycle status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/portfolios"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2"
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
            <span>View All Portfolios</span>
          </Link>

          {canCreatePortfolio ? (
            <Link
              to="/portfolios/new"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 transition-colors flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Portfolio</span>
            </Link>
          ) : (
            <div
              title="Portfolio creation is restricted to Portfolio Managers and Admins"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>Create Portfolio (Restricted)</span>
            </div>
          )}
        </div>
      </div>

      {/* Real Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Portfolios */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800/80 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
              Total Portfolios
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-800 animate-pulse rounded"></div>
              ) : (
                stats?.totalPortfolios ?? 0
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Software initiatives registered
            </p>
          </div>
        </div>

        {/* Active Portfolios */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800/80 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
              Active Portfolios
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-800 animate-pulse rounded"></div>
              ) : (
                stats?.activePortfolios ?? 0
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Currently ongoing engineering work
            </p>
          </div>
        </div>

        {/* Archived Portfolios */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800/80 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
              Archived Portfolios
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-300 tracking-tight">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-800 animate-pulse rounded"></div>
              ) : (
                stats?.archivedPortfolios ?? 0
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Preserved for historical audit integrity
            </p>
          </div>
        </div>
      </div>

      {/* Universal Read Notice */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-brand-300">Universal Read Access Active:</strong> All employees have full visibility into every portfolio, budget, and engineering metadata per corporate transparency standards (SRS BR-01). Modification permissions are strictly verified by backend RBAC.
        </div>
      </div>

      {/* Recent Portfolios Table */}
      <div className="glass-panel rounded-xl border border-slate-800/80 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Recently Created Portfolios</h3>
            <p className="text-xs text-slate-400 mt-0.5">Most recent additions to the organization's portfolio registry</p>
          </div>
          <Link
            to="/portfolios"
            className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-slate-800/60 rounded"></div>
              <div className="h-6 bg-slate-800/60 rounded"></div>
              <div className="h-6 bg-slate-800/60 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-400 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Failed to load portfolio statistics. Please ensure the backend is running.</span>
          </div>
        ) : !stats?.recentPortfolios || stats.recentPortfolios.length === 0 ? (
          <div className="p-12 text-center">
            <FolderKanban className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No portfolios created yet.</p>
            {canCreatePortfolio && (
              <Link
                to="/portfolios/new"
                className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-brand-600 text-xs font-medium text-white hover:bg-brand-500 transition-colors"
              >
                Create your first portfolio
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-medium">Portfolio Name</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Target Budget</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.recentPortfolios.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-200">
                      <Link to={`/portfolios/${p.id}`} className="hover:text-brand-400 transition-colors">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      {formatCurrency(p.target_budget, p.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {p.owner_name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/portfolios/${p.id}`}
                        className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                      >
                        Details
                      </Link>
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
};
