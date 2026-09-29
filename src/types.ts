export interface Employee {
  id: string;
  name: string;
  phone: string;
  localPhone?: string;
  rawPhone?: string;
  shiftStatus: 'unbooked' | 'booked' | 'excused';
  shiftDate?: string;
  shiftTime?: string;
  department?: string;
  area?: string;
  zone?: string;
  supervisor?: string;
  selectedDaysCount?: number;
  totalShiftDays?: number;
  unbookedDaysCount?: number;
  unbookedDaysList?: string[];
  targetDate?: string;
  targetDateStatus?: 'مختار' | 'غير مختار';
  dayStatuses?: Record<string, 'مختار' | 'غير مختار'>;
  lastSmsSentAt?: string;
  smsCount?: number;
  notes?: string;
}

export interface SheetColumnMapping {
  nameCol: string;
  phoneCol: string;
  statusCol: string;
  dateCol: string;
  timeCol?: string;
  deptCol?: string;
}

export type SmsGatewayType = 'simulator' | 'whatsapp' | 'native_device' | 'twilio' | 'custom_webhook';

export interface SmsGatewayConfig {
  gatewayType: SmsGatewayType;
  senderName: string;
  twilioSid?: string;
  twilioToken?: string;
  twilioFromNumber?: string;
  webhookUrl?: string;
  webhookMethod?: 'POST' | 'GET';
  webhookHeaders?: string;
  webhookBodyTemplate?: string;
}

export interface SmsTemplateConfig {
  templateArabic: string;
  templateEnglish: string;
  bookingUrl: string;
  companyName: string;
  language: 'ar' | 'en';
}

export interface SmsLogEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  phone: string;
  message: string;
  status: 'delivered' | 'sent' | 'failed' | 'pending';
  gateway: SmsGatewayType;
  timestamp: string;
  errorMessage?: string;
  autoTriggered: boolean;
}

export interface SchedulerConfig {
  isEnabled: boolean; // Auto-SMS dispatch enabled
  intervalMinutes: number; // SMS dispatch interval in minutes (default 15)
  dailySpecificTime?: string; // e.g. "09:00"
  cooldownHours: number; // Do not resend to same person within X hours
  autoSyncSheet: boolean; // Sync sheet before auto SMS dispatch
  autoSyncDataEnabled: boolean; // Periodic automatic data sync from Google Sheet
  periodicSyncMinutes: number; // Periodic sheet sync interval in minutes (default 15)
  notifyOnSend: boolean;
  soundEnabled: boolean;
}

export interface SupervisorMetric {
  name: string;
  total: number;
  booked: number;
  unbooked: number;
  complianceRate: number;
}

export interface DateMetric {
  date: string;
  booked: number;
  unbooked: number;
  rate: number;
}

export interface AreaMetric {
  area: string;
  total: number;
  booked: number;
  unbooked: number;
}

export interface CommitmentTier {
  tierName: string;
  daysLabel: string;
  count: number;
  percentage: number;
  colorClass: string;
  badgeClass: string;
  description: string;
}

export interface ShiftAnalyticsData {
  totalEmployees: number;
  targetDate: string;
  bookedTargetDate: number;
  unbookedTargetDate: number;
  targetDateRate: number;
  totalPossibleSlots: number;
  totalBookedSlots: number;
  overallBookingRate: number;
  avgDaysPerEmployee: number;
  zeroDaysCount: number;
  partialDaysCount: number;
  fullDaysCount: number;
  supervisors: SupervisorMetric[];
  dates: DateMetric[];
  areas: AreaMetric[];
  tiers: CommitmentTier[];
  smsSummary: {
    totalSent: number;
    delivered: number;
    failed: number;
    todaySent: number;
    deliveryRate: number;
  };
}

