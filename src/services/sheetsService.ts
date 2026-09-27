import { Employee, SheetColumnMapping } from '../types';
import { getAccessToken } from './firebaseAuth';

export const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1VXIMchmEibTeO9nRIiXjMK518BhLzwOHsxqci5fX4LE/edit?usp=drivesdk';
export const DEFAULT_SHEET_ID = '1VXIMchmEibTeO9nRIiXjMK518BhLzwOHsxqci5fX4LE';

export function extractSheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return urlOrId.trim();
}

export interface SheetFetchResult {
  employees: Employee[];
  headers: string[];
  rawRows: string[][];
  dateColumns?: string[];
  sheetTitle: string;
  source: 'server_proxy_direct' | 'google_api' | 'gviz_public' | 'csv_public' | 'demo_fallback';
  message: string;
}

// Helper to sanitize and format Egyptian phone numbers accurately
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^\d]/g, '');
  if (
    digits.length === 10 &&
    (digits.startsWith('10') ||
      digits.startsWith('11') ||
      digits.startsWith('12') ||
      digits.startsWith('15'))
  ) {
    return `+20${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('01')) {
    return `+2${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('20')) {
    return `+${digits}`;
  }
  return phone.startsWith('+') ? phone : `+${phone}`;
}

// Auto-detect columns from headers
export function detectColumnMapping(headers: string[]): SheetColumnMapping {
  const mapping: SheetColumnMapping = {
    nameCol: '',
    phoneCol: '',
    statusCol: '',
    dateCol: '',
    timeCol: '',
    deptCol: '',
  };

  headers.forEach((header) => {
    const h = header.trim().toLowerCase();

    // Name detection
    if (
      !mapping.nameCol &&
      (h === 'name' ||
        h.includes('اسم') ||
        h.includes('موظف') ||
        h.includes('staff') ||
        h.includes('employee'))
    ) {
      mapping.nameCol = header;
    }

    // Phone detection
    if (
      !mapping.phoneCol &&
      (h.includes('phone') ||
        h.includes('هاتف') ||
        h.includes('موبايل') ||
        h.includes('جوال') ||
        h.includes('mobile'))
    ) {
      mapping.phoneCol = header;
    }

    // Shift status detection
    if (
      !mapping.statusCol &&
      (h.includes('عدد الأيام') ||
        h.includes('المختاره') ||
        h.includes('حجز') ||
        h.includes('status') ||
        h.includes('booked') ||
        h.includes('shift'))
    ) {
      mapping.statusCol = header;
    }

    // Date detection
    if (
      !mapping.dateCol &&
      (/\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/.test(h) || h.includes('تاريخ') || h.includes('date'))
    ) {
      mapping.dateCol = header;
    }

    // Department detection
    if (
      !mapping.deptCol &&
      (h === 'area' || h.includes('zone') || h.includes('قسم') || h.includes('فرع'))
    ) {
      mapping.deptCol = header;
    }
  });

  // Fallback defaults if not found
  if (!mapping.nameCol && headers.length > 2) mapping.nameCol = headers[2];
  if (!mapping.phoneCol && headers.length > 6) mapping.phoneCol = headers[6];
  if (!mapping.statusCol && headers.length > 7) mapping.statusCol = headers[7];

  return mapping;
}

// Parse status value based explicitly on user rules:
// "غير مختار" = كده ده مش مختار (Unbooked)
// "مختار" = ده كده مختار (Booked)
export function parseShiftStatus(value: string | undefined | null): 'unbooked' | 'booked' | 'excused' {
  if (!value) return 'unbooked';
  const v = value.trim();

  // Booked indicators: "مختار", "تم الحجز", "Booked", "1", "Yes"
  if (
    v === 'مختار' ||
    v.toLowerCase() === 'booked' ||
    v === 'حجز' ||
    v === 'تم' ||
    v === 'تم الحجز' ||
    v === 'نعم' ||
    v === 'yes' ||
    v === 'confirmed' ||
    v === 'true'
  ) {
    return 'booked';
  }

  // Excused / Leave indicators
  if (
    v.includes('إجازة') ||
    v.includes('اجازة') ||
    v.includes('معذور') ||
    v.includes('leave') ||
    v.includes('excused') ||
    v.includes('غياب')
  ) {
    return 'excused';
  }

  // "غير مختار" or any other unselected value = strictly unbooked
  return 'unbooked';
}

