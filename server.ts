import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SHEET_ID = '1VXIMchmEibTeO9nRIiXjMK518BhLzwOHsxqci5fX4LE';

export function formatEgyptPhone(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length === 10 && (digits.startsWith('10') || digits.startsWith('11') || digits.startsWith('12') || digits.startsWith('15'))) {
    return `+20${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('01')) {
    return `+2${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('20')) {
    return `+${digits}`;
  }
  return raw.startsWith('+') ? raw : `+${raw}`;
}

export function parseCsvRows(csvText: string) {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // Backend API route to fetch and parse Google Sheet directly without CORS issues
  app.get('/api/sheet-data', async (req, res) => {
    const sheetId = (req.query.sheetId as string) || DEFAULT_SHEET_ID;
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const response = await fetch(csvUrl);

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `Google Sheets returned status ${response.status}`,
        });
      }

      const csvText = await response.text();
      const { headers, rows } = parseCsvRows(csvText);

      // Identify column indices
      const idIdx = headers.findIndex((h) => h.toLowerCase() === 'id');
      const nameIdx = headers.findIndex((h) => h.toLowerCase() === 'name');
      const phoneIdx = headers.findIndex((h) => h.toLowerCase().includes('phone'));
      const supervisorIdx = headers.findIndex((h) => h.includes('مشرف') || h.toLowerCase().includes('supervisor'));
      const areaIdx = headers.findIndex((h) => h.toLowerCase() === 'area');
      const zoneIdx = headers.findIndex((h) => h.toLowerCase() === 'zone');
      const totalSelectedIdx = headers.findIndex((h) => h.includes('عدد الأيام') || h.includes('المختاره') || h.toLowerCase().includes('selected'));

      // Identify shift date columns (all columns that look like dates or 'Day')
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

      const employees = rows.map((row, rIdx) => {
        const id = idIdx >= 0 && row[idIdx] ? row[idIdx] : `emp-${rIdx + 1}`;
        const name = nameIdx >= 0 && row[nameIdx] ? row[nameIdx] : `موظف #${rIdx + 1}`;
        const rawPhone = phoneIdx >= 0 ? row[phoneIdx] : '';
        const phone = formatEgyptPhone(rawPhone);
        const supervisor = supervisorIdx >= 0 ? row[supervisorIdx] : '';
        const area = areaIdx >= 0 ? row[areaIdx] : '';
        const zone = zoneIdx >= 0 ? row[zoneIdx] : '';
        const rawSelectedCount = totalSelectedIdx >= 0 ? parseInt(row[totalSelectedIdx]) : NaN;

        // Day by day statuses
        const dayStatuses: Record<string, 'مختار' | 'غير مختار'> = {};
        let unbookedDaysCount = 0;
        let bookedDaysCount = 0;

        dateColumns.forEach(({ col, idx }) => {
          const val = (row[idx] || '').trim();
          // User rule:
          // "غير مختار" = كده ده مش مختار
          // "مختار" = ده كده مختار
          if (val === 'مختار' || val.toLowerCase() === 'booked' || val === 'حجز') {
            dayStatuses[col] = 'مختار';
            bookedDaysCount++;
          } else {
            dayStatuses[col] = 'غير مختار';
            unbookedDaysCount++;
          }
        });

        const selectedDays = !isNaN(rawSelectedCount) ? rawSelectedCount : bookedDaysCount;
        const totalDays = dateColumns.length > 0 ? dateColumns.length : 6;

        // Overall shiftStatus:
        // If selectedDays === 0 or unbookedDaysCount === totalDays -> strictly 'unbooked' (لم يحجز إطلاقاً)
        // If selectedDays < totalDays -> 'unbooked' (غير مختار بالكامل، متبقي أيام لم تحجز)
        // If selectedDays >= totalDays -> 'booked' (مختار بالكامل)
        const shiftStatus: 'unbooked' | 'booked' | 'excused' =
          selectedDays >= totalDays ? 'booked' : 'unbooked';

        const unbookedDaysList = Object.entries(dayStatuses)
          .filter(([_, status]) => status === 'غير مختار')
          .map(([day]) => day);

        return {
          id,
          name,
          phone,
          rawPhone,
          supervisor,
          department: area ? `${area} - ${zone}` : 'العمليات',
          area,
          zone,
          shiftStatus,
          selectedDaysCount: selectedDays,
          totalShiftDays: totalDays,
          unbookedDaysCount,
          unbookedDaysList,
          dayStatuses,
          shiftDate: unbookedDaysList.length > 0 ? unbookedDaysList.join(', ') : 'جميع الأيام محجوزة',
          shiftTime: 'وردية العمل المعتمدة',
          smsCount: 0,
          notes:
            selectedDays === 0
              ? 'غير مختار (0 من 6 أيام)'
              : selectedDays < totalDays
              ? `غير مختار جزئياً (${selectedDays} من ${totalDays} أيام مختارة)`
              : 'مختار بالكامل (تم الحجز)',
        };
      });

      return res.json({
        success: true,
        headers,
        rawRows: rows,
        dateColumns: dateColumns.map((d) => d.col),
        totalStaff: employees.length,
        unbookedCount: employees.filter((e) => e.shiftStatus === 'unbooked').length,
        zeroDaysCount: employees.filter((e) => e.selectedDaysCount === 0).length,
        bookedCount: employees.filter((e) => e.shiftStatus === 'booked').length,
        employees,
        sheetTitle: 'جدول شيفتات الموظفين',
        source: 'server_proxy_direct',
      });
    } catch (err: any) {
      console.error('Error in /api/sheet-data:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error while fetching sheet',
      });
    }
  });

  // Serve Vite in development or static in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
