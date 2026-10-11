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

  const updateMutation = useMutation({
    mutationFn: (data: UpdateFormData) => {
      return apiRequest(`/portfolios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...data,
          expectedVersion: portfolio.version
        })
      });
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['portfolio', id] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
    onError: (err: any) => {
      if (err.message && (err.message.includes('409') || err.message.toLowerCase().includes('concurrency') || err.message.toLowerCase().includes('conflict'))) {
        setConflictError('Conflict: This portfolio was modified by another session. Please reload to see the latest version.');
      } else {
        setConflictError(err.message || 'Failed to update portfolio.');
      }
    }
  });

  const archiveMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/portfolios/${id}/archive`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      setIsArchiveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['portfolio', id] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
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

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-xs">Loading portfolio data...</p>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="p-10 text-center glass-card rounded-xl">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Portfolio Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The portfolio might not exist or could not be loaded.</p>
        <Link
          to="/portfolios"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portfolios</span>
        </Link>
      </div>
    );
  }

  const isUserOwnerOrAdmin = canEditPortfolio(portfolio);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/portfolios"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portfolios Directory</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="glass-card p-6 rounded-xl border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {portfolio.name}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                portfolio.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${portfolio.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                {portfolio.status}
              </span>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                v{portfolio.version} (OCC Token)
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {portfolio.description || 'No description provided.'}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-600" />
                <span className="text-slate-400 font-mono text-[11px] uppercase">Owner:</span>
                <span className="font-semibold text-slate-800">{portfolio.owner_name}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 font-mono text-[11px] uppercase">Timeline:</span>
                <span className="font-mono text-slate-700">{portfolio.start_date} → {portfolio.end_date}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-400 font-mono text-[11px] uppercase">Target Budget:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(portfolio.target_budget, portfolio.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start shrink-0">
            {isUserOwnerOrAdmin ? (
              <>
                <button
                  onClick={handleOpenEdit}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Portfolio</span>
                </button>

                {portfolio.status === 'ACTIVE' && (
                  <button
                    onClick={() => setIsArchiveModalOpen(true)}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-amber-50 text-amber-700 border border-slate-200 hover:border-amber-200 shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-500" />
                    <span>Archive</span>
                  </button>
                )}
              </>
            ) : (
              <div className="px-3.5 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Read-Only Viewer</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'text-brand-600 border-b-2 border-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Overview & Assets</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'text-brand-600 border-b-2 border-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4 text-slate-400" />
          <span>Transactions</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 text-slate-500 border border-slate-200">
            Phase 2
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'text-brand-600 border-b-2 border-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <span>Analytics & Milestones</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 text-slate-500 border border-slate-200">
            Phase 3
          </span>
        </button>
      </div>

      {/* Tab 1: Overview, Team & Assets */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Linked Software Assets */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Linked Software Engineering Assets</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  {portfolio.assets?.length || 0} Assets
                </span>
              </div>

              {portfolio.assets?.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No code repositories, Jira boards, or documents linked yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {portfolio.assets?.map((asset: any) => (
                    <div key={asset.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">{asset.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                            {asset.type}
                          </span>
                        </div>
                        {asset.external_id && (
                          <div className="text-[11px] font-mono text-slate-400">ID: {asset.external_id}</div>
                        )}
                      </div>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <span>Open Asset</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lifecycle Rules Banner */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Lifecycle Protection Rules (BR-03 & REQ-PORT-05)</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                By software engineering lab specification, hard deletion of portfolios is forbidden. Completed or discontinued initiatives are preserved via the non-destructive <span className="font-semibold text-slate-800">Archive</span> workflow to preserve audit trails, financial transactions, and milestone histories.
              </p>
            </div>
          </div>

          {/* Team Members & Stakeholders Sidebar */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Team Members</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  {portfolio.members?.length || 0} Members
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {portfolio.members?.map((member: any) => (
                  <div key={member.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 truncate">
                      <div className="font-semibold text-slate-800 truncate">{member.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{member.email}</div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 font-semibold ${
                      member.role === 'OWNER'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Placeholder for Phase 2 */}
      {activeTab === 'transactions' && (
        <div className="glass-card p-12 rounded-xl text-center space-y-3">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Financial Transactions & Cost Tracking</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Phase 2 will introduce software transaction tracking (cloud costs, vendor licenses, contractor labor) with immutable reversal logging.
          </p>
        </div>
      )}

      {/* Tab 3: Placeholder for Phase 3 */}
      {activeTab === 'analytics' && (
        <div className="glass-card p-12 rounded-xl text-center space-y-3">
          <TrendingUp className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Performance Analytics & Early Risk Detection</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Phase 3 will introduce budget burn-down tracking, delivery velocity metrics, and early risk detection warnings for budget overruns &gt;10%.
          </p>
        </div>
      )}

      {/* Edit Modal with Optimistic Concurrency Control */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Portfolio</h3>
                <p className="text-xs text-slate-500 mt-0.5">Optimistic concurrency version token: v{portfolio.version}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {conflictError && (
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <span className="font-semibold block">Concurrency Conflict (OCC)</span>
                  <span>{conflictError}</span>
                  <button
                    onClick={() => {
                      refetch();
                      setIsEditModalOpen(false);
                    }}
                    className="block mt-2 underline font-semibold text-rose-800"
                  >
                    Click to reload latest state
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Portfolio Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="glass-input w-full px-3 py-2 rounded-lg"
                />
                {errors.name && <p className="text-rose-500 text-[11px] mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  {...register('description')}
                  className="glass-input w-full px-3 py-2 rounded-lg"
                />
                {errors.description && <p className="text-rose-500 text-[11px] mt-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Budget *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('targetBudget')}
                    className="glass-input w-full px-3 py-2 rounded-lg font-mono"
                  />
                  {errors.targetBudget && <p className="text-rose-500 text-[11px] mt-1">{errors.targetBudget.message}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Currency *</label>
                  <select
                    {...register('currency')}
                    className="glass-input w-full px-3 py-2 rounded-lg bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="glass-input w-full px-3 py-2 rounded-lg font-mono"
                  />
                  {errors.startDate && <p className="text-rose-500 text-[11px] mt-1">{errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className="glass-input w-full px-3 py-2 rounded-lg font-mono"
                  />
                  {errors.endDate && <p className="text-rose-500 text-[11px] mt-1">{errors.endDate.message}</p>}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || updateMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Archive className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Archive Portfolio</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Are you sure you want to transition <span className="font-semibold text-slate-800">"{portfolio.name}"</span> to <span className="font-semibold text-amber-700">ARCHIVED</span> status?
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                The portfolio and all historical audit logs and assets will remain safely preserved in the database for compliance and reporting.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
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