// Convert table rows into Employee objects
export function rowsToEmployees(
  headers: string[],
  rows: string[][],
  mapping: SheetColumnMapping
): Employee[] {
  const nameIdx = headers.indexOf(mapping.nameCol);
  const phoneIdx = headers.indexOf(mapping.phoneCol);
  const statusIdx = headers.indexOf(mapping.statusCol);
  const deptIdx = mapping.deptCol ? headers.indexOf(mapping.deptCol) : -1;

  // Find all date columns
  const dateColumns: { col: string; idx: number }[] = [];
  headers.forEach((h, idx) => {
    if (
      /\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/.test(h) ||
      h.toLowerCase().startsWith('day') ||
      h.includes('يوم')
    ) {
      dateColumns.push({ col: h, idx });
    }
  });

  const totalDays = dateColumns.length > 0 ? dateColumns.length : 6;
  const employees: Employee[] = [];

  rows.forEach((row, i) => {
    const name = (nameIdx >= 0 ? row[nameIdx] : '') || `موظف #${i + 1}`;
    const rawPhone = (phoneIdx >= 0 ? row[phoneIdx] : '') || '';
    const phone = formatPhoneNumber(rawPhone);
    const department = deptIdx >= 0 ? row[deptIdx] : '';

    // Day-by-day mapping
    const dayStatuses: Record<string, 'مختار' | 'غير مختار'> = {};
    let bookedCount = 0;
    let unbookedCount = 0;

    dateColumns.forEach(({ col, idx }) => {
      const cellVal = (row[idx] || '').trim();
      if (cellVal === 'مختار') {
        dayStatuses[col] = 'مختار';
        bookedCount++;
      } else {
        dayStatuses[col] = 'غير مختار';
        unbookedCount++;
      }
    });

    // Check specific status column if present
    const rawStatus = statusIdx >= 0 ? row[statusIdx] : '';
    const numericSelected = parseInt(rawStatus);
    const selectedDaysCount = !isNaN(numericSelected) ? numericSelected : bookedCount;

    const unbookedDaysList = Object.entries(dayStatuses)
      .filter(([_, st]) => st === 'غير مختار')
      .map(([d]) => d);

    // If selectedDaysCount === 0 -> unbooked
    // If selectedDaysCount < totalDays -> unbooked
    // If selectedDaysCount >= totalDays -> booked
    let shiftStatus: 'unbooked' | 'booked' | 'excused' = 'unbooked';
    if (selectedDaysCount >= totalDays) {
      shiftStatus = 'booked';
    } else if (parseShiftStatus(rawStatus) === 'excused') {
      shiftStatus = 'excused';
    } else {
      shiftStatus = 'unbooked';
    }

    if (name.trim() !== '' || phone.trim() !== '') {
      employees.push({
        id: `emp-sheet-${i + 1}`,
        name: name.trim() || `موظف #${i + 1}`,
        phone: phone || rawPhone,
        rawPhone,
        shiftStatus,
        selectedDaysCount,
        totalShiftDays: totalDays,
        unbookedDaysCount: unbookedDaysList.length,
        unbookedDaysList,
        dayStatuses,
        shiftDate:
          unbookedDaysList.length > 0 ? unbookedDaysList.join(', ') : 'جميع الأيام محجوزة',
        shiftTime: 'وردية العمل المعتمدة',
        department: department || 'العمليات',
        notes:
          selectedDaysCount === 0
            ? 'غير مختار (0 من 6 أيام)'
            : selectedDaysCount < totalDays
            ? `غير مختار جزئياً (${selectedDaysCount} من ${totalDays} أيام مختارة)`
            : 'مختار بالكامل (تم الحجز)',
        smsCount: 0,
      });
    }
  });

  return employees;
}

