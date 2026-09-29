import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Volume2,
  VolumeX,
  RefreshCw,
  Clock,
  Sparkles,
  Download,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logout } from '../services/firebaseAuth';
import { DEFAULT_SHEET_URL } from '../services/sheetsService';

interface HeaderProps {
  user: User | null;
  setUser: (user: User | null) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  isAutoEnabled: boolean;
  setIsAutoEnabled: (val: boolean) => void;
  nextRunSeconds: number;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onRefreshSheet: () => void;
  isRefreshing: boolean;
  sheetSource: string;
  onOpenHelpModal?: () => void;
  lastSyncedTime?: string;
  periodicSyncMinutes?: number;
  nextSyncSeconds?: number;
  autoSyncDataEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  setUser,
  token,
  setToken,
  isAutoEnabled,
  setIsAutoEnabled,
  nextRunSeconds,
  soundEnabled,
  setSoundEnabled,
  onRefreshSheet,
  isRefreshing,
  sheetSource,
  onOpenHelpModal,
  lastSyncedTime,
  periodicSyncMinutes = 15,
  nextSyncSeconds,
  autoSyncDataEnabled = true,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleLogin = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        onRefreshSheet();
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand & System Icon */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                  {/* Custom System SVG Icon */}
                  <svg className="w-7 h-7 text-blue-400 group-hover:text-blue-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                    <path d="M8 14h.01"></path>
                    <path d="M12 14h.01"></path>
                    <path d="M16 14h.01"></path>
                    <path d="M8 18h.01"></path>
                    <path d="M12 18h.01"></path>
                  </svg>
                  <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 animate-pulse"></span>
                </div>
              </div>
              <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
                SMS
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                  ShiftSMS
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  تلقائي
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                نظام التذكير الذكي للموظفين غير الحاجزين للشيفتات
              </p>
            </div>
          </div>

          {/* Quick status & Actions */}
          <div className="flex items-center gap-3">
            
            {/* Auto Schedule Status Badge */}
            <div
              onClick={() => setIsAutoEnabled(!isAutoEnabled)}
              role="button"
              tabIndex={0}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                isAutoEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAutoEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span>
                {isAutoEnabled ? (
                  <span className="flex items-center gap-1.5">
                    الإرسال التلقائي: نشط
                    <span className="text-emerald-300/80 font-mono">({formatCountdown(nextRunSeconds)})</span>
                  </span>
                ) : (
                  'الإرسال التلقائي: متوقف'
                )}
              </span>
            </div>

            {/* Periodic Sheet Sync Badge */}
            {autoSyncDataEnabled && nextSyncSeconds !== undefined && (
              <div
                title={`التحديث الدوري التلقائي للشيت مفعل كل ${periodicSyncMinutes} دقيقة`}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>سحب دوري للشيت:</span>
                <span className="font-mono text-white font-bold">{formatCountdown(nextSyncSeconds)}</span>
              </div>
            )}

            {/* Real Delivery Help Button */}
            {onOpenHelpModal && (
              <button
                onClick={onOpenHelpModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="اضغط هنا إذا كانت الرسائل لا تصل لهاتفك"
              >
                <span>❓ حل عدم وصول الرسائل</span>
              </button>
            )}

            {/* Sync / Refresh Button with Live Indicator */}
            <button
              onClick={onRefreshSheet}
              disabled={isRefreshing}
              title="تحديث فوري ومباشر من شيت جوجل الآن"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span className="text-xs font-bold whitespace-nowrap">
                {isRefreshing ? 'جارٍ التحديث...' : 'تحديث الشيت'}
              </span>
              {lastSyncedTime && !isRefreshing && (
                <span className="text-[10px] text-blue-300/80 font-mono hidden sm:inline">
                  ({lastSyncedTime})
                </span>
              )}
            </button>

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'تنبيهات الصوت مفعلة' : 'تنبيهات الصوت مكتومة'}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* PWA Install Button (if available) */}
            {installPrompt && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تثبيت التطبيق</span>
              </button>
            )}

            {/* Google Sheets Connection / Sign In Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-slate-800/90 border border-slate-700">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-7 h-7 rounded-lg ring-1 ring-blue-500/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'U')[0]}
                  </div>
                )}
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 inline" /> متصل بـ Sheets
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="تسجيل الخروج من Google"
                  className="p-1 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-lg transition-colors mr-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Google Sign In Button using official GSI design guidelines */
              <button
                onClick={handleLogin}
                disabled={isSigningIn}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'جارٍ الاتصال...' : 'ربط Google Sheets'}</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
