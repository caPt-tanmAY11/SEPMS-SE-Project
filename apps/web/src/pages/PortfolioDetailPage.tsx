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
  CheckCircle2,
  Plus,
  RotateCcw,
  ArrowUpRight,
  Flag,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ------------------------------------------------------------------------------
// Validation Schemas
// ------------------------------------------------------------------------------
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

const createExpenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  category: z.enum(['INFRASTRUCTURE', 'VENDOR', 'LABOR', 'SOFTWARE_LICENSING', 'OTHER_PROJECT_EXPENSE']),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select valid date'),
  description: z.string().min(3, 'Description must be at least 3 characters').max(500),
  justification: z.string().max(1000).optional()
});

type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;

const reverseSchema = z.object({
  justification: z.string().min(5, 'Justification must be at least 5 characters').max(1000)
});

type ReverseFormData = z.infer<typeof reverseSchema>;

const createMilestoneSchema = z.object({
  name: z.string().min(3, 'Milestone name must be at least 3 characters').max(200),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select valid date'),
  status: z.enum(['PENDING', 'COMPLETED', 'MISSED']).default('PENDING'),
  notes: z.string().max(1000).optional().default('')
});

type CreateMilestoneFormData = z.infer<typeof createMilestoneSchema>;

// ------------------------------------------------------------------------------
// Component
// ------------------------------------------------------------------------------
export const PortfolioDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, canEditPortfolio } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'milestones'>('overview');
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [selectedTxForReversal, setSelectedTxForReversal] = useState<any>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries
  const { data: portfolio, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['portfolio', id],
    queryFn: () => apiRequest(`/portfolios/${id}`),
    enabled: !!id
  });

  const { data: summary, refetch: refetchSummary } = useQuery<any>({
    queryKey: ['portfolio-summary', id],
    queryFn: () => apiRequest(`/portfolios/${id}/summary`),
    enabled: !!id
  });

  const { data: transactions, isLoading: isTxLoading, refetch: refetchTx } = useQuery<any>({
    queryKey: ['portfolio-transactions', id],
    queryFn: () => apiRequest(`/portfolios/${id}/transactions`),
    enabled: !!id
  });

  const { data: milestones, isLoading: isMsLoading, refetch: refetchMs } = useQuery<any>({
    queryKey: ['portfolio-milestones', id],
    queryFn: () => apiRequest(`/portfolios/${id}/milestones`),
    enabled: !!id
  });

  // Forms
  const editForm = useForm<UpdateFormData>({ resolver: zodResolver(updateSchema) });
  const expenseForm = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      category: 'INFRASTRUCTURE',
      transactionDate: new Date().toISOString().split('T')[0]
    }
  });
  const reverseForm = useForm<ReverseFormData>({ resolver: zodResolver(reverseSchema) });
  const milestoneForm = useForm<CreateMilestoneFormData>({
    resolver: zodResolver(createMilestoneSchema),
    defaultValues: {
      status: 'PENDING',
      targetDate: new Date().toISOString().split('T')[0]
    }
  });

  const isUserOwnerOrAdmin = portfolio ? canEditPortfolio(portfolio) : false;

  // Open edit modal
  const handleOpenEdit = () => {
    if (!portfolio) return;
    setConflictError(null);
    editForm.reset({
      name: portfolio.name,
      description: portfolio.description,
      targetBudget: Number(portfolio.target_budget),
      currency: portfolio.currency,
      startDate: portfolio.start_date,
      endDate: portfolio.end_date
    });
    setIsEditModalOpen(true);
  };

  // Edit mutation
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
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary', id] });
    },
    onError: (err: any) => {
      if (err.message && (err.message.includes('409') || err.message.toLowerCase().includes('conflict'))) {
        setConflictError('Conflict: This portfolio was modified by another session. Please reload to review changes.');
      } else {
        setConflictError(err.message || 'Failed to update portfolio.');
      }
    }
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: () => apiRequest(`/portfolios/${id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      setIsArchiveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['portfolio', id] });
    }
  });

  // Create Expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: (data: CreateExpenseFormData) => {
      return apiRequest(`/portfolios/${id}/transactions`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          currency: portfolio.currency
        })
      });
    },
    onSuccess: () => {
      setIsExpenseModalOpen(false);
      expenseForm.reset();
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['portfolio-transactions', id] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary', id] });
      queryClient.invalidateQueries({ queryKey: ['global-transactions'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to record expense.');
    }
  });

  // Reverse Expense mutation
  const reverseMutation = useMutation({
    mutationFn: (data: ReverseFormData) => {
      return apiRequest(`/portfolios/${id}/transactions/${selectedTxForReversal.id}/reverse`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      setIsReverseModalOpen(false);
      setSelectedTxForReversal(null);
      reverseForm.reset();
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['portfolio-transactions', id] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary', id] });
      queryClient.invalidateQueries({ queryKey: ['global-transactions'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to reverse transaction.');
    }
  });

  // Create Milestone mutation
  const createMilestoneMutation = useMutation({
    mutationFn: (data: CreateMilestoneFormData) => {
      return apiRequest(`/portfolios/${id}/milestones`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      setIsMilestoneModalOpen(false);
      milestoneForm.reset();
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['portfolio-milestones', id] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary', id] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to add milestone.');
    }
  });

  // Update Milestone Status mutation
  const updateMilestoneMutation = useMutation({
    mutationFn: ({ milestoneId, status }: { milestoneId: string; status: 'PENDING' | 'COMPLETED' | 'MISSED' }) => {
      return apiRequest(`/portfolios/${id}/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-milestones', id] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary', id] });
    }
  });

  const formatCurrency = (amount: string | number, currency: string) => {
    const num = Number(amount || 0);
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

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'INFRASTRUCTURE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'VENDOR':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'LABOR':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SOFTWARE_LICENSING':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const utilization = summary?.utilizationPercentage || 0;
  const utilizationColor =
    utilization > 100 ? 'bg-rose-500' : utilization > 80 ? 'bg-amber-500' : 'bg-emerald-500';

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

      {/* Dynamic Financial & Milestone Summary Gauge */}
      {summary && (
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                Financial Health & Budget Utilization
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Utilization:</span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                utilization > 100 ? 'bg-rose-50 text-rose-700' : utilization > 80 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {utilization}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Target Budget</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {formatCurrency(summary.targetBudget, summary.currency)}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Net Recorded Spend</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {formatCurrency(summary.netSpending, summary.currency)}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Remaining Balance</span>
              <div className={`text-base font-bold font-mono mt-0.5 ${summary.remainingBudget < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatCurrency(summary.remainingBudget, summary.currency)}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Milestones Progress</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {summary.milestoneStats.completed} / {summary.milestoneStats.total}{' '}
                <span className="text-xs font-normal text-slate-400">({summary.milestoneStats.completionRate}%)</span>
              </div>
            </div>
          </div>

          {/* Utilization Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full ${utilizationColor} transition-all duration-500`}
                style={{ width: `${Math.min(100, utilization)}%` }}
              ></div>
            </div>
            {summary.milestoneStats.overdue > 0 && (
              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Notice: {summary.milestoneStats.overdue} milestone(s) are overdue past their target date.</span>
              </p>
            )}
          </div>
        </div>
      )}

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
          <span>Overview & Team</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'text-brand-600 border-b-2 border-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Transactions Ledger</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-brand-50 text-brand-700 border border-brand-200">
            {transactions?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'milestones'
              ? 'text-brand-600 border-b-2 border-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Milestones & Timeline</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-brand-50 text-brand-700 border border-brand-200">
            {milestones?.length || 0}
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

      {/* Tab 2: Financial Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Portfolio Financial Ledger</h3>
              <p className="text-xs text-slate-500">Immutable ledger of expenditures and linked offset corrections.</p>
            </div>

            {isUserOwnerOrAdmin && portfolio.status === 'ACTIVE' && (
              <button
                onClick={() => {
                  setActionError(null);
                  expenseForm.reset({
                    category: 'INFRASTRUCTURE',
                    transactionDate: new Date().toISOString().split('T')[0]
                  });
                  setIsExpenseModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Expense</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
            {isTxLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading transactions...</div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No transactions recorded yet</p>
                <p className="text-xs text-slate-400">
                  {isUserOwnerOrAdmin ? 'Click "Record Expense" above to record the first project expenditure.' : 'No transactions have been submitted by the portfolio owner.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Description & Justification</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Recorded By</th>
                      {isUserOwnerOrAdmin && <th className="py-3 px-4 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx: any) => {
                      const isExpense = tx.transaction_type === 'EXPENSE';
                      const canBeReversed = isUserOwnerOrAdmin && isExpense && !tx.is_reversed && portfolio.status === 'ACTIVE';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                            {tx.transaction_date}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${getCategoryBadge(tx.category)}`}>
                              {tx.category.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {isExpense ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <ArrowUpRight className="w-3 h-3" />
                                  Expense
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  <RotateCcw className="w-3 h-3" />
                                  Reversal
                                </span>
                              )}
                              {tx.is_reversed && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 font-semibold">
                                  Reversed
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-medium text-slate-800">{tx.description}</div>
                            {tx.justification && (
                              <div className="text-[11px] text-slate-400 italic mt-0.5">
                                ↳ Justification: {tx.justification}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                            <span className={isExpense ? (tx.is_reversed ? 'text-slate-400 line-through' : 'text-slate-900') : 'text-amber-700'}>
                              {isExpense ? '' : '- '}
                              {formatCurrency(tx.amount, tx.currency)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                            {tx.actor_name || 'System User'}
                          </td>
                          {isUserOwnerOrAdmin && (
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {canBeReversed ? (
                                <button
                                  onClick={() => {
                                    setActionError(null);
                                    setSelectedTxForReversal(tx);
                                    reverseForm.reset();
                                    setIsReverseModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] font-medium transition-colors"
                                  title="Create a linked reversal transaction"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reverse</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Milestones */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Milestones & Delivery Schedule</h3>
              <p className="text-xs text-slate-500">Target milestones, actual completion verification, and overdue flags.</p>
            </div>

            {isUserOwnerOrAdmin && portfolio.status === 'ACTIVE' && (
              <button
                onClick={() => {
                  setActionError(null);
                  milestoneForm.reset({
                    status: 'PENDING',
                    targetDate: new Date().toISOString().split('T')[0]
                  });
                  setIsMilestoneModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {isMsLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading milestones...</div>
            ) : !milestones || milestones.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                <Flag className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No milestones defined yet</p>
                <p className="text-xs text-slate-400">
                  {isUserOwnerOrAdmin ? 'Click "Add Milestone" above to establish initial project delivery checkpoints.' : 'No milestones have been added by the portfolio owner.'}
                </p>
              </div>
            ) : (
              milestones.map((ms: any) => {
                const isCompleted = ms.status === 'COMPLETED';
                const isMissed = ms.status === 'MISSED';
                const isPending = ms.status === 'PENDING';
                const isOverdue = ms.is_overdue;

                return (
                  <div
                    key={ms.id}
                    className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{ms.name}</h4>
                        
                        {/* Status Pills */}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Completed
                          </span>
                        )}
                        {isMissed && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            <X className="w-3 h-3 text-rose-600" />
                            Missed
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" />
                            Pending
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            OVERDUE
                          </span>
                        )}
                      </div>

                      {ms.notes && (
                        <p className="text-xs text-slate-500 leading-relaxed">{ms.notes}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                        <div>Target: <span className="text-slate-700 font-semibold">{ms.target_date}</span></div>
                        {ms.actual_date && (
                          <div>Completed: <span className="text-emerald-700 font-semibold">{ms.actual_date}</span></div>
                        )}
                        <div>Created by: <span className="text-slate-700">{ms.creator_name || 'Owner'}</span></div>
                      </div>
                    </div>

                    {/* Milestone State Actions */}
                    {isUserOwnerOrAdmin && portfolio.status === 'ACTIVE' && (
                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        {ms.status !== 'COMPLETED' && (
                          <button
                            onClick={() => updateMilestoneMutation.mutate({ milestoneId: ms.id, status: 'COMPLETED' })}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Mark Completed</span>
                          </button>
                        )}

                        {ms.status !== 'MISSED' && (
                          <button
                            onClick={() => updateMilestoneMutation.mutate({ milestoneId: ms.id, status: 'MISSED' })}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Mark Missed</span>
                          </button>
                        )}

                        {ms.status !== 'PENDING' && (
                          <button
                            onClick={() => updateMilestoneMutation.mutate({ milestoneId: ms.id, status: 'PENDING' })}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium transition-colors"
                          >
                            <span>Set Pending</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Financial Expense</h3>
                <p className="text-xs text-slate-500 mt-0.5">Denominated in portfolio currency ({portfolio.currency})</p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {actionError}
              </div>
            )}

            <form onSubmit={expenseForm.handleSubmit((d) => createExpenseMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ({portfolio.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...expenseForm.register('amount')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                  {expenseForm.formState.errors.amount && (
                    <p className="text-[11px] text-rose-600 mt-1">{expenseForm.formState.errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    {...expenseForm.register('category')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="LABOR">Labor</option>
                    <option value="SOFTWARE_LICENSING">Software Licensing</option>
                    <option value="OTHER_PROJECT_EXPENSE">Other Project Expense</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Date</label>
                <input
                  type="date"
                  {...expenseForm.register('transactionDate')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
                {expenseForm.formState.errors.transactionDate && (
                  <p className="text-[11px] text-rose-600 mt-1">{expenseForm.formState.errors.transactionDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Production compute reservation"
                  {...expenseForm.register('description')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {expenseForm.formState.errors.description && (
                  <p className="text-[11px] text-rose-600 mt-1">{expenseForm.formState.errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Justification (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Required for high-availability multi-region compliance"
                  {...expenseForm.register('justification')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
                >
                  {createExpenseMutation.isPending ? 'Recording...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reverse Expense Modal */}
      {isReverseModalOpen && selectedTxForReversal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reverse Financial Transaction</h3>
                <p className="text-xs text-slate-500 mt-0.5">Creates a linked offset entry in the audit ledger</p>
              </div>
              <button
                onClick={() => setIsReverseModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="font-semibold">Reversing Transaction:</div>
              <div>• Description: {selectedTxForReversal.description}</div>
              <div>• Amount: {formatCurrency(selectedTxForReversal.amount, selectedTxForReversal.currency)}</div>
              <div>• Category: {selectedTxForReversal.category}</div>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {actionError}
              </div>
            )}

            <form onSubmit={reverseForm.handleSubmit((d) => reverseMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Reversal Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this transaction is being reversed (e.g. duplicate invoice cancelled by vendor)"
                  {...reverseForm.register('justification')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                ></textarea>
                {reverseForm.formState.errors.justification && (
                  <p className="text-[11px] text-rose-600 mt-1">{reverseForm.formState.errors.justification.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReverseModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reverseMutation.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
                >
                  {reverseMutation.isPending ? 'Reversing...' : 'Execute Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Milestone</h3>
                <p className="text-xs text-slate-500 mt-0.5">Establish delivery checkpoints and schedule targets</p>
              </div>
              <button
                onClick={() => setIsMilestoneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {actionError}
              </div>
            )}

            <form onSubmit={milestoneForm.handleSubmit((d) => createMilestoneMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Milestone Name</label>
                <input
                  type="text"
                  placeholder="e.g. Staging Cluster Provisioned"
                  {...milestoneForm.register('name')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {milestoneForm.formState.errors.name && (
                  <p className="text-[11px] text-rose-600 mt-1">{milestoneForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    {...milestoneForm.register('targetDate')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                  {milestoneForm.formState.errors.targetDate && (
                    <p className="text-[11px] text-rose-600 mt-1">{milestoneForm.formState.errors.targetDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                  <select
                    {...milestoneForm.register('status')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="MISSED">Missed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Scope (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Infrastructure drift verification and sign-off"
                  {...milestoneForm.register('notes')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMilestoneMutation.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
                >
                  {createMilestoneMutation.isPending ? 'Adding...' : 'Add Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Portfolio Modal */}
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

            <form onSubmit={editForm.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Portfolio Name</label>
                <input
                  type="text"
                  {...editForm.register('name')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {editForm.formState.errors.name && (
                  <p className="text-[11px] text-rose-600 mt-1">{editForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  {...editForm.register('description')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Budget</label>
                  <input
                    type="number"
                    step="0.01"
                    {...editForm.register('targetBudget')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                  {editForm.formState.errors.targetBudget && (
                    <p className="text-[11px] text-rose-600 mt-1">{editForm.formState.errors.targetBudget.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                  <select
                    {...editForm.register('currency')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    {...editForm.register('startDate')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    {...editForm.register('endDate')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Archive Portfolio?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Non-destructive status transition</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Archiving switches this portfolio to read-only status. Historical records, audit trails, and financial transactions are strictly preserved.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
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
