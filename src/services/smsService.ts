import { Employee, SmsGatewayConfig, SmsLogEntry, SmsTemplateConfig } from '../types';

export const DEFAULT_TEMPLATE_CONFIG: SmsTemplateConfig = {
  templateArabic:
    'مرحباً {name}، نود تذكيرك بأنك لم تقم بحجز شيفتك ليوم {date} حتى الآن. يرجى المسارعة بحجز الشيفت عبر الرابط لتأكيد جدول العمل: {booking_link}',
  templateEnglish:
    'Hello {name}, this is a reminder that you have not booked your shift for {date} yet. Please book your shift now at: {booking_link}',
  bookingUrl: 'https://shift.company.com/portal',
  companyName: 'إدارة العمليات والشيفتات',
  language: 'ar',
};

export const DEFAULT_GATEWAY_CONFIG: SmsGatewayConfig = {
  gatewayType: 'simulator',
  senderName: 'ShiftAlert',
  twilioSid: '',
  twilioToken: '',
  twilioFromNumber: '',
  webhookUrl: '',
  webhookMethod: 'POST',
  webhookHeaders: '{"Content-Type": "application/json"}',
  webhookBodyTemplate: '{"to": "{phone}", "text": "{message}", "sender": "{sender}"}',
};

// Play audio chime when SMS is dispatched
export function playSmsChime(soundEnabled: boolean = true) {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone notification chime
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio context may be restricted by browser policy before user interaction
  }
}

// Compile template with dynamic variables
export function renderSmsMessage(
  template: string,
  employee: Employee,
  companyName: string,
  bookingUrl: string
): string {
  return template
    .replace(/\{name\}/g, employee.name)
    .replace(/\{date\}/g, employee.shiftDate || 'الأسبوع الحالي')
    .replace(/\{shift\}/g, employee.shiftTime || 'الوردية القادمة')
    .replace(/\{booking_link\}/g, bookingUrl)
    .replace(/\{company_name\}/g, companyName)
    .replace(/\{phone\}/g, employee.phone);
}

// Calculate SMS character length and segments (Arabic Unicode is 70 chars/segment, GSM 7-bit is 160 chars)
export function calculateSmsSegments(text: string) {
  const isUnicode = /[^\u0000-\u00ff]/.test(text);
  const length = text.length;

  if (isUnicode) {
    // Unicode: 70 characters for 1 segment, 67 characters for concatenated segments
    const segments = length <= 70 ? 1 : Math.ceil(length / 67);
    const maxInCurrent = segments === 1 ? 70 : segments * 67;
    return {
      length,
      isUnicode: true,
      segments,
      charsRemaining: maxInCurrent - length,
      encoding: 'Unicode (عربي)',
    };
  } else {
    // GSM 7-bit: 160 characters for 1 segment, 153 for concatenated segments
    const segments = length <= 160 ? 1 : Math.ceil(length / 153);
    const maxInCurrent = segments === 1 ? 160 : segments * 153;
    return {
      length,
      isUnicode: false,
      segments,
      charsRemaining: maxInCurrent - length,
      encoding: 'GSM 7-bit (إنجليزي)',
    };
  }
}

