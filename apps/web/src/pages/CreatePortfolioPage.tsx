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
          assets,
          initialMembers
        })
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioStats'] });
      navigate(`/portfolios/${res.data.id}`);
    },
    onError: (err: any) => {
      setServerError(err.message || 'Failed to create portfolio.');
    }
  });

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) => 
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (!canCreatePortfolio) {
    return (
      <div className="max-w-2xl mx-auto p-8 glass-card rounded-2xl text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Under Software Engineering governance rules (BR-02), creating portfolios requires the <span className="font-semibold text-slate-700">Portfolio Manager</span> or <span className="font-semibold text-slate-700">Administrator</span> role.
        </p>
        <Link
          to="/portfolios"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Portfolios Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/portfolios"
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-brand-600" />
            <span>Create Engineering Portfolio</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register a new software initiative container with budget allocations and team members.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
        {/* Core Metadata Card */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
            1. Initiative Metadata
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Portfolio Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Core Services Cloud Migration"
                {...register('name')}
                className="glass-input w-full px-3.5 py-2.5 rounded-lg font-medium"
              />
              {errors.name && <p className="text-rose-500 text-[11px] mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Description & Business Objectives
              </label>
              <textarea
                rows={3}
                placeholder="Describe the software engineering objectives, architectural goals, and scope..."
                {...register('description')}
                className="glass-input w-full px-3.5 py-2.5 rounded-lg"
              />
              {errors.description && <p className="text-rose-500 text-[11px] mt-1">{errors.description.message}</p>}
            </div>
          </div>
        </div>

        {/* Financial & Schedule Allocation */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
            2. Budget & Timeline Constraints
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Target Budget <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="150000.00"
                  {...register('targetBudget')}
                  className="glass-input w-full pl-8 pr-3.5 py-2.5 rounded-lg font-mono font-medium"
                />
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              {errors.targetBudget && <p className="text-rose-500 text-[11px] mt-1">{errors.targetBudget.message}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Currency <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('currency')}
                className="glass-input w-full px-3.5 py-2.5 rounded-lg font-medium bg-white"
              >
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="INR">INR - Indian Rupee (₹)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="glass-input w-full px-3.5 py-2.5 rounded-lg font-mono"
              />
              {errors.startDate && <p className="text-rose-500 text-[11px] mt-1">{errors.startDate.message}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('endDate')}
                className="glass-input w-full px-3.5 py-2.5 rounded-lg font-mono"
              />
              {errors.endDate && <p className="text-rose-500 text-[11px] mt-1">{errors.endDate.message}</p>}
            </div>
          </div>
        </div>

        {/* Team Assignments */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase font-mono tracking-wider">
              3. Assign Team Contributors
            </h3>
            <span className="text-[11px] text-brand-600 font-semibold font-mono">
              {selectedMembers.length} Selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {availableUsers
              ?.filter((u) => u.id !== user?.id)
              .map((u) => {
                const isSelected = selectedMembers.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold truncate">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{u.department}</div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 ml-2" />
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Linked SE Assets */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
            4. Initial Engineering Asset (Optional)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Asset Label</label>
              <input
                type="text"
                placeholder="e.g., github.com/org/core-services"
                {...register('repoName')}
                className="glass-input w-full px-3.5 py-2.5 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Repository / Jira URL</label>
              <input
                type="url"
                placeholder="https://github.com/..."
                {...register('repoUrl')}
                className="glass-input w-full px-3.5 py-2.5 rounded-lg font-mono text-[11px]"
              />
              {errors.repoUrl && <p className="text-rose-500 text-[11px] mt-1">{errors.repoUrl.message}</p>}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/portfolios"
            className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {createMutation.isPending ? 'Creating Portfolio...' : 'Create Portfolio'}
          </button>
        </div>
      </form>
    </div>
  );
};
