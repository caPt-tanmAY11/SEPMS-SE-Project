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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-brand-600" />
            <span>Software Portfolios</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Universal access directory of all engineering initiatives, budget allocations, and timelines.
          </p>
        </div>

        {canCreatePortfolio ? (
          <Link
            to="/portfolios/new"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-500/20 transition-colors flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Portfolio</span>
          </Link>
        ) : (
          <div
            title="Only Portfolio Managers and Admins can create portfolios"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            <span>Create (Managers Only)</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by portfolio name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-xs focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {status === 'ALL' ? 'All Portfolios' : status === 'ACTIVE' ? 'Active' : 'Archived'}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <select
            value={sortField}
            onChange={(e: any) => setSortField(e.target.value)}
            className="glass-input px-3 py-1.5 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="created_at">Date Created</option>
            <option value="name">Name</option>
            <option value="target_budget">Budget</option>
            <option value="start_date">Start Date</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Portfolios Grid Display */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400">
          <div className="inline-block animate-spin w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full mb-3"></div>
          <p className="text-xs">Loading portfolios...</p>
        </div>
      ) : error ? (
        <div className="p-10 text-center text-rose-600 glass-card rounded-xl flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-semibold">Failed to load portfolios from database.</p>
        </div>
      ) : portfolios?.length === 0 ? (
        <div className="p-16 text-center text-slate-400 glass-card rounded-xl">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">No matching portfolios found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or create a new portfolio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {portfolios?.map((portfolio) => (
            <Link
              key={portfolio.id}
              to={`/portfolios/${portfolio.id}`}
              className="glass-card p-5 rounded-xl flex flex-col justify-between group hover:border-brand-300 transition-all"
            >
              <div>
                {/* Header: Title and Status */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {portfolio.name}
                  </h3>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold shrink-0 ${
                    portfolio.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${portfolio.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {portfolio.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {portfolio.description || 'No description provided.'}
                </p>
              </div>

              {/* Meta details */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-[11px] uppercase">Target Budget</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(portfolio.target_budget, portfolio.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-[11px] uppercase">Timeline</span>
                  <div className="flex items-center gap-1 text-slate-600 text-[11px] font-mono">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{portfolio.start_date} → {portfolio.end_date}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400 font-mono text-[11px] uppercase">Owner</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <User className="w-3 h-3 text-brand-500" />
                    <span>{portfolio.owner_name}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