// Dispatch an SMS to an individual employee
export async function sendSmsToEmployee(
  employee: Employee,
  gatewayConfig: SmsGatewayConfig,
  templateConfig: SmsTemplateConfig,
  autoTriggered: boolean = false
): Promise<SmsLogEntry> {
  const template =
    templateConfig.language === 'ar'
      ? templateConfig.templateArabic
      : templateConfig.templateEnglish;

  const message = renderSmsMessage(
    template,
    employee,
    templateConfig.companyName,
    templateConfig.bookingUrl
  );

  const logId = `sms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  // Validate phone number
  if (!employee.phone || employee.phone.replace(/[^\d]/g, '').length < 8) {
    return {
      id: logId,
      employeeId: employee.id,
      employeeName: employee.name,
      phone: employee.phone || 'بدون رقم',
      message,
      status: 'failed',
      gateway: gatewayConfig.gatewayType,
      timestamp,
      errorMessage: 'رقم الهاتف غير صالح أو ناقص',
      autoTriggered,
    };
  }

  // 1. SIMULATOR GATEWAY
  if (gatewayConfig.gatewayType === 'simulator') {
    // Simulate real cellular network delay
    await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 400));

    return {
      id: logId,
      employeeId: employee.id,
      employeeName: employee.name,
      phone: employee.phone,
      message,
      status: 'delivered',
      gateway: 'simulator',
      timestamp,
      autoTriggered,
    };
  }

  // 2. NATIVE DEVICE SMS
  if (gatewayConfig.gatewayType === 'native_device') {
    if (typeof window !== 'undefined') {
      const smsUri = `sms:${employee.phone}?body=${encodeURIComponent(message)}`;
      // Open native SMS handler
      window.location.href = smsUri;
    }
    return {
      id: logId,
      employeeId: employee.id,
      employeeName: employee.name,
      phone: employee.phone,
      message,
      status: 'sent',
      gateway: 'native_device',
      timestamp,
      autoTriggered,
    };
  }

  // 3. TWILIO API GATEWAY
  if (gatewayConfig.gatewayType === 'twilio') {
    if (!gatewayConfig.twilioSid || !gatewayConfig.twilioToken || !gatewayConfig.twilioFromNumber) {
      return {
        id: logId,
        employeeId: employee.id,
        employeeName: employee.name,
        phone: employee.phone,
        message,
        status: 'failed',
        gateway: 'twilio',
        timestamp,
        errorMessage: 'بيانات Twilio غير مكتملة (Account SID أو Auth Token أو From Number)',
        autoTriggered,
      };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('To', employee.phone);
      formData.append('From', gatewayConfig.twilioFromNumber);
      formData.append('Body', message);

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${gatewayConfig.twilioSid}/Messages.json`;
      const authHeader = 'Basic ' + btoa(`${gatewayConfig.twilioSid}:${gatewayConfig.twilioToken}`);

      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorData.message || `خطأ من Twilio: ${res.status}`);
      }

      return {
        id: logId,
        employeeId: employee.id,
        employeeName: employee.name,
        phone: employee.phone,
        message,
        status: 'delivered',
        gateway: 'twilio',
        timestamp,
        autoTriggered,
      };
    } catch (err: any) {
      return {
        id: logId,
        employeeId: employee.id,
        employeeName: employee.name,
        phone: employee.phone,
        message,
        status: 'failed',
        gateway: 'twilio',
        timestamp,
        errorMessage: err.message || 'فشل الاتصال ببوابة Twilio',
        autoTriggered,
      };
    }
  }

  // 4. CUSTOM WEBHOOK / HTTP SMS GATEWAY
  if (gatewayConfig.gatewayType === 'custom_webhook') {
    if (!gatewayConfig.webhookUrl) {
      return {
        id: logId,
        employeeId: employee.id,
        employeeName: employee.name,
        phone: employee.phone,
        message,
        status: 'failed',
        gateway: 'custom_webhook',
        timestamp,
        errorMessage: 'رابط Webhook غير محدد في الإعدادات',
        autoTriggered,
      };
    }

    try {
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (gatewayConfig.webhookHeaders) {
        try {
          headers = JSON.parse(gatewayConfig.webhookHeaders);
        } catch {
          // ignore parsing error
        }
      }

      const bodyPayload = (gatewayConfig.webhookBodyTemplate || '')
        .replace(/\{phone\}/g, employee.phone)
        .replace(/\{message\}/g, message.replace(/"/g, '\\"'))
        .replace(/\{sender\}/g, gatewayConfig.senderName)
        .replace(/\{name\}/g, employee.name);

      const res = await fetch(gatewayConfig.webhookUrl, {
        method: gatewayConfig.webhookMethod || 'POST',
        headers,
        body: gatewayConfig.webhookMethod !== 'GET' ? bodyPayload : undefined,
      });

      if (!res.ok) {
        throw new Error(`رد السيرفر بحالة خطأ: ${res.status}`);
      }

      return {
        id: logId,
        employeeId: employee.id,
        employeeName: employee.name,
        phone: employee.phone,
        message,
        status: 'delivered',
        gateway: 'custom_webhook',
        timestamp,
        autoTriggered,
      };
    } catch (err: any) {
      return {
        id: logId,
        employeeId: employee.id,
        employeeName: employee.name,
        phone: employee.phone,
        message,
        status: 'failed',
        gateway: 'custom_webhook',
        timestamp,
        errorMessage: err.message || 'فشل إرسال Webhook',
        autoTriggered,
      };
    }
  }

  // Fallback
  return {
    id: logId,
    employeeId: employee.id,
    employeeName: employee.name,
    phone: employee.phone,
    message,
    status: 'delivered',
    gateway: 'simulator',
    timestamp,
    autoTriggered,
  };
}

// Check cooldown: whether SMS was sent recently within cooldownHours
export function isWithinCooldown(
  lastSentAt: string | undefined,
  cooldownHours: number
): boolean {
  if (!lastSentAt) return false;
  const lastTime = new Date(lastSentAt).getTime();
  const now = Date.now();
  const hoursDiff = (now - lastTime) / (1000 * 60 * 60);
  return hoursDiff < cooldownHours;
}
