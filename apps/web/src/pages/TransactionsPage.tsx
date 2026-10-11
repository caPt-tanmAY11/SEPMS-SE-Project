import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Receipt, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowUpRight, 
  RotateCcw, 
  Calendar, 
  Briefcase, 
  AlertCircle,
  Tag,
  DollarSign
} from 'lucide-react';
import { apiRequest } from '../lib/api';

interface FinancialTransaction {
  id: string;
  portfolio_id: string;
  amount: string;
  currency: string;
  category: string;
  transaction_date: string;
  description: string;
  justification: string | null;
  transaction_type: 'EXPENSE' | 'REVERSAL';
  reversed_transaction_id: string | null;
  is_reversed: boolean;
  actor_id: string;
  actor_name: string;
  portfolio_name: string;
  created_at: string;
}

export const TransactionsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const { data: transactions, isLoading, error, refetch, isFetching } = useQuery<FinancialTransaction[]>({
    queryKey: ['global-transactions'],
    queryFn: () => apiRequest<FinancialTransaction[]>('/transactions')
  });

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

  const filteredTransactions = (transactions || []).filter((tx: FinancialTransaction) => {
    if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) return false;
    if (selectedCurrency !== 'ALL' && tx.currency !== selectedCurrency) return false;
    if (selectedType !== 'ALL' && tx.transaction_type !== selectedType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchPort = tx.portfolio_name.toLowerCase().includes(q);
      const matchJust = tx.justification ? tx.justification.toLowerCase().includes(q) : false;
      const matchActor = tx.actor_name.toLowerCase().includes(q);
      if (!matchDesc && !matchPort && !matchJust && !matchActor) return false;
    }
    return true;
  });

  // Calculate high-level metrics
  const totalCount = transactions?.length || 0;
  const expenseCount = transactions?.filter((t: FinancialTransaction) => t.transaction_type === 'EXPENSE').length || 0;
  const reversalCount = transactions?.filter((t: FinancialTransaction) => t.transaction_type === 'REVERSAL').length || 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Financial Transactions Ledger
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-brand-50 text-brand-700 border border-brand-200">
              Phase 2 Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Immutable organizational transaction history, project expenditures, and linked reversal offsets.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-brand-600' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Metrics Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Entries</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Audited immutable records</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Recorded Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{expenseCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Project resource expenditures</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Offsetting Reversals</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{reversalCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Audited accounting adjustments</p>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, portfolio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Category */}
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Categories</option>
              <option value="INFRASTRUCTURE">Infrastructure</option>
              <option value="VENDOR">Vendor</option>
              <option value="LABOR">Labor</option>
              <option value="SOFTWARE_LICENSING">Software Licensing</option>
              <option value="OTHER_PROJECT_EXPENSE">Other Expense</option>
            </select>
          </div>

          {/* Currency */}
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Currencies</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>

          {/* Type */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Types</option>
              <option value="EXPENSE">Expense Only</option>
              <option value="REVERSAL">Reversal Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600" />
            <p className="text-sm">Loading financial transactions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">Failed to load transactions ledger.</p>
            <button
              onClick={() => refetch()}
              className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-base font-semibold text-slate-700">No transactions found</p>
            <p className="text-xs text-slate-400">
              {transactions?.length === 0
                ? 'No transactions have been recorded yet.'
                : 'Try adjusting your search criteria or category filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Portfolio</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type & Status</th>
                  <th className="py-3 px-4">Description & Justification</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx: FinancialTransaction) => {
                  const isExpense = tx.transaction_type === 'EXPENSE';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tx.transaction_date}</span>
                        </div>
                      </td>

                      {/* Portfolio */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          to={`/portfolios/${tx.portfolio_id}`}
                          className="font-medium text-slate-900 hover:text-brand-600 transition-colors flex items-center gap-1.5"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[180px]">{tx.portfolio_name}</span>
                        </Link>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${getCategoryBadge(tx.category)}`}>
                          {tx.category.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Type & Status */}
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
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 font-semibold" title="This expense was offset by a reversal">
                              Reversed
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Description & Justification */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 truncate" title={tx.description}>
                          {tx.description}
                        </div>
                        {tx.justification && (
                          <div className="text-[11px] text-slate-400 truncate italic mt-0.5" title={`Justification: ${tx.justification}`}>
                            ↳ Justification: {tx.justification}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isExpense ? (tx.is_reversed ? 'text-slate-400 line-through' : 'text-slate-900') : 'text-amber-700'}>
                          {isExpense ? '' : '- '}
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: tx.currency
                          }).format(Number(tx.amount))}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        {tx.actor_name || 'System User'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
