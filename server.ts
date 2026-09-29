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
    // Send strict no-cache headers so client and browser NEVER receive stale sheet data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const sheetId = (req.query.sheetId as string) || DEFAULT_SHEET_ID;
    try {
      // Add timestamp and random nonce so Google CDN NEVER returns a cached copy
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&t=${Date.now()}&_bust=${Math.random().toString(36).substring(7)}`;
      const response = await fetch(csvUrl, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

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
        const clean = h.trim();
        if (
          /\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/.test(clean) ||
          clean.toLowerCase().startsWith('day') ||
          clean.includes('يوم')
        ) {
          dateColumns.push({ col: clean, idx });
        }
      });

      // Extract first date available
      const firstDate = dateColumns.length > 0 ? dateColumns[0].col : '2026/09/30';
      const requestedParam = (req.query.targetDate as string || '').trim();
      // CRITICAL FIX: If requested target date is not in sheet dateColumns, fallback to first real date
      const requestedDate =
        requestedParam && dateColumns.some((d) => d.col === requestedParam)
          ? requestedParam
          : firstDate;

      const employees = rows.map((row, rIdx) => {
        const id = idIdx >= 0 && row[idIdx] ? row[idIdx].trim() : `emp-${rIdx + 1}`;
        const name = nameIdx >= 0 && row[nameIdx] ? row[nameIdx].trim() : `موظف #${rIdx + 1}`;
        const rawPhone = phoneIdx >= 0 ? row[phoneIdx].trim() : '';
        const phone = formatEgyptPhone(rawPhone);
        const supervisor = supervisorIdx >= 0 ? row[supervisorIdx].trim() : '';
        const area = areaIdx >= 0 ? row[areaIdx].trim() : '';
        const zone = zoneIdx >= 0 ? row[zoneIdx].trim() : '';
        const rawSelectedCount = totalSelectedIdx >= 0 ? parseInt(row[totalSelectedIdx].trim(), 10) : NaN;

        // Day by day statuses
        const dayStatuses: Record<string, 'مختار' | 'غير مختار'> = {};
        let unbookedDaysCount = 0;
        let bookedDaysCount = 0;

        dateColumns.forEach(({ col, idx }) => {
          const val = (row[idx] || '').trim().replace(/[\r\n]/g, '');
          // User rule:
          // "غير مختار" = كده ده مش مختار
          // "مختار" = ده كده مختار
          if (val === 'مختار' || (val.includes('مختار') && !val.includes('غير')) || val.toLowerCase() === 'booked' || val === 'حجز') {
            dayStatuses[col] = 'مختار';
            bookedDaysCount++;
          } else {
            dayStatuses[col] = 'غير مختار';
            unbookedDaysCount++;
          }
        });

        const selectedDays = !isNaN(rawSelectedCount) ? rawSelectedCount : bookedDaysCount;
        const totalDays = dateColumns.length > 0 ? dateColumns.length : 5;

        // Target Date status (effective date in sheet)
        const targetDateStatus: 'مختار' | 'غير مختار' =
          requestedDate && dayStatuses[requestedDate] === 'مختار' ? 'مختار' : 'غير مختار';

        // Base shiftStatus on the target date as requested by user
        const shiftStatus: 'unbooked' | 'booked' | 'excused' =
          targetDateStatus === 'مختار' ? 'booked' : 'unbooked';

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
          targetDate: requestedDate,
          targetDateStatus,
          selectedDaysCount: selectedDays,
          totalShiftDays: totalDays,
          unbookedDaysCount,
          unbookedDaysList,
          dayStatuses,
          shiftDate: requestedDate || (unbookedDaysList.length > 0 ? unbookedDaysList[0] : '2026/09/30'),
          shiftTime: 'وردية العمل المعتمدة',
          smsCount: 0,
          notes:
            targetDateStatus === 'غير مختار'
              ? `غير مختار في تاريخ ${requestedDate}`
              : `مختار في تاريخ ${requestedDate}`,
        };
      });

      return res.json({
        success: true,
        headers,
        rawRows: rows,
        firstDate,
        targetDate: requestedDate,
        dateColumns: dateColumns.map((d) => d.col),
        totalStaff: employees.length,
        unbookedCount: employees.filter((e) => e.shiftStatus === 'unbooked').length,
        zeroDaysCount: employees.filter((e) => e.selectedDaysCount === 0).length,
        bookedCount: employees.filter((e) => e.shiftStatus === 'booked').length,
        employees,
        sheetTitle: 'جدول شيفتات الموظفين',
        source: 'server_proxy_direct',
        lastSyncedAt: new Date().toISOString(),
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
