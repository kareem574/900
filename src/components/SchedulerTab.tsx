import React from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCw,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';
import { SchedulerConfig } from '../types';

interface SchedulerTabProps {
  config: SchedulerConfig;
  onUpdateConfig: (cfg: SchedulerConfig) => void;
  nextRunSeconds: number;
  onTriggerManualRun: () => void;
  isRunningNow: boolean;
  unbookedCount: number;
}

export const SchedulerTab: React.FC<SchedulerTabProps> = ({
  config,
  onUpdateConfig,
  nextRunSeconds,
  onTriggerManualRun,
  isRunningNow,
  unbookedCount,
}) => {
  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    if (hours > 0) {
      return `${hours} ساعة و ${minutes} دقيقة و ${seconds} ثانية`;
    }
    return `${minutes} دقيقة و ${seconds < 10 ? '0' : ''}${seconds} ثانية`;
  };

  const intervals = [
    { label: 'كل 15 دقيقة (مستحسن - ربع ساعة)', value: 15 },
    { label: 'كل 30 دقيقة', value: 30 },
    { label: 'كل 1 ساعة (دوري)', value: 60 },
    { label: 'كل 3 ساعات', value: 180 },
    { label: 'كل 6 ساعات', value: 360 },
    { label: 'كل 12 ساعة (صباحاً ومساءً)', value: 720 },
    { label: 'مرة واحدة يومياً (24 ساعة)', value: 1440 },
  ];

  const syncIntervals = [
    { label: 'كل دقيقة (أسرع تحديث)', value: 1 },
    { label: 'كل 5 دقائق (موصى به)', value: 5 },
    { label: 'كل 10 دقائق (سريع)', value: 10 },
    { label: 'كل 15 دقيقة (الموصى به - ربع ساعة)', value: 15 },
    { label: 'كل 30 دقيقة', value: 30 },
    { label: 'كل 60 دقيقة (كل ساعة)', value: 60 },
  ];

  const cooldowns = [
    { label: 'كل 6 ساعات (تذكير متكرر)', value: 6 },
    { label: 'كل 12 ساعة (تذكير مرتين باليوم)', value: 12 },
    { label: 'كل 24 ساعة (مرة يومياً فقط)', value: 24 },
    { label: 'كل 48 ساعة (كل يومين)', value: 48 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Hero Master Switch Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        config.isEnabled
          ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40 shadow-xl shadow-emerald-950/20'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${config.isEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              <h3 className="text-xl font-black text-white">
                {config.isEnabled ? 'محرك الإرسال التلقائي: قيد العمل والجدولة' : 'محرك الإرسال التلقائي: متوقف حالياً'}
              </h3>
            </div>
            <p className="text-sm text-slate-400 max-w-xl">
              يقوم النظام تلقائياً بفحص Google Sheet في المواعيد المحددة، واكتشاف أي موظف لم يقم بحجز الشيفت، ثم إرسال رسالة SMS تذكيرية له مباشرة دون تدخل يدوي.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdateConfig({ ...config, isEnabled: !config.isEnabled })}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all cursor-pointer ${
                config.isEnabled
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {config.isEnabled ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>إيقاف التشغيل التلقائي</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>تفعيل التشغيل التلقائي الآن</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Countdown & Manual Trigger */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">الوقت المتبقي حتى الفحص والإرسال القادم:</p>
              <p className="text-lg font-black text-blue-300 font-mono">
                {config.isEnabled ? formatCountdown(nextRunSeconds) : 'الإرسال التلقائي غير مفعل'}
              </p>
            </div>
          </div>

          <button
            onClick={onTriggerManualRun}
            disabled={isRunningNow}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${isRunningNow ? 'animate-bounce text-amber-300' : ''}`} />
            <span>{isRunningNow ? 'جارٍ الفحص والإرسال الآن...' : 'تشغيل دورة فحص وإرسال فورية ⚡'}</span>
          </button>
        </div>
      </div>

      {/* Scheduler Configuration Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Interval Selection */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h4 className="text-base font-bold text-white">فترة تكرار الفحص التلقائي</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            حدد الفترة الزمنية التي يقوم فيها النظام بإعادة مراجعة جدول الشيفتات وإرسال التذكيرات للموظفين المتأخرين.
          </p>

          <div className="space-y-2 pt-2">
            {intervals.map((item) => (
              <label
                key={item.value}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  config.intervalMinutes === item.value
                    ? 'bg-blue-600/15 border-blue-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <span className="text-sm font-semibold">{item.label}</span>
                <input
                  type="radio"
                  name="intervalMinutes"
                  checked={config.intervalMinutes === item.value}
                  onChange={() => onUpdateConfig({ ...config, intervalMinutes: item.value })}
                  className="w-4 h-4 text-blue-600 accent-blue-600 focus:ring-0"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Anti-Spam & Sync Rules */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h4 className="text-base font-bold text-white">سياسة حماية الموظفين من الإزعاج (Cooldown)</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            لمنع إرسال رسائل متكررة ومزعجة، لن يقوم النظام بإرسال SMS للموظف إذا كان قد استلم تذكير خلال الفترة المحددة:
          </p>

          <div className="space-y-2 pt-2">
            {cooldowns.map((item) => (
              <label
                key={item.value}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  config.cooldownHours === item.value
                    ? 'bg-amber-500/15 border-amber-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <span className="text-sm font-semibold">{item.label}</span>
                <input
                  type="radio"
                  name="cooldownHours"
                  checked={config.cooldownHours === item.value}
                  onChange={() => onUpdateConfig({ ...config, cooldownHours: item.value })}
                  className="w-4 h-4 text-amber-500 accent-amber-500 focus:ring-0"
                />
              </label>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            {/* Auto sync before send toggle */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoSyncSheet}
                onChange={(e) => onUpdateConfig({ ...config, autoSyncSheet: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600 mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  مزامنة الشيت تلقائياً قبل كل دورة إرسال
                </p>
                <p className="text-xs text-slate-400">
                  يقوم بقراءة Google Sheet لجلب أي موظف قام بالحجز حديثاً واستبعاده من الإرسال.
                </p>
              </div>
            </label>

            {/* Sound notification toggle */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.soundEnabled}
                onChange={(e) => onUpdateConfig({ ...config, soundEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600 mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  تشغيل صوت رنين عند نجاح إرسال التذكيرات
                </p>
                <p className="text-xs text-slate-400">
                  صوت تنبيه خفيف (Audio Chime) عند اكتمال إرسال كل رسالة SMS.
                </p>
              </div>
            </label>
          </div>
        </div>

      </div>

      {/* Dedicated Periodic Data Sync Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-indigo-500/30 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <RotateCw className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>التحديث الدوري التلقائي لبيانات الشيت (Periodic Live Sync)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  سحب دوري كل {config.periodicSyncMinutes || 15} دقيقة
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                يقوم النظام بإعادة جلب أحدث نسخة من شيت جوجل تلقائياً بالخلفية لضمان دقة الإحصائيات وعدم مراسلة أي موظف حجز حديثاً.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={config.autoSyncDataEnabled !== false}
              onChange={(e) => onUpdateConfig({ ...config, autoSyncDataEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-white">تفعيل التحديث الدوري</span>
          </label>
        </div>

        {config.autoSyncDataEnabled !== false && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              فترة التحديث الدوري لسحب البيانات من الشيت:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {syncIntervals.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => onUpdateConfig({ ...config, periodicSyncMinutes: s.value })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                    (config.periodicSyncMinutes || 15) === s.value
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
