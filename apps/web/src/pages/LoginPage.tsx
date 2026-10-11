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
      border: 'hover:border-indigo-500/50 hover:bg-indigo-950/20'
    },
    {
      role: 'DEVELOPER' as UserRole,
      title: 'Software Developer',
      email: 'dev@sepms.local',
      desc: 'Universal read access to all portfolios and engineering assets',
      border: 'hover:border-emerald-500/50 hover:bg-emerald-950/20'
    },
    {
      role: 'EXECUTIVE' as UserRole,
      title: 'Executive Leadership',
      email: 'exec@sepms.local',
      desc: 'High-level dashboard review and portfolio governance',
      border: 'hover:border-amber-500/50 hover:bg-amber-950/20'
    },
    {
      role: 'ADMIN' as UserRole,
      title: 'System Administrator',
      email: 'admin@sepms.local',
      desc: 'Full administrative oversight and management permissions',
      border: 'hover:border-rose-500/50 hover:bg-rose-950/20'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center mx-auto shadow-xl shadow-brand-500/20">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Sign In to SEPMS
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Software Engineering Portfolio Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Corporate Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@sepms.local"
                className="w-full glass-input px-3.5 py-2.5 rounded-lg text-sm text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full glass-input px-3.5 py-2.5 rounded-lg text-sm text-white placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In with Supabase'}</span>
            </button>
          </form>

          {/* Quick Demo Personas Section */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                One-Click Demo Personas
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Select a predefined lab persona to test Universal Read Access and RBAC permissions instantly:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {personas.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleQuickLogin(p.role)}
                  className={`w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/60 transition-all group flex items-center justify-between ${p.border}`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        {p.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{p.email}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">{p.desc}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 font-mono">
          SE College Lab — Sardar Patel Institute Of Technology
        </div>
      </div>
    </div>
  );
};
