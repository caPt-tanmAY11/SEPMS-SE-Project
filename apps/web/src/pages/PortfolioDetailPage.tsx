import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FolderKanban, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  User, 
  Users, 
  Archive, 
  Edit3, 
  Clock, 
  GitBranch, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  TrendingUp,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const updateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  description: z.string().max(1000).default(''),
  targetBudget: z.coerce.number().positive('Budget must be greater than 0'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select valid start date'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select valid end date')
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate']
});

type UpdateFormData = z.infer<typeof updateSchema>;

export const PortfolioDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, canEditPortfolio } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'analytics'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const { data: portfolio, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['portfolio', id],
    queryFn: () => apiRequest(`/portfolios/${id}`),
    enabled: !!id
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema)
  });

  // Open edit modal and populate initial values
  const handleOpenEdit = () => {
    if (!portfolio) return;
    setConflictError(null);
    reset({
      name: portfolio.name,
      description: portfolio.description,
      targetBudget: Number(portfolio.target_budget),
      currency: portfolio.currency,
      startDate: portfolio.start_date,
      endDate: portfolio.end_date
    });
    setIsEditModalOpen(true);
  };

  // Update Mutation with Optimistic Concurrency Control
  const updateMutation = useMutation({
    mutationFn: (data: UpdateFormData) => {
      return apiRequest(`/portfolios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...data,
          version: portfolio.version // Pass current OCC version
        })
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['portfolio', id], updated);
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      setIsEditModalOpen(false);
      setConflictError(null);
    },
    onError: (err: any) => {
      if (err.status === 409 || err.code === 'VERSION_CONFLICT') {
        setConflictError(err.message || 'Optimistic concurrency collision: This portfolio was modified by another session. Please refresh.');
      } else {
        setConflictError(err.message || 'Update failed.');
      }
    }
  });

  // Archive Mutation
  const archiveMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/portfolios/${id}/archive`, {
        method: 'POST'
      });
    },
    onSuccess: (archived) => {
      queryClient.setQueryData(['portfolio', id], archived);
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioStats'] });
      setIsArchiveModalOpen(false);
    }
  });

  const onUpdateSubmit = (data: UpdateFormData) => {
    updateMutation.mutate(data);
  };

  const formatCurrency = (amount: string | number, currency: string) => {
    const num = Number(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
        <div className="h-48 bg-slate-800 rounded-2xl"></div>
        <div className="h-64 bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center max-w-lg mx-auto mt-12 border border-rose-500/30">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Portfolio Not Found</h3>
        <p className="text-xs text-slate-400 mt-2">
          The requested portfolio could not be located or may have been invalidly referenced.
        </p>
        <div className="mt-6">
          <Link
            to="/portfolios"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
          >
            Back to Portfolios
          </Link>
        </div>
      </div>
    );
  }

  const isAuthorizedToEdit = canEditPortfolio(portfolio.owner_id);

  return (
    <div className="space-y-6">
      {/* Back button and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link
            to="/portfolios"
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-white">{portfolio.name}</h2>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                  portfolio.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {portfolio.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-slate-500 font-mono text-[11px]">
              <span>ID: {portfolio.id}</span>
              <span>•</span>
              <span>OCC Version: v{portfolio.version}</span>
            </div>
          </div>
        </div>

        {/* Edit and Archive Actions */}
        <div className="flex items-center gap-2.5">
          {isAuthorizedToEdit ? (
            <>
              <button
                onClick={handleOpenEdit}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Portfolio</span>
              </button>

              {portfolio.status === 'ACTIVE' && (
                <button
                  onClick={() => setIsArchiveModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-2 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>
              )}
            </>
          ) : (
            <div
              title="Editing and archiving is restricted to the designated Portfolio Owner or System Administrator."
              className="px-3.5 py-2 rounded-lg bg-slate-900 text-slate-500 text-xs font-semibold border border-slate-800 cursor-not-allowed flex items-center gap-2"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>Read-Only Viewer</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-brand-500 text-brand-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Portfolio Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'border-brand-500 text-brand-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Transactions & Milestones</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-400">Phase 2</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-brand-500 text-brand-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Analytics & Risks</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-400">Phase 3</span>
        </button>
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Target Budget</span>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {formatCurrency(portfolio.target_budget, portfolio.currency)}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{portfolio.currency} currency</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Start Date</span>
              <div className="text-lg font-bold text-slate-200 font-mono mt-1">
                {portfolio.start_date}
              </div>
              <span className="text-[10px] text-slate-500">Initiation date</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Target End Date</span>
              <div className="text-lg font-bold text-slate-200 font-mono mt-1">
                {portfolio.end_date}
              </div>
              <span className="text-[10px] text-slate-500">Target completion</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Designated Owner</span>
              <div className="text-sm font-bold text-brand-300 truncate mt-1">
                {portfolio.owner_name}
              </div>
              <span className="text-[10px] text-slate-500 font-mono truncate block">{portfolio.owner_email}</span>
            </div>
          </div>

          {/* Description & Objective */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Scope & Objectives
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {portfolio.description || 'No description entered for this portfolio.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Members List */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Team Allocation</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {portfolio.members?.length || 0} members
                </span>
              </div>

              {!portfolio.members || portfolio.members.length === 0 ? (
                <p className="text-xs text-slate-500">No members assigned.</p>
              ) : (
                <div className="space-y-2.5">
                  {portfolio.members.map((m: any) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{m.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{m.email}</div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                          m.role === 'OWNER'
                            ? 'bg-brand-500/10 text-brand-400 border-brand-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Software Assets */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  <span>Technical Assets (Repositories & Boards)</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {portfolio.assets?.length || 0} assets
                </span>
              </div>

              {!portfolio.assets || portfolio.assets.length === 0 ? (
                <p className="text-xs text-slate-500">No external source code repositories or Jira boards linked yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {portfolio.assets.map((asset: any) => (
                    <div
                      key={asset.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-slate-200 truncate">{asset.name}</div>
                        <span className="text-[10px] text-emerald-400 font-mono uppercase">{asset.type}</span>
                      </div>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Transactions (Phase 2 Placeholder) */}
      {activeTab === 'transactions' && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">
            Phase 2: Financial Transactions and Milestone Tracking
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            This module will track immutable budget consumption events (infrastructure billing, vendor costs, labor) and sprint/deployment milestones. It is scheduled for implementation in Phase 2 upon user approval.
          </p>
        </div>
      )}

      {/* Tab Content: Analytics (Phase 3 Placeholder) */}
      {activeTab === 'analytics' && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <TrendingUp className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">
            Phase 3: Analytics and Basic Risk Assessment
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            This module will calculate real-time burn-down velocity, schedule slippage, and automated risk warning scores (&gt;10% projected overrun). It is scheduled for implementation in Phase 3 upon user approval.
          </p>
        </div>
      )}

      {/* Edit Modal with Optimistic Concurrency Control */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-2xl p-6 border border-slate-700/80 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-brand-400" />
                <span>Edit Portfolio (Version {portfolio.version})</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {conflictError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="space-y-1">
                  <div className="font-semibold">{conflictError}</div>
                  <button
                    type="button"
                    onClick={() => {
                      refetch();
                      setIsEditModalOpen(false);
                    }}
                    className="underline text-brand-300 hover:text-brand-200"
                  >
                    Click to refresh with latest server data
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onUpdateSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Portfolio Name</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full glass-input px-3 py-2 rounded-lg text-xs text-white"
                />
                {errors.name && <p className="text-rose-400 text-[11px] mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  {...register('description')}
                  className="w-full glass-input px-3 py-2 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Budget</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('targetBudget')}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs text-white font-mono"
                  />
                  {errors.targetBudget && <p className="text-rose-400 text-[11px] mt-1">{errors.targetBudget.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Currency</label>
                  <select
                    {...register('currency')}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs text-white font-mono"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs text-white font-mono"
                  />
                  {errors.endDate && <p className="text-rose-400 text-[11px] mt-1">{errors.endDate.message}</p>}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || updateMutation.isPending}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50"
                >
                  {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 border border-slate-700/80 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Archive className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Archive Portfolio</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to transition <strong className="text-white">{portfolio.name}</strong> to the <strong>Archived</strong> state?
            </p>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-brand-300">Data Integrity Notice:</strong> Archiving preserves all historical records, audit trails, and financial allocations for regulatory compliance (SRS BR-03). The portfolio remains accessible for viewing.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="px-3.5 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={archiveMutation.isPending}
                onClick={() => archiveMutation.mutate()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-md disabled:opacity-50"
              >
                {archiveMutation.isPending ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
