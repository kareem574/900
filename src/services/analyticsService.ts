import { Employee, SmsLogEntry, ShiftAnalyticsData, SupervisorMetric, DateMetric, AreaMetric, CommitmentTier } from '../types';

export function calculateShiftAnalytics(
  employees: Employee[],
  availableDates: string[],
  targetDate: string,
  logs: SmsLogEntry[]
): ShiftAnalyticsData {
  const totalEmployees = employees.length;
  const dates = availableDates.length > 0 ? availableDates : ['2026/09/28', '2026/09/29', '2026/09/30', '2026/10/01', '2026/10/02'];
  const activeTargetDate = targetDate || dates[0];

  // Target date metrics
  const bookedTargetDate = employees.filter((e) => e.shiftStatus === 'booked').length;
  const unbookedTargetDate = employees.filter((e) => e.shiftStatus === 'unbooked').length;
  const targetDateRate = totalEmployees > 0 ? Math.round((bookedTargetDate / totalEmployees) * 100) : 0;

  // Multi-day slots calculation
  const totalPossibleSlots = totalEmployees * dates.length;
  let totalBookedSlots = 0;

  let zeroDaysCount = 0;
  let partialDaysCount = 0;
  let fullDaysCount = 0;

  employees.forEach((emp) => {
    const selectedCount = emp.selectedDaysCount ?? 0;
    totalBookedSlots += selectedCount;

    if (selectedCount === 0) {
      zeroDaysCount++;
    } else if (selectedCount < dates.length) {
      partialDaysCount++;
    } else {
      fullDaysCount++;
    }
  });

  const overallBookingRate = totalPossibleSlots > 0 ? Math.round((totalBookedSlots / totalPossibleSlots) * 100) : 0;
  const avgDaysPerEmployee = totalEmployees > 0 ? Number((totalBookedSlots / totalEmployees).toFixed(1)) : 0;

  // Supervisor metrics
  const supervisorMap: Record<string, { total: number; booked: number; unbooked: number }> = {};
  employees.forEach((emp) => {
    const supName = emp.supervisor?.trim() || 'مشرف عام';
    if (!supervisorMap[supName]) {
      supervisorMap[supName] = { total: 0, booked: 0, unbooked: 0 };
    }
    supervisorMap[supName].total++;
    if (emp.shiftStatus === 'booked') {
      supervisorMap[supName].booked++;
    } else {
      supervisorMap[supName].unbooked++;
    }
  });

  const supervisors: SupervisorMetric[] = Object.entries(supervisorMap)
    .map(([name, data]) => ({
      name,
      total: data.total,
      booked: data.booked,
      unbooked: data.unbooked,
      complianceRate: data.total > 0 ? Math.round((data.booked / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.unbooked - a.unbooked); // Sort by highest unbooked first to prioritize management focus

  // Date comparison
  const dateMetrics: DateMetric[] = dates.map((date) => {
    let booked = 0;
    let unbooked = 0;
    employees.forEach((emp) => {
      const status = emp.dayStatuses ? emp.dayStatuses[date] : undefined;
      if (status === 'مختار') {
        booked++;
      } else {
        unbooked++;
      }
    });
    return {
      date,
      booked,
      unbooked,
      rate: totalEmployees > 0 ? Math.round((booked / totalEmployees) * 100) : 0,
    };
  });

  // Area metrics
  const areaMap: Record<string, { total: number; booked: number; unbooked: number }> = {};
  employees.forEach((emp) => {
    const area = emp.area?.trim() || emp.zone?.trim() || 'المنطقة الرئيسية';
    if (!areaMap[area]) {
      areaMap[area] = { total: 0, booked: 0, unbooked: 0 };
    }
    areaMap[area].total++;
    if (emp.shiftStatus === 'booked') {
      areaMap[area].booked++;
    } else {
      areaMap[area].unbooked++;
    }
  });

  const areas: AreaMetric[] = Object.entries(areaMap)
    .map(([area, data]) => ({
      area,
      total: data.total,
      booked: data.booked,
      unbooked: data.unbooked,
    }))
    .sort((a, b) => b.total - a.total);

  // Commitment tiers (0 days, 1-2 days, 3-4 days, 5 days)
  const tier0 = zeroDaysCount;
  const tier1_2 = employees.filter((e) => (e.selectedDaysCount ?? 0) >= 1 && (e.selectedDaysCount ?? 0) <= 2).length;
  const tier3_4 = employees.filter((e) => (e.selectedDaysCount ?? 0) >= 3 && (e.selectedDaysCount ?? 0) <= 4).length;
  const tier5 = employees.filter((e) => (e.selectedDaysCount ?? 0) >= 5).length;

  const tiers: CommitmentTier[] = [
    {
      tierName: 'معدوم الحجز (حرج)',
      daysLabel: '0 أيام مختارة',
      count: tier0,
      percentage: totalEmployees > 0 ? Math.round((tier0 / totalEmployees) * 100) : 0,
      colorClass: 'from-rose-500 to-red-600',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      description: 'لم يقم باختيار أي شيفت طوال الأسبوع - يتطلب تدخلاً فورياً عبر SMS',
    },
    {
      tierName: 'التزام منخفض',
      daysLabel: '1 - 2 أيام',
      count: tier1_2,
      percentage: totalEmployees > 0 ? Math.round((tier1_2 / totalEmployees) * 100) : 0,
      colorClass: 'from-amber-500 to-orange-600',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'اختار يوم أو يومين فقط - يحتاج تحفيز لإكمال باقي الأيام',
    },
    {
      tierName: 'التزام جيد',
      daysLabel: '3 - 4 أيام',
      count: tier3_4,
      percentage: totalEmployees > 0 ? Math.round((tier3_4 / totalEmployees) * 100) : 0,
      colorClass: 'from-blue-500 to-indigo-600',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      description: 'اختار معظم الأيام المطلوبة مع وجود شيفت أو يومين متاحين',
    },
    {
      tierName: 'التزام كامل 100%',
      daysLabel: '5 أيام فأكثر',
      count: tier5,
      percentage: totalEmployees > 0 ? Math.round((tier5 / totalEmployees) * 100) : 0,
      colorClass: 'from-emerald-500 to-teal-600',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'أتم اختيار كافة شيفتات الأسبوع بالكامل',
    },
  ];

  // SMS Summary
  const todayStr = new Date().toISOString().split('T')[0];
  const delivered = logs.filter((l) => l.status === 'delivered' || l.status === 'sent').length;
  const failed = logs.filter((l) => l.status === 'failed').length;
  const todaySent = logs.filter((l) => (l.status === 'delivered' || l.status === 'sent') && l.timestamp.startsWith(todayStr)).length;
  const totalSent = logs.length;
  const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 100;

  return {
    totalEmployees,
    targetDate: activeTargetDate,
    bookedTargetDate,
    unbookedTargetDate,
    targetDateRate,
    totalPossibleSlots,
    totalBookedSlots,
    overallBookingRate,
    avgDaysPerEmployee,
    zeroDaysCount,
    partialDaysCount,
    fullDaysCount,
    supervisors,
    dates: dateMetrics,
    areas,
    tiers,
    smsSummary: {
      totalSent,
      delivered,
      failed,
      todaySent,
      deliveryRate,
    },
  };
}

// Download Executive Analytics Report as CSV
export function downloadAnalyticsCsv(analytics: ShiftAnalyticsData, employees: Employee[]) {
  const lines: string[] = [];

  lines.push('تقرير الإحصائيات الشامل للشيفتات ونظام التذكير');
  lines.push(`تاريخ استخراج التقرير:,${new Date().toLocaleString('ar-EG')}`);
  lines.push(`تاريخ الشيفت المعتمد:,${analytics.targetDate}`);
  lines.push('');

  lines.push('--- المؤشرات الرئيسية (KPIs) ---');
  lines.push(`إجمالي عدد الموظفين:,${analytics.totalEmployees}`);
  lines.push(`الموظفون المحجوزون ليوم ${analytics.targetDate}:,${analytics.bookedTargetDate}`);
  lines.push(`الموظفون غير المحجوزين ليوم ${analytics.targetDate}:,${analytics.unbookedTargetDate}`);
  lines.push(`نسبة الالتزام ليوم ${analytics.targetDate}:,${analytics.targetDateRate}%`);
  lines.push(`إجمالي الفرص المتاحة (Slots):,${analytics.totalPossibleSlots}`);
  lines.push(`إجمالي الشيفتات المحجوزة:,${analytics.totalBookedSlots}`);
  lines.push(`نسبة التغطية الكلية للأسبوع:,${analytics.overallBookingRate}%`);
  lines.push(`متوسط الأيام المختارة لكل موظف:,${analytics.avgDaysPerEmployee} يوم`);
  lines.push(`عدد الموظفين بدون أي حجز (0 أيام):,${analytics.zeroDaysCount}`);
  lines.push(`إجمالي رسائل SMS المرسلة:,${analytics.smsSummary.totalSent}`);
  lines.push(`نسبة نجاح تسليم الرسائل:,${analytics.smsSummary.deliveryRate}%`);
  lines.push('');

  lines.push('--- أداء المشرفين والالتزام ---');
  lines.push('المشرف,إجمالي الموظفين,محجوز,غير محجوز,نسبة الالتزام');
  analytics.supervisors.forEach((s) => {
    lines.push(`"${s.name}",${s.total},${s.booked},${s.unbooked},${s.complianceRate}%`);
  });
  lines.push('');

  lines.push('--- توزيع التواريخ والشيفتات ---');
  lines.push('التاريخ,محجوز,غير محجوز,نسبة الحجز');
  analytics.dates.forEach((d) => {
    lines.push(`${d.date},${d.booked},${d.unbooked},${d.rate}%`);
  });
  lines.push('');

  lines.push('--- قائمة الموظفين الحرجة (0 أيام مختارة - بدون حجز) ---');
  lines.push('ID,الاسم,الهاتف,المشرف,المنطقة,عدد الأيام المختارة');
  employees
    .filter((e) => (e.selectedDaysCount ?? 0) === 0)
    .forEach((e) => {
      lines.push(`${e.id},"${e.name}",${e.phone},"${e.supervisor || ''}","${e.area || ''}",0`);
    });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `تقرير_إحصائيات_الشيفتات_الشامل_${new Date().toISOString().split('T')[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
