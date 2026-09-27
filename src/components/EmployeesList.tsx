import React, { useState } from 'react';
import {
  Search,
  Send,
  UserCheck,
  UserX,
  Clock,
  Phone,
  MessageSquare,
  Filter,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  Check,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Employee } from '../types';

interface EmployeesListProps {
  employees: Employee[];
  targetDate: string;
  availableDates: string[];
  onSelectTargetDate: (d: string) => void;
  onSendSmsSingle: (employee: Employee) => Promise<void>;
  onSendToAllUnbooked: (targetList?: Employee[]) => void;
  onUpdateEmployee: (updated: Employee) => void;
  onAddEmployee: (emp: Employee) => void;
  sendingId: string | null;
}

export const EmployeesList: React.FC<EmployeesListProps> = ({
  employees,
  targetDate,
  availableDates,
  onSelectTargetDate,
  onSendSmsSingle,
  onSendToAllUnbooked,
  onUpdateEmployee,
  onAddEmployee,
  sendingId,
}) => {
  const [filter, setFilter] = useState<'all' | 'unbooked' | 'booked'>('unbooked');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Filter employees
  const filtered = employees.filter((emp) => {
    // Search match
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.phone.includes(search) ||
      (emp.rawPhone && emp.rawPhone.includes(search)) ||
      (emp.id && emp.id.includes(search)) ||
      (emp.area && emp.area.toLowerCase().includes(search.toLowerCase())) ||
      (emp.supervisor && emp.supervisor.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    // Filter by target date status
    if (filter === 'all') return true;
    if (filter === 'unbooked') return emp.shiftStatus === 'unbooked';
    if (filter === 'booked') return emp.shiftStatus === 'booked';

    return true;
  });

  const unbookedCount = employees.filter((e) => e.shiftStatus === 'unbooked').length;
  const bookedCount = employees.filter((e) => e.shiftStatus === 'booked').length;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-col gap-4">
        
        {/* Row 1: Search & Target Date Picker */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث بالاسم، رقم الهاتف، الكود (ID)، أو المنطقة..."
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Date Selector Filter */}
          {availableDates.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-xs text-slate-400 whitespace-nowrap">تاريخ السحب:</span>
              <select
                value={targetDate}
                onChange={(e) => onSelectTargetDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-blue-300 focus:outline-none cursor-pointer"
              >
                {availableDates.map((d, idx) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    {d} {idx === 0 ? '(أول تاريخ متاح بالشيت)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Button: Batch Send to Unbooked */}
          <div className="flex items-center gap-2">
            {unbookedCount > 0 && (
              <button
                onClick={() => onSendToAllUnbooked(filtered.filter((e) => e.shiftStatus === 'unbooked'))}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>إرسال SMS لغير المختارين ليوم {targetDate} ({filtered.filter((e) => e.shiftStatus === 'unbooked').length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Status Filter Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setFilter('unbooked')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              filter === 'unbooked'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
            <span>غير مختار في تاريخ {targetDate}</span>
            <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-200 text-xs font-mono font-bold">
              {unbookedCount} موظف
            </span>
          </button>

          <button
            onClick={() => setFilter('booked')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              filter === 'booked'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>مختار في تاريخ {targetDate}</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-200 text-xs font-mono font-bold">
              {bookedCount} موظف
            </span>
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            جميع الموظفين ({employees.length})
          </button>
        </div>

      </div>

      {/* Employees Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">الموظف والكود</th>
              <th className="py-3.5 px-4">رقم الهاتف (SMS)</th>
              <th className="py-3.5 px-4">المنطقة والمشرف</th>
              <th className="py-3.5 px-4">
                الحالة في أول تاريخ ({targetDate})
              </th>
              <th className="py-3.5 px-4">جدول كافة الأيام بالشيت</th>
              <th className="py-3.5 px-4 text-center">إجراءات SMS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <UserX className="w-10 h-10 text-slate-600 mb-2" />
                    <p className="font-semibold">لا يوجد موظفون يطابقون خيارات البحث أو التصفية</p>
                    <p className="text-xs text-slate-500 mt-1">
                      جرب تغيير الكلمات المفتاحية أو اختر تصفية أخرى
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((emp) => {
                const isUnbooked = emp.shiftStatus === 'unbooked';
                const isBooked = emp.shiftStatus === 'booked';
                const isSending = sendingId === emp.id;

                return (
                  <tr
                    key={emp.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isUnbooked ? 'bg-rose-950/15' : 'bg-emerald-950/5'
                    }`}
                  >
                    {/* Name & ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isUnbooked
                              ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {emp.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100 flex items-center gap-2">
                            {emp.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            {emp.id && (
                              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                ID: {emp.id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-200 dir-ltr text-right">
                          {emp.phone || emp.rawPhone || 'بدون رقم'}
                        </span>
                        {emp.phone && (
                          <a
                            href={`https://wa.me/${emp.phone.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="مراسلة سريعة عبر واتساب"
                            className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Area & Supervisor */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <p className="text-slate-300 font-medium">
                          {emp.area || emp.department || 'Masre Elgdeda'}
                          {emp.zone ? ` (${emp.zone})` : ''}
                        </p>
                        {emp.supervisor && (
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            المشرف: {emp.supervisor}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Target Date Status Badge */}
                    <td className="py-3.5 px-4">
                      {isUnbooked ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950">
                            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                            غير مختار
                          </span>
                          <p className="text-[11px] text-rose-400 font-medium">
                            مستهدف لإرسال SMS
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            مختار (حجز مؤكد)
                          </span>
                          <p className="text-[11px] text-emerald-400 font-medium">
                            تم الحجز لهذا التاريخ
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Day-by-Day Status Grid */}
                    <td className="py-3.5 px-4">
                      {emp.dayStatuses && Object.keys(emp.dayStatuses).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {Object.entries(emp.dayStatuses).map(([day, st]) => {
                            const isChosen = st === 'مختار';
                            const isTarget = day === targetDate;
                            return (
                              <div
                                key={day}
                                title={`${day}: ${st} ${isTarget ? '(التاريخ المستهدف للإرسال)' : ''}`}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  isTarget
                                    ? isChosen
                                      ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400'
                                      : 'bg-rose-500/30 border-rose-400 text-rose-200 ring-1 ring-rose-400'
                                    : isChosen
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                                }`}
                              >
                                <span className={isTarget ? 'underline font-bold' : ''}>
                                  {day.split('/').slice(-2).join('/')}
                                </span>
                                <span>{isChosen ? 'مختار' : 'غير مختار'}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">لا توجد بيانات تفصيلية للأيام</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Send SMS Single Button */}
                        <button
                          onClick={() => onSendSmsSingle(emp)}
                          disabled={isSending}
                          title="إرسال رسالة SMS تذكيرية فورية"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isUnbooked
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          } disabled:opacity-50`}
                        >
                          <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-bounce' : ''}`} />
                          <span>{isSending ? 'جارٍ الإرسال...' : 'إرسال SMS'}</span>
                        </button>
                      </div>
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
