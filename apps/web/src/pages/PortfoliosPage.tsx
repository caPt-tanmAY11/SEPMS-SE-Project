import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FolderKanban, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  DollarSign, 
  User, 
  ArrowUpDown,
  Archive,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export interface PortfolioItem {
  id: string;
  name: string;
  description: string;
  target_budget: string;
  currency: string;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'ARCHIVED';
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  owner_name: string;
  owner_email: string;
  owner_id: string;
}

export const PortfoliosPage: React.FC = () => {
  const { user, canCreatePortfolio } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [sortField, setSortField] = useState<'created_at' | 'name' | 'target_budget' | 'start_date'>('created_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const { data: portfolios, isLoading, error } = useQuery<PortfolioItem[]>({
    queryKey: ['portfolios', statusFilter, sortField, sortOrder, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      params.append('sort', sortField);
      params.append('order', sortOrder);
      return apiRequest<PortfolioItem[]>(`/portfolios?${params.toString()}`);
    }
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
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-brand-400" />
            <span>Software Portfolios</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Universal access directory of all engineering initiatives, budget allocations, and timelines.
          </p>
        </div>

        <div>
          {canCreatePortfolio ? (
            <Link
              to="/portfolios/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Portfolio</span>
            </Link>
          ) : (
            <div
              title="Portfolio creation is restricted to Portfolio Managers and Admins. Universal Read Access is active."
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-500 text-xs font-semibold border border-slate-700/60 cursor-not-allowed"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              <span>Create Portfolio (Read-Only Role)</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by portfolio name or description..."
            className="w-full glass-input pl-9 pr-4 py-2 rounded-lg text-xs text-white placeholder-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter Tabs */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-medium">
            {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  statusFilter === tab
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="created_at" className="bg-slate-900">Date Created</option>
              <option value="name" className="bg-slate-900">Name</option>
              <option value="target_budget" className="bg-slate-900">Target Budget</option>
              <option value="start_date" className="bg-slate-900">Start Date</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="ml-1 text-[11px] font-mono text-slate-400 hover:text-white"
              title="Toggle sort direction"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Card Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel p-6 rounded-xl border border-slate-800 animate-pulse space-y-4">
              <div className="h-5 bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 glass-panel rounded-xl border border-rose-500/30 text-center">
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto mb-2" />
          <p className="text-sm text-rose-300">Error loading portfolios.</p>
          <p className="text-xs text-slate-500 mt-1">Please ensure the backend API is running on port 3001.</p>
        </div>
      ) : !portfolios || portfolios.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800/80">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Portfolios Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'No portfolios match your current search criteria.' : 'No software engineering portfolios have been registered yet.'}
          </p>
          {canCreatePortfolio && !search && (
            <Link
              to="/portfolios/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Portfolio</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {portfolios.map((portfolio) => (
            <Link
              key={portfolio.id}
              to={`/portfolios/${portfolio.id}`}
              className="glass-panel rounded-xl border border-slate-800/80 hover:border-slate-700/90 p-5 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-slate-900/50"
            >
              <div>
                {/* Header: Name and Status */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-1">
                    {portfolio.name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border shrink-0 ${
                      portfolio.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {portfolio.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {portfolio.description || 'No description provided.'}
                </p>

                {/* Metadata Fields */}
                <div className="space-y-2 py-3 border-t border-b border-slate-800/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span>Target Budget</span>
                    </span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatCurrency(portfolio.target_budget, portfolio.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Timeline</span>
                    </span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {portfolio.start_date} → {portfolio.end_date}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Owner</span>
                    </span>
                    <span className="text-slate-300 font-medium truncate max-w-[140px]">
                      {portfolio.owner_name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span title={`Portfolio ID: ${portfolio.id}`}>
                  ID: {portfolio.id.slice(0, 8)}...
                </span>
                <span className="text-brand-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  View Details →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
