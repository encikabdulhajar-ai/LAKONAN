import React, { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  History,
  UsersRound,
  UserCheck,
  ShieldAlert,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Logo } from './Logo.tsx';
import { LogoKepri } from './LogoKepri.tsx';

export type PageId =
  | 'dashboard'
  | 'lakonan-ai'
  | 'riwayat'
  | 'konsultasi'
  | 'profil'
  | 'progress-layanan'
  | 'permintaan-konsultasi'
  | 'admin';

interface NavigationProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const { userProfile, signOut, isAdmin, isConsultant } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lakonan-ai' as PageId, label: 'LAKONAN AI', icon: Sparkles, highlight: true },
    { id: 'riwayat' as PageId, label: 'Riwayat', icon: History },
    { id: 'konsultasi' as PageId, label: 'Konsultasi', icon: UsersRound },
    { id: 'profil' as PageId, label: 'Profil', icon: User },
  ];

  if (isConsultant) {
    navItems.push({
      id: 'progress-layanan' as PageId,
      label: 'Progress Layanan',
      icon: TrendingUp,
    });
    navItems.push({
      id: 'permintaan-konsultasi' as PageId,
      label: 'Permintaan Konsultasi',
      icon: UserCheck,
    });
  }

  if (isAdmin) {
    navItems.push({
      id: 'admin' as PageId,
      label: 'Admin',
      icon: ShieldAlert,
    });
  }

  const handleItemClick = (id: PageId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const getRoleBadge = (role?: string) => {
    if (role === 'super_admin') {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">SUPER ADMIN</span>;
    }
    if (role === 'admin') {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">ADMIN</span>;
    }
    if (role === 'consultant') {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">KONSULTAN</span>;
    }
    return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">PENELITI</span>;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 select-none text-slate-300">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <LogoKepri size="sm" />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">LAKONAN</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-400/30">AI</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                Dispusip Provinsi Kepri
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-1">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left group ${
                  isActive
                    ? 'bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/30'
                    : item.highlight
                    ? 'text-sky-300 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-white' : item.highlight ? 'text-sky-400' : 'text-slate-400'
                  }`}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* User Profile Mini Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.name}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-sky-800 text-sky-200 font-bold flex items-center justify-center text-sm shrink-0">
                {userProfile?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 justify-between">
                <p className="text-xs font-semibold text-slate-200 truncate">{userProfile?.name}</p>
                {getRoleBadge(userProfile?.role)}
              </div>
              <p className="text-[11px] text-slate-400 truncate">{userProfile?.educationLevel || 'Peneliti'}</p>
            </div>
            <button
              onClick={() => signOut()}
              title="Keluar"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <LogoKepri size="xs" />
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-white">LAKONAN</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-400/30">AI</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getRoleBadge(userProfile?.role)}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-down Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-500/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sky-800 text-sky-100 font-bold flex items-center justify-center">
                    {userProfile?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold text-white">{userProfile?.name}</h4>
                  <p className="text-xs text-slate-400">{userProfile?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                Keluar dari Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium rounded-lg transition-colors ${
            currentPage === 'dashboard' ? 'text-sky-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Beranda</span>
        </button>

        <button
          onClick={() => onNavigate('lakonan-ai')}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-bold rounded-lg transition-colors ${
            currentPage === 'lakonan-ai'
              ? 'text-white bg-sky-600 shadow-md shadow-sky-600/30'
              : 'text-sky-300'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>LAKONAN</span>
        </button>

        <button
          onClick={() => onNavigate('riwayat')}
          className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium rounded-lg transition-colors ${
            currentPage === 'riwayat' ? 'text-sky-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <History className="w-5 h-5" />
          <span>Riwayat</span>
        </button>

        <button
          onClick={() => onNavigate('konsultasi')}
          className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium rounded-lg transition-colors ${
            currentPage === 'konsultasi' ? 'text-sky-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <UsersRound className="w-5 h-5" />
          <span>Konsultan</span>
        </button>

        <button
          onClick={() => onNavigate('profil')}
          className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium rounded-lg transition-colors ${
            currentPage === 'profil' ? 'text-sky-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profil</span>
        </button>
      </nav>
    </>
  );
};
