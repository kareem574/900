export interface Employee {
  id: string;
  name: string;
  phone: string;
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
  isEnabled: boolean;
  intervalMinutes: number; // e.g. 15, 30, 60, 360, 1440
  dailySpecificTime?: string; // e.g. "09:00"
  cooldownHours: number; // Do not resend to same person within X hours
  autoSyncSheet: boolean;
  notifyOnSend: boolean;
  soundEnabled: boolean;
}