// Main fetch function with priority for Server Proxy
export async function fetchGoogleSheetData(sheetIdOrUrl: string): Promise<SheetFetchResult> {
  const sheetId = extractSheetId(sheetIdOrUrl);

  // Strategy 1: Call Backend Server Proxy /api/sheet-data
  try {
    const res = await fetch(`/api/sheet-data?sheetId=${encodeURIComponent(sheetId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.employees && data.employees.length > 0) {
        return {
          employees: data.employees,
          headers: data.headers,
          rawRows: data.rawRows,
          dateColumns: data.dateColumns,
          sheetTitle: data.sheetTitle || 'جدول شيفتات الموظفين',
          source: 'server_proxy_direct',
          message: `تم جلب بيانات الشيت الحقيقية بنجاح (${data.employees.length} موظف، ${data.unbookedCount} غير مختار، ${data.bookedCount} مختار).`,
        };
      }
    }
  } catch (e) {
    console.warn('Backend proxy fetch failed, falling back:', e);
  }

  // Strategy 2: Google Sheets API v4 using Bearer OAuth Token
  const accessToken = await getAccessToken();
  if (accessToken) {
    try {
      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (metaRes.ok) {
        const meta = await metaRes.json();
        const firstSheet = meta.sheets?.[0]?.properties?.title || 'Sheet1';

        const dataRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
            firstSheet
          )}!A1:Z500`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (dataRes.ok) {
          const data = await dataRes.json();
          const values: string[][] = data.values || [];

          if (values.length > 0) {
            const headers = values[0].map((h) => String(h || '').trim());
            const rows = values.slice(1);
            const mapping = detectColumnMapping(headers);
            const employees = rowsToEmployees(headers, rows, mapping);

            return {
              employees,
              headers,
              rawRows: rows,
              sheetTitle: firstSheet,
              source: 'google_api',
              message: `تم جلب البيانات بنجاح من Google Sheets API (${employees.length} موظف).`,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets API token fetch failed:', err);
    }
  }

  // Strategy 3: Google Visualization API (GViz)
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    const res = await fetch(gvizUrl);
    if (res.ok) {
      const text = await res.text();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
        const cols = parsed.table?.cols || [];
        const rowsData = parsed.table?.rows || [];

        const headers: string[] = cols.map(
          (c: any, idx: number) => c.label || c.id || `عمود ${idx + 1}`
        );

        const rawRows: string[][] = rowsData.map((r: any) => {
          return (r.c || []).map((cell: any) => {
            if (!cell) return '';
            return cell.f !== undefined ? String(cell.f) : cell.v !== undefined ? String(cell.v) : '';
          });
        });

        if (headers.length > 0 && rawRows.length > 0) {
          const mapping = detectColumnMapping(headers);
          const employees = rowsToEmployees(headers, rawRows, mapping);
          return {
            employees,
            headers,
            rawRows,
            sheetTitle: parsed.table?.title || 'الشيت المباشر',
            source: 'gviz_public',
            message: `تمت القراءة الفورية عبر Google Visualization (${employees.length} موظف).`,
          };
        }
      }
    }
  } catch (err) {
    console.warn('GViz fetch failed:', err);
  }

  // Strategy 4: Fallback
  return {
    employees: [],
    headers: [],
    rawRows: [],
    sheetTitle: 'جدول شيفتات الموظفين',
    source: 'demo_fallback',
    message: 'تعذر جلب الشيت. تحقق من الاتصال أو قم بربط حساب Google.',
  };
}
