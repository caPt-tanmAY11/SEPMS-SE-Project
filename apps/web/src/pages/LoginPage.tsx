import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Shield, KeyRound, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, switchPersona } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await switchPersona(role);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate demo persona.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const personas = [
    {
      role: 'PORTFOLIO_MANAGER' as UserRole,
      title: 'Portfolio Manager',
      email: 'pm@sepms.local',
      desc: 'Can create, edit, archive owned portfolios & assign members',
      border: 'hover:border-indigo-300 hover:bg-indigo-50/50'
    },
    {
      role: 'DEVELOPER' as UserRole,
      title: 'Software Developer',
      email: 'dev@sepms.local',
      desc: 'Universal read access to all portfolios and engineering assets',
      border: 'hover:border-emerald-300 hover:bg-emerald-50/50'
    },
    {
      role: 'EXECUTIVE' as UserRole,
      title: 'Executive Leadership',
      email: 'exec@sepms.local',
      desc: 'Read-only visibility for organizational budget and risk monitoring',
      border: 'hover:border-amber-300 hover:bg-amber-50/50'
    },
    {
      role: 'ADMIN' as UserRole,
      title: 'System Administrator',
      email: 'admin@sepms.local',
      desc: 'Full operational administration and security governance access',
      border: 'hover:border-rose-300 hover:bg-rose-50/50'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8 my-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md shadow-brand-500/20 text-white mb-1">
            <Briefcase className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Software Engineering Portfolio Management System
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Enterprise portfolio tracking, project health metrics, and software governance.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-3 max-w-md mx-auto shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Lab Persona Quick Sign-In */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-brand-600" />
              <span>Select Lab Demo Persona</span>
            </h2>
            <p className="text-xs text-slate-500">
              One-click authentication as any of the four Software Engineering project roles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {personas.map((p) => (
              <div
                key={p.role}
                onClick={() => handleQuickLogin(p.role)}
                className={`p-4 rounded-xl border border-slate-200 bg-white cursor-pointer transition-all flex flex-col justify-between ${p.border} shadow-sm group hover:shadow-md`}
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                    {p.role.replace('_', ' ')}
                  </span>
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-brand-600 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{p.email}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-[11px] text-slate-400 font-mono">
            Password for all demo accounts: <span className="font-bold text-slate-700">Password123!</span>
          </div>
        </div>

        {/* Standard Email/Password Form */}
        <div className="max-w-md mx-auto glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono text-center">
            Or Sign In With Email
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Email</label>
              <input
                type="email"
                required
                placeholder="pm@sepms.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
