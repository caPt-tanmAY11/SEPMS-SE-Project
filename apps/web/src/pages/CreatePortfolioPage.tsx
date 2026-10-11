import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FolderPlus, 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Users, 
  GitBranch, 
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const portfolioFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  description: z.string().max(1000).default(''),
  targetBudget: z.coerce.number().positive('Budget must be greater than 0'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid start date'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid end date'),
  repoUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  repoName: z.string().optional()
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate']
});

type PortfolioFormData = z.infer<typeof portfolioFormSchema>;

export const CreatePortfolioPage: React.FC = () => {
  const { user, canCreatePortfolio } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  // Fetch available users for team assignment
  const { data: availableUsers } = useQuery<any[]>({
    queryKey: ['usersList'],
    queryFn: () => apiRequest<any[]>('/users')
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues: {
      currency: 'USD',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: PortfolioFormData) => {
      const assets = data.repoUrl ? [{
        name: data.repoName || 'Main Repository',
        type: 'REPOSITORY' as const,
        url: data.repoUrl
      }] : [];

      const initialMembers = selectedMembers.map((userId) => ({
        userId,
        role: 'CONTRIBUTOR' as const
      }));

      return apiRequest('/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          targetBudget: data.targetBudget,
          currency: data.currency,
          startDate: data.startDate,
          endDate: data.endDate,
          initialMembers,
          assets
        })
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioStats'] });
      navigate(`/portfolios/${created.id}`);
    },
    onError: (err: any) => {
      setServerError(err.message || 'Failed to create portfolio.');
    }
  });

  const onSubmit = (data: PortfolioFormData) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  if (!canCreatePortfolio) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center max-w-lg mx-auto mt-12 border border-slate-800">
        <Lock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Access Restricted</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Your current persona ({user?.role}) does not have permission to create software portfolios. Only Portfolio Managers and System Administrators may create portfolios.
        </p>
        <div className="mt-6">
          <Link
            to="/portfolios"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Return to Portfolios Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
        <Link
          to="/portfolios"
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700/60"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-brand-400" />
            <span>Create New Software Portfolio</span>
          </h2>
          <p className="text-xs text-slate-400">
            Define software engineering project scope, budget allocation, schedule, and team contributors.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Creation Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800/60 pb-2">
            1. Basic Metadata
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Portfolio Name *
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g., Enterprise Payment Gateway Modernization"
              className="w-full glass-input px-3.5 py-2.5 rounded-lg text-xs text-white placeholder-slate-500"
            />
            {errors.name && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description & Objectives
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Summarize engineering goals, architectural scope, and deliverables..."
              className="w-full glass-input px-3.5 py-2.5 rounded-lg text-xs text-white placeholder-slate-500"
            />
            {errors.description && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Budget *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  {...register('targetBudget')}
                  placeholder="500000"
                  className="w-full glass-input pl-3.5 pr-16 py-2.5 rounded-lg text-xs font-mono text-white placeholder-slate-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <select
                    {...register('currency')}
                    className="bg-slate-800 text-slate-200 text-xs font-mono rounded px-2 py-1 border border-slate-700 focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>
              {errors.targetBudget && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.targetBudget.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full glass-input px-3 py-2.5 rounded-lg text-xs text-white font-mono"
                />
                {errors.startDate && (
                  <p className="text-rose-400 text-[11px] mt-1">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  End Date *
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="w-full glass-input px-3 py-2.5 rounded-lg text-xs text-white font-mono"
                />
                {errors.endDate && (
                  <p className="text-rose-400 text-[11px] mt-1">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Assignment */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>2. Team Contributors (Optional)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Creator will automatically become Portfolio Owner
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Select development team members to assign as contributors to this portfolio:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {availableUsers
              ?.filter((u) => u.id !== user?.id)
              .map((u) => {
                const isSelected = selectedMembers.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedMembers(selectedMembers.filter((id) => id !== u.id));
                      } else {
                        setSelectedMembers([...selectedMembers, u.id]);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors text-xs ${
                      isSelected
                        ? 'bg-brand-600/15 border-brand-500/40 text-brand-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-200">{u.full_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{u.role} • {u.department}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Linked SE Asset */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800/60 pb-2">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            <span>3. Linked Engineering Asset (Optional)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Asset Name
              </label>
              <input
                type="text"
                {...register('repoName')}
                placeholder="e.g., github.com/company/core-api"
                className="w-full glass-input px-3.5 py-2.5 rounded-lg text-xs text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Repository / Asset URL
              </label>
              <input
                type="url"
                {...register('repoUrl')}
                placeholder="https://github.com/company/core-api"
                className="w-full glass-input px-3.5 py-2.5 rounded-lg text-xs text-white placeholder-slate-500"
              />
              {errors.repoUrl && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.repoUrl.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submission Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/portfolios"
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{isSubmitting || createMutation.isPending ? 'Persisting Portfolio...' : 'Create Portfolio'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
