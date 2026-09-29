import React from 'react';
import { Users, UserX, UserCheck, Send, Clock, Play, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import { Employee } from '../types';

interface StatCardsProps {
  employees: Employee[];
  smsSentTodayCount: number;
  isAutoEnabled: boolean;
  nextRunSeconds: number;
  targetDate: string;
  availableDates: string[];
  onSelectTargetDate: (d: string) => void;
  onSendToAllUnbooked: () => void;
  onOpenSchedulerTab: () => void;
  onOpenAnalyticsTab?: () => void;
  onViewBooked?: () => void;
  onViewUnbooked?: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  employees,
  smsSentTodayCount,
  isAutoEnabled,
  nextRunSeconds,
  targetDate,
  availableDates,
  onSelectTargetDate,
  onSendToAllUnbooked,
  onOpenSchedulerTab,
  onOpenAnalyticsTab,
  onViewBooked,
  onViewUnbooked,
}) => {
  const total = employees.length;
  // Based on targetDate (first date by default)
  const unbooked = employees.filter((e) => e.shiftStatus === 'unbooked').length;
  const booked = employees.filter((e) => e.shiftStatus === 'booked').length;
  const firstDate = availableDates.length > 0 ? availableDates[0] : '2026/09/30';
  const isTargetFirstDate = targetDate === firstDate;

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4 mb-8">
      
      {/* Target Date Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-950/70 via-indigo-950/50 to-slate-900 border border-blue-500/30 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                تاريخ السحب والإرسال المعتمد:{' '}
                <span className="text-blue-300 font-mono text-base underline decoration-blue-500 underline-offset-4">
                  {targetDate || firstDate}
                </span>
              </h2>
              {isTargetFirstDate ? (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span>★</span>
                  <span>أول تاريخ بالشيت ({firstDate})</span>
                </span>
              ) : (
                <button
                  onClick={() => onSelectTargetDate(firstDate)}
                  className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 cursor-pointer transition-colors"
                >
                  العودة لأول تاريخ ({firstDate}) &larr;
                </button>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {booked} مختار
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20">
                {unbooked} غير مختار
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              يتم استخراج المختار ({booked}) والغير مختار ({unbooked}) من أول تاريخ بالشيت تلقائياً ({firstDate})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Analytics shortcut button */}
          {onOpenAnalyticsTab && (
            <button
              onClick={onOpenAnalyticsTab}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>التحليلات الشاملة</span>
            </button>
          )}

          {/* Date Selector Dropdown if user wants to change target */}
          {availableDates.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400 whitespace-nowrap">تغيير التاريخ:</span>
              <select
                value={targetDate}
                onChange={(e) => onSelectTargetDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-blue-300 focus:outline-none cursor-pointer"
              >
                {availableDates.map((d, idx) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    {d} {idx === 0 ? '(أول تاريخ بالشيت ⭐)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Unbooked Staff Card - High Priority */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 p-5 shadow-lg shadow-rose-950/20 group hover:border-rose-500/50 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                غير مختار (مستهدفو SMS ليوم {targetDate})
              </p>
              <h3 className="text-3xl font-black text-white tracking-tight">{unbooked}</h3>
              <p className="text-xs text-slate-400 mt-1">
                من إجمالي {total} موظف مسجل
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
              <UserX className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-rose-500/20 flex flex-col gap-2">
            {unbooked > 0 && (
              <button
                onClick={onSendToAllUnbooked}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال SMS لغير المختارين ({unbooked})</span>
              </button>
            )}
            {onViewUnbooked && (
              <button
                onClick={onViewUnbooked}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer self-start"
              >
                <span>عرض غير المختارين الـ {unbooked} في الجدول &larr;</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Confirmed Shifts Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 shadow-sm hover:border-emerald-500/50 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                مختار (حجز مؤكد ليوم {targetDate})
              </p>
              <h3 className="text-3xl font-black text-emerald-300 tracking-tight">{booked}</h3>
              <p className="text-xs text-slate-400 mt-1">
                نسبة الالتزام: {total > 0 ? Math.round((booked / total) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between">
            {onViewBooked ? (
              <button
                onClick={onViewBooked}
                className="text-xs font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all"
              >
                <span>عرض المختارين الـ {booked} في الجدول</span>
                <span>&larr;</span>
              </button>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold">حجوزات مسجلة</span>
            )}
            <span className="text-xs font-mono font-bold text-emerald-400">
              {booked} / {total}
            </span>
          </div>
        </div>

        {/* 3. SMS Sent Today Card */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-400 mb-1">
                رسائل SMS المرسلة اليوم
              </p>
              <h3 className="text-3xl font-black text-white tracking-tight">{smsSentTodayCount}</h3>
              <p className="text-xs text-slate-400 mt-1">
                تذكيرات فورية ومجدولة
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Send className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>حالة الإرسال: نشطة</span>
            <span className="text-blue-400 font-medium">سجل فوري 100%</span>
          </div>
        </div>

        {/* 4. Automated Dispatch Status Card */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm hover:border-indigo-500/30 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-400 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                الجدولة التلقائية
              </p>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {isAutoEnabled ? (
                  <span className="text-emerald-400 font-mono">{formatCountdown(nextRunSeconds)}</span>
                ) : (
                  <span className="text-slate-400 text-lg">متوقفة</span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAutoEnabled ? `فحص دوري وإرسال لغير المختارين` : 'يمكنك التفعيل الآن'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={onOpenSchedulerTab}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>إعدادات الفترات</span>
              <span>&larr;</span>
            </button>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                isAutoEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isAutoEnabled ? 'مفعل دورياً' : 'يدوي'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
