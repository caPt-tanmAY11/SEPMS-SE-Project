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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Engineering Portfolio Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centralized hub for tracking software engineering initiatives, technical assets, and lifecycle status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/portfolios"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors flex items-center gap-2"
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
            <span>View All Portfolios</span>
          </Link>

          {canCreatePortfolio ? (
            <Link
              to="/portfolios/new"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-500/20 transition-colors flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Portfolio</span>
            </Link>
          ) : (
            <div
              title="Portfolio creation is restricted to Portfolio Managers and Admins"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>Create Portfolio (Restricted)</span>
            </div>
          )}
        </div>
      </div>

      {/* Real Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Portfolios */}
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Total Portfolios
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-100 animate-pulse rounded"></div>
              ) : (
                stats?.totalPortfolios ?? 0
              )}
            </div>
            <p className="text-[12px] text-slate-500 mt-1 font-medium">
              Software initiatives registered
            </p>
          </div>
        </div>

        {/* Active Portfolios */}
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Active Portfolios
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-100 animate-pulse rounded"></div>
              ) : (
                stats?.activePortfolios ?? 0
              )}
            </div>
            <p className="text-[12px] text-slate-500 mt-1 font-medium">
              Currently ongoing engineering work
            </p>
          </div>
        </div>

        {/* Archived Portfolios */}
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Archived Portfolios
            </span>
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-700 tracking-tight">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-100 animate-pulse rounded"></div>
              ) : (
                stats?.archivedPortfolios ?? 0
              )}
            </div>
            <p className="text-[12px] text-slate-500 mt-1 font-medium">
              Preserved historical archives
            </p>
          </div>
        </div>
      </div>

      {/* Role-Specific Overview Info Banner */}
      <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/60 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-600 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <span className="font-semibold text-indigo-900 block">
            Universal Read Access Active (BR-01)
          </span>
          <p className="text-indigo-700 mt-0.5 leading-relaxed">
            You are authenticated as <span className="font-semibold">{user?.fullName}</span> ({user?.role}). All technical assets, milestones, and portfolios across the organization are visible to all authenticated roles for organizational transparency. Mutation is strictly enforced via server-side RBAC.
          </p>
        </div>
      </div>

      {/* Recent Portfolios Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Engineering Initiatives</h3>
            <p className="text-xs text-slate-500">Live portfolios retrieved from repository database</p>
          </div>
          <Link
            to="/portfolios"
            className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 hover:underline"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-slate-400">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mb-2"></div>
            <p className="text-xs">Loading live portfolios...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            <p className="text-xs font-medium">Failed to load recent portfolios.</p>
          </div>
        ) : stats?.recentPortfolios?.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FolderKanban className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">No portfolios created yet</p>
            <p className="text-xs text-slate-400 mt-1">Get started by creating your first engineering portfolio.</p>
            {canCreatePortfolio && (
              <Link
                to="/portfolios/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Portfolio</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Initiative Name</th>
                  <th className="px-6 py-3.5 font-semibold">Owner</th>
                  <th className="px-6 py-3.5 font-semibold">Target Budget</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold">Registered</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stats?.recentPortfolios.map((portfolio) => (
                  <tr key={portfolio.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <Link to={`/portfolios/${portfolio.id}`} className="hover:text-brand-600 transition-colors">
                        {portfolio.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {portfolio.owner_name}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      {formatCurrency(portfolio.target_budget, portfolio.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                        portfolio.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${portfolio.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {portfolio.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                      {new Date(portfolio.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/portfolios/${portfolio.id}`}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
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
