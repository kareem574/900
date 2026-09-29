import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Calendar,
  Send,
  Download,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Filter,
  BarChart3,
  Building,
  Sparkles,
} from 'lucide-react';
import { Employee, SmsLogEntry, ShiftAnalyticsData } from '../types';
import { calculateShiftAnalytics, downloadAnalyticsCsv } from '../services/analyticsService';

interface AnalyticsTabProps {
  employees: Employee[];
  availableDates: string[];
  targetDate: string;
  logs: SmsLogEntry[];
  onRefreshData: () => void;
  isRefreshing: boolean;
  onSendSmsSingle: (employee: Employee) => Promise<void>;
  onSendToTargetList: (targetEmployees: Employee[]) => void;
  onSelectTargetDate: (d: string) => void;
  autoSyncEnabled: boolean;
  periodicSyncMinutes: number;
  nextSyncSeconds: number;
  lastSyncedTime?: string;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  employees,
  availableDates,
  targetDate,
  logs,
  onRefreshData,
  isRefreshing,
  onSendSmsSingle,
  onSendToTargetList,
  onSelectTargetDate,
  autoSyncEnabled,
  periodicSyncMinutes,
  nextSyncSeconds,
  lastSyncedTime,
}) => {
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState<string>('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');

  const analytics: ShiftAnalyticsData = calculateShiftAnalytics(
    employees,
    availableDates,
    targetDate,
    logs
  );

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Critical zero-days employees
  const zeroDaysEmployees = employees.filter((e) => (e.selectedDaysCount ?? 0) === 0);

  // Filtered employees for quick management table
  const filteredEmployees = employees.filter((emp) => {
    if (selectedSupervisorFilter !== 'all' && emp.supervisor !== selectedSupervisorFilter) {
      return false;
    }
    if (selectedTierFilter === 'zero' && (emp.selectedDaysCount ?? 0) !== 0) {
      return false;
    }
    if (
      selectedTierFilter === 'partial' &&
      ((emp.selectedDaysCount ?? 0) === 0 || (emp.selectedDaysCount ?? 0) >= 5)
    ) {
      return false;
    }
    if (selectedTierFilter === 'full' && (emp.selectedDaysCount ?? 0) < 5) {
      return false;
    }
    if (selectedTierFilter === 'unbooked_today' && emp.shiftStatus !== 'unbooked') {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Executive Command Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 p-6 shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <span>مركز الإحصائيات والتحليلات الشاملة</span>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  مستوى تنفيذي متقدم
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              تحليل مباشر ودقيق لأداء الشيفتات، التزام المشرفين، نسب الحجز حسب التاريخ، وتتبع فوري لرسائل SMS مع التحديث الدوري التلقائي كل {periodicSyncMinutes} دقيقة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto Sync Timer Badge */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner">
              <Clock className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>التحديث الدوري القادم:</span>
              <span className="font-mono font-bold text-white text-sm">
                {autoSyncEnabled ? formatCountdown(nextSyncSeconds) : 'متوقف'}
              </span>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'جارٍ التحديث...' : 'تحديث فوري'}</span>
            </button>

            {/* Export Analytics CSV */}
            <button
              onClick={() => downloadAnalyticsCsv(analytics, employees)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير التقرير (CSV)</span>
            </button>
          </div>
        </div>

        {/* Sync Info Footer Strip */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>نظام التحديث الدوري التلقائي:</span>
            <span className="text-emerald-400 font-bold">مفعل (كل {periodicSyncMinutes} دقيقة)</span>
            {lastSyncedTime && (
              <span className="text-slate-400 font-mono">| آخر مزامنة: {lastSyncedTime}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-blue-300 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>يتم سحب التعديلات من شيت جوجل حياً بدون أي تخزين مؤقت</span>
          </div>
        </div>
      </div>

      {/* 6 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* KPI 1: Target Date Compliance */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">التزام ليوم {targetDate}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
              اليوم المعتمد
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{analytics.targetDateRate}%</span>
            <span className="text-xs text-slate-400">({analytics.bookedTargetDate} من {analytics.totalEmployees})</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${analytics.targetDateRate}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Overall Slots Fulfillment */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">تغطية كافة الأيام (Slots)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              الأسبوع كاملاً
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{analytics.overallBookingRate}%</span>
            <span className="text-xs text-slate-400">({analytics.totalBookedSlots}/{analytics.totalPossibleSlots})</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${analytics.overallBookingRate}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Zero-Days Employees (Critical Alert) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              معدومو الحجز (0 أيام)
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
              حرج جداً
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">{analytics.zeroDaysCount}</span>
            <span className="text-xs text-rose-300/80">موظف لم يسجلوا قط</span>
          </div>
          {analytics.zeroDaysCount > 0 && (
            <button
              onClick={() => onSendToTargetList(zeroDaysEmployees)}
              className="mt-2 w-full py-1 text-[11px] font-bold rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white transition-all text-center cursor-pointer"
            >
              إرسال تذكير فوري ({analytics.zeroDaysCount})
            </button>
          )}
        </div>

        {/* KPI 4: Average Days Per Employee */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">متوسط الأيام للموظف</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
              معدل الالتزام
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-indigo-300">{analytics.avgDaysPerEmployee}</span>
            <span className="text-xs text-slate-400">يوم / 5 أيام</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(analytics.avgDaysPerEmployee / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* KPI 5: SMS Delivery Success Rate */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">تسليم رسائل SMS</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
              Delivery Rate
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400">{analytics.smsSummary.deliveryRate}%</span>
            <span className="text-xs text-slate-400">({analytics.smsSummary.delivered} مستلم)</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${analytics.smsSummary.deliveryRate}%` }}
            />
          </div>
        </div>

        {/* KPI 6: Full Commitment Staff (5 Days) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">حجز كامل (5 أيام)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              100% ملتزم
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-300">{analytics.fullDaysCount}</span>
            <span className="text-xs text-slate-400">موظف مكتمل</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${(analytics.fullDaysCount / analytics.totalEmployees) * 100}%` }}
            />
          </div>
        </div>

      </div>

      {/* Row: Multi-Date Comparison & Commitment Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Multi-Day Comparison (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>مقارنة نسب الحجز حسب تواريخ الشيفتات</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                اضغط على أي تاريخ لاعتماده مباشرة كتاريخ السحب والإرسال النشط
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {analytics.dates.map((d) => {
              const isSelected = d.date === targetDate;
              return (
                <div
                  key={d.date}
                  onClick={() => onSelectTargetDate(d.date)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/50 shadow-md shadow-blue-950/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isSelected ? 'bg-blue-400 ring-4 ring-blue-500/20' : 'bg-slate-600'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">{d.date}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                            التاريخ النشط حالياً
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="text-emerald-400 font-semibold">{d.booked} محجوز</span>
                        <span>•</span>
                        <span className="text-rose-400 font-semibold">{d.unbooked} غير محجوز</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:w-48">
                    <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          d.rate >= 70 ? 'bg-emerald-500' : d.rate >= 40 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${d.rate}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-white w-10 text-left">
                      {d.rate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Commitment Tiers Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>توزيع مستويات التزام الموظفين</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تصنيف الموظفين حسب إجمالي الأيام المحجوزة بالأسبوع
            </p>
          </div>

          {/* Stacked Visual Bar */}
          <div className="w-full bg-slate-950 h-4 rounded-xl overflow-hidden flex shadow-inner border border-slate-800">
            {analytics.tiers.map((tier, idx) => (
              <div
                key={idx}
                title={`${tier.tierName}: ${tier.count} موظف (${tier.percentage}%)`}
                className={`bg-gradient-to-r ${tier.colorClass} h-full transition-all`}
                style={{ width: `${tier.percentage}%` }}
              />
            ))}
          </div>

          {/* Tiers List */}
          <div className="space-y-2.5 pt-2">
            {analytics.tiers.map((tier, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${tier.colorClass}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{tier.tierName}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${tier.badgeClass}`}>
                        {tier.daysLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{tier.description}</p>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className="text-base font-mono font-bold text-white">{tier.count}</span>
                  <span className="text-xs text-slate-400 font-mono block">({tier.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Supervisor Performance & Compliance Leaderboard */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>معدل التزام فرق العمل حسب المشرفين</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة مدى التزام موظفي كل مشرف بحجز الشيفتات ليوم {targetDate}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>عدد المشرفين:</span>
            <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800">
              {analytics.supervisors.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {analytics.supervisors.map((sup, idx) => {
            const isFull = sup.unbooked === 0;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{sup.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      إجمالي الفريق: {sup.total} موظف
                    </p>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                      isFull
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : sup.complianceRate >= 50
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {sup.complianceRate}% التزام
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-emerald-400' : sup.complianceRate >= 50 ? 'bg-blue-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${sup.complianceRate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-emerald-400 font-semibold">{sup.booked} محجوز</span>
                  <span className="text-rose-400 font-semibold">{sup.unbooked} غير محجوز</span>
                  {sup.unbooked > 0 && (
                    <button
                      onClick={() => {
                        const targetList = employees.filter(
                          (e) => e.supervisor === sup.name && e.shiftStatus === 'unbooked'
                        );
                        onSendToTargetList(targetList);
                      }}
                      className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-[11px] font-bold border border-rose-500/30 transition-colors cursor-pointer"
                      title="إرسال رسائل SMS لغير المختارين لدى هذا المشرف فقط"
                    >
                      تذكير SMS ({sup.unbooked})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical Attention Table: Employees with 0 Days Selected */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>الموظفون الأكثر حرجاً (معدومو الحجز - 0 أيام مختارة)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              هؤلاء الموظفون لم يسجلوا في أي شيفت على مدار الأسبوع كاملاً، ويلزم إرسال تنبيه عاجل لهم
            </p>
          </div>

          {zeroDaysEmployees.length > 0 && (
            <button
              onClick={() => onSendToTargetList(zeroDaysEmployees)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال SMS لكافة معدومي الحجز ({zeroDaysEmployees.length})</span>
            </button>
          )}
        </div>

        {zeroDaysEmployees.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-white">ممتاز! لا يوجد أي موظف لديه 0 أيام مختارة</p>
            <p className="text-xs text-slate-400 mt-1">جميع الموظفين قاموا بحجز شيفت واحد على الأقل</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">الكود (ID)</th>
                  <th className="py-3 px-4">اسم الموظف</th>
                  <th className="py-3 px-4">رقم الهاتف</th>
                  <th className="py-3 px-4">المشرف</th>
                  <th className="py-3 px-4">المنطقة والفرع</th>
                  <th className="py-3 px-4 text-center">أيام الحجز</th>
                  <th className="py-3 px-4 text-center">إجراء فوري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                {zeroDaysEmployees.slice(0, 15).map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{emp.id}</td>
                    <td className="py-3 px-4 font-bold text-white">{emp.name}</td>
                    <td className="py-3 px-4 font-mono text-blue-300" dir="ltr">{emp.localPhone || emp.phone}</td>
                    <td className="py-3 px-4 text-slate-300">{emp.supervisor || 'كريم شعبان'}</td>
                    <td className="py-3 px-4 text-slate-400">{emp.area || 'Masre Elgdeda'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        0 أيام مختارة
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onSendSmsSingle(emp)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                      >
                        إرسال SMS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
