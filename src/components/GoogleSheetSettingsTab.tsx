import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertTriangle,
  Table,
  Sliders,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SheetColumnMapping, Employee } from '../types';
import { googleSignIn } from '../services/firebaseAuth';
import { downloadUpdatedCsv } from '../services/sheetsService';
import { Download } from 'lucide-react';

interface GoogleSheetSettingsTabProps {
  sheetUrl: string;
  onUpdateSheetUrl: (url: string) => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  user: User | null;
  setUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
  headers: string[];
  rawRows: string[][];
  mapping: SheetColumnMapping;
  onUpdateMapping: (m: SheetColumnMapping) => void;
  sheetSource: string;
  sourceMessage: string;
  employees?: Employee[];
  targetDate?: string;
}

export const GoogleSheetSettingsTab: React.FC<GoogleSheetSettingsTabProps> = ({
  sheetUrl,
  onUpdateSheetUrl,
  onRefreshData,
  isRefreshing,
  user,
  setUser,
  setToken,
  headers,
  rawRows,
  mapping,
  onUpdateMapping,
  sheetSource,
  sourceMessage,
  employees = [],
  targetDate = '2026/09/28',
}) => {
  const [tempUrl, setTempUrl] = useState(sheetUrl);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUrl.trim()) return;
    onUpdateSheetUrl(tempUrl.trim());
    onRefreshData();
  };

  const handleLogin = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        onRefreshData();
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Current Sheet Connection Box */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Google Sheet المقترن بالنظام</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {sheetSource === 'google_api'
                    ? 'Google API موثق'
                    : sheetSource === 'gviz_public'
                    ? 'Google GViz مباشر'
                    : 'مقترن ومحمل'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{sourceMessage}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <span>فتح الشيت في Google</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {employees.length > 0 && (
              <button
                type="button"
                onClick={() => downloadUpdatedCsv(employees, targetDate)}
                title="تنزيل الشيت المحدث مع حالة رسائل SMS وتأكيد الحجز"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تنزيل الشيت المحدث</span>
              </button>
            )}

            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'جارٍ التحديث...' : 'تحديث البيانات الآن'}</span>
            </button>
          </div>
        </div>

        {/* Change Sheet URL Form */}
        <form onSubmit={handleSaveUrl} className="pt-4 border-t border-slate-800 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            رابط الشيت (Google Sheets URL أو المعرف ID):
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 dir-ltr text-right focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              تطبيق الرابط
            </button>
          </div>
        </form>
      </div>

      {/* Google Account Connection Status */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              ربط حساب Google لقراءة الشيتات الخاصة
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              إذا كان الشيت خاصاً ولا يمكن الوصول إليه علناً، قم بتسجيل الدخول بحساب Google الذي يملك صلاحية عرض الشيت.
            </p>
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Check className="w-4 h-4" />
                <span>متصل بحساب: {user.email}</span>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                disabled={isSigningIn}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold shadow transition-all cursor-pointer disabled:opacity-50"
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
                <span>{isSigningIn ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول مع Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Column Mapping Selector */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h4 className="text-base font-bold text-white">مطابقة أعمدة الشيت مع حقول النظام</h4>
        </div>
        <p className="text-xs text-slate-400">
          اكتشف النظام الأعمدة تلقائياً. يمكنك تعديل تعيين أي عمود إذا كانت مسميات الأعمدة في الشيت مختلفة:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* Name Column */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              عمود اسم الموظف *
            </label>
            <select
              value={mapping.nameCol}
              onChange={(e) => onUpdateMapping({ ...mapping, nameCol: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Column */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              عمود رقم الهاتف (SMS) *
            </label>
            <select
              value={mapping.phoneCol}
              onChange={(e) => onUpdateMapping({ ...mapping, phoneCol: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Status Column */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              عمود حالة الشيفت (حجز / غير حاجز) *
            </label>
            <select
              value={mapping.statusCol}
              onChange={(e) => onUpdateMapping({ ...mapping, statusCol: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Date Column */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">عمود تاريخ الشيفت</label>
            <select
              value={mapping.dateCol}
              onChange={(e) => onUpdateMapping({ ...mapping, dateCol: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- بدون عمود تاريخ --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Time / Period Column */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">عمود فترة الوردية</label>
            <select
              value={mapping.timeCol || ''}
              onChange={(e) => onUpdateMapping({ ...mapping, timeCol: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- بدون عمود فترة --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Department Column */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">عمود القسم / الفرع</label>
            <select
              value={mapping.deptCol || ''}
              onChange={(e) => onUpdateMapping({ ...mapping, deptCol: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- بدون عمود قسم --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Raw Sheet Data Preview */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-blue-400" />
          <h4 className="text-base font-bold text-white">معاينة الصفوف الأصلية من الشيت</h4>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 sticky top-0">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="py-2.5 px-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {rawRows.slice(0, 15).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/40">
                  {headers.map((_, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 whitespace-nowrap">
                      {row[cIdx] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
