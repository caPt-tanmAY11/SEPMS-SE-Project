import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  LayoutDashboard, 
  FolderKanban, 
  Receipt, 
  TrendingUp, 
  Settings, 
  LogOut, 
  User, 
  Shield, 
  ChevronDown, 
  Menu, 
  X,
  Code2,
  Lock
} from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { user, logout, switchPersona } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'PORTFOLIO_MANAGER':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'DEVELOPER':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'EXECUTIVE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'ADMIN':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/portfolios', label: 'Portfolios', icon: FolderKanban },
    { to: '/transactions', label: 'Transactions', icon: Receipt, badge: 'Phase 2', disabled: true },
    { to: '/analytics', label: 'Analytics & Risks', icon: TrendingUp, badge: 'Phase 3', disabled: true },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-base">SEPMS</span>
            <span className="block text-[10px] text-slate-400 font-mono tracking-wider uppercase">SE Portfolio Mgmt</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <div
                  key={item.to}
                  title="Coming in future approved phase"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-500 cursor-not-allowed opacity-75 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-600/15 text-brand-300 border border-brand-500/30 shadow-sm shadow-brand-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Demo Persona Switcher */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="relative">
            <button
              onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Shield className="w-4 h-4 text-brand-400 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Switch Persona</div>
                  <div className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || 'Select User'}</div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {personaMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl p-1 z-50 text-xs">
                <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Select Lab Persona:
                </div>
                {(['PORTFOLIO_MANAGER', 'DEVELOPER', 'EXECUTIVE', 'ADMIN'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      switchPersona(role);
                      setPersonaMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors ${
                      user?.role === role ? 'bg-brand-600/20 text-brand-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{role.replace('_', ' ')}</span>
                    {user?.role === role && <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-medium text-slate-200">
                Software Engineering Portfolio Management System
              </h1>
            </div>
          </div>

          {/* User Status and Logout */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200">{user.fullName}</span>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{user.department}</span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300 font-bold text-xs">
                  {user.fullName.charAt(0)}
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out of SEPMS"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-xs font-medium rounded-lg text-white transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-900 p-4 space-y-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && <span className="ml-auto text-[10px] text-slate-500">{item.badge}</span>}
                </NavLink>
              );
            })}
          </div>
        )}

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
