import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RotateCw,
  Search,
  Download,
  Trash2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { SmsLogEntry } from '../types';

interface SmsLogsTabProps {
  logs: SmsLogEntry[];
  onRetrySms: (log: SmsLogEntry) => void;
  onClearLogs: () => void;
}

export const SmsLogsTab: React.FC<SmsLogsTabProps> = ({ logs, onRetrySms, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | 'delivered' | 'failed'>('all');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === 'all' || log.status === filter;
    const matchesSearch =
      log.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      log.phone.includes(search) ||
      log.message.includes(search);
    return matchesFilter && matchesSearch;
  });

  const exportCsv = () => {
    const headers = ['المعرف', 'اسم الموظف', 'رقم الهاتف', 'الحالة', 'البوابة', 'التوقيت', 'النوع', 'نص الرسالة'];
    const rows = logs.map((l) => [
      l.id,
      `"${l.employeeName}"`,
      l.phone,
      l.status,
      l.gateway,
      l.timestamp,
      l.autoTriggered ? 'تلقائي' : 'يدوي',
      `"${l.message.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sms-shift-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            سجل وتاريخ إرسال رسائل SMS المباشر
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تتبع كامل لكل الرسائل المرسلة يدوياً أو عبر الجدولة التلقائية
          </p>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>تصدير CSV</span>
              </button>
              <button
                onClick={onClearLogs}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                title="مسح السجل"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف في السجل..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            الكل ({logs.length})
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filter === 'delivered' ? 'bg-emerald-600 text-white' : 'text-emerald-400'
            }`}
          >
            ناجح ({logs.filter((l) => l.status === 'delivered' || l.status === 'sent').length})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filter === 'failed' ? 'bg-rose-600 text-white' : 'text-rose-400'
            }`}
          >
            فشل ({logs.filter((l) => l.status === 'failed').length})
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">المستلم</th>
              <th className="py-3 px-4">رقم الهاتف</th>
              <th className="py-3 px-4">الحالة</th>
              <th className="py-3 px-4">طريقة الإرسال</th>
              <th className="py-3 px-4">الوقت</th>
              <th className="py-3 px-4">نص الرسالة</th>
              <th className="py-3 px-4 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="font-semibold text-sm">سجل الإرسال فارغ حالياً</p>
                  <p className="text-xs text-slate-600 mt-1">
                    عند إرسال أول رسالة SMS (يدوياً أو تلقائياً) ستظهر كافة التفاصيل هنا.
                  </p>
                </td>
              </tr>
            ) : (
              filteredLogs.map((entry) => {
                const isDelivered = entry.status === 'delivered' || entry.status === 'sent';
                return (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors text-xs">
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {entry.employeeName}
                    </td>

                    <td className="py-3 px-4 font-mono dir-ltr text-right text-slate-300">
                      {entry.phone}
                    </td>

                    <td className="py-3 px-4">
                      {isDelivered ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          تم التسليم
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          فشل
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                            entry.autoTriggered
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {entry.autoTriggered ? 'تلقائي ⚡' : 'يدوي'}
                        </span>
                        <span className="text-slate-500 text-[10px]">({entry.gateway})</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(entry.timestamp).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-slate-300" title={entry.message}>
                      {entry.message}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {!isDelivered && (
                        <button
                          onClick={() => onRetrySms(entry)}
                          className="p-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 transition-colors"
                          title="إعادة المحاولة"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
