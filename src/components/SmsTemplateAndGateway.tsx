import React, { useState } from 'react';
import {
  MessageSquare,
  Smartphone,
  Server,
  Key,
  Globe,
  Check,
  Send,
  HelpCircle,
  Copy,
  Info,
} from 'lucide-react';
import {
  SmsGatewayConfig,
  SmsGatewayType,
  SmsTemplateConfig,
  Employee,
} from '../types';
import {
  calculateSmsSegments,
  renderSmsMessage,
} from '../services/smsService';

interface SmsTemplateAndGatewayProps {
  templateConfig: SmsTemplateConfig;
  onUpdateTemplate: (cfg: SmsTemplateConfig) => void;
  gatewayConfig: SmsGatewayConfig;
  onUpdateGateway: (cfg: SmsGatewayConfig) => void;
  sampleEmployee?: Employee;
}

export const SmsTemplateAndGateway: React.FC<SmsTemplateAndGatewayProps> = ({
  templateConfig,
  onUpdateTemplate,
  gatewayConfig,
  onUpdateGateway,
  sampleEmployee,
}) => {
  const [activeTab, setActiveTab] = useState<'template' | 'gateway'>('template');
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const mockEmployee: Employee = sampleEmployee || {
    id: 'preview-1',
    name: 'أحمد محمود',
    phone: '+201012345678',
    shiftStatus: 'unbooked',
    shiftDate: '2026-09-28',
    shiftTime: 'صباحي (08:00 - 16:00)',
    department: 'خدمة العملاء',
  };

  const currentTemplate =
    templateConfig.language === 'ar'
      ? templateConfig.templateArabic
      : templateConfig.templateEnglish;

  const renderedPreview = renderSmsMessage(
    currentTemplate,
    mockEmployee,
    templateConfig.companyName,
    templateConfig.bookingUrl
  );

  const stats = calculateSmsSegments(renderedPreview);

  const insertVariable = (varName: string) => {
    const isAr = templateConfig.language === 'ar';
    const current = isAr ? templateConfig.templateArabic : templateConfig.templateEnglish;
    const updated = current + ' ' + varName;
    if (isAr) {
      onUpdateTemplate({ ...templateConfig, templateArabic: updated });
    } else {
      onUpdateTemplate({ ...templateConfig, templateEnglish: updated });
    }
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const variables = [
    { tag: '{name}', label: 'اسم الموظف' },
    { tag: '{date}', label: 'تاريخ الشيفت' },
    { tag: '{shift}', label: 'فترة الوردية' },
    { tag: '{booking_link}', label: 'رابط الحجز' },
    { tag: '{company_name}', label: 'اسم الشركة/القسم' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('template')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'template'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>نص وقالب رسالة SMS التذكيرية</span>
        </button>

        <button
          onClick={() => setActiveTab('gateway')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'gateway'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>بوابة وتكامل الإرسال (SMS Gateway)</span>
        </button>
      </div>

      {activeTab === 'template' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Template Editor (8 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">محرر نص رسالة التذكير</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  خصص النص الذي يصل للموظف تلقائياً على هاتفه عبر SMS
                </p>
              </div>

              {/* Language Switch */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => onUpdateTemplate({ ...templateConfig, language: 'ar' })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    templateConfig.language === 'ar'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  عربي
                </button>
                <button
                  onClick={() => onUpdateTemplate({ ...templateConfig, language: 'en' })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    templateConfig.language === 'en'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Quick Variables Insert Chips */}
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-2">
                انقر لإدراج المتغيرات الديناميكية تلقائياً:
              </p>
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => insertVariable(v.tag)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-blue-950/60 border border-slate-800 hover:border-blue-500/50 text-blue-400 text-xs font-mono transition-all cursor-pointer"
                  >
                    <span>{v.tag}</span>
                    <span className="text-[10px] text-slate-400 font-sans">({v.label})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div>
              <textarea
                rows={5}
                dir={templateConfig.language === 'ar' ? 'rtl' : 'ltr'}
                value={
                  templateConfig.language === 'ar'
                    ? templateConfig.templateArabic
                    : templateConfig.templateEnglish
                }
                onChange={(e) => {
                  if (templateConfig.language === 'ar') {
                    onUpdateTemplate({ ...templateConfig, templateArabic: e.target.value });
                  } else {
                    onUpdateTemplate({ ...templateConfig, templateEnglish: e.target.value });
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed font-sans"
              />

              {/* Character & Segment Counter Bar */}
              <div className="flex items-center justify-between mt-2 px-1 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span>
                    عدد الحروف:{' '}
                    <strong className="text-blue-400 font-mono">{stats.length}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    عدد الأجزاء:{' '}
                    <strong className="text-emerald-400 font-mono">{stats.segments} SMS</strong>
                  </span>
                  <span>•</span>
                  <span className="text-[11px] text-slate-500">{stats.encoding}</span>
                </div>
                <span>
                  متبقي للجزء التالي:{' '}
                  <strong className="text-amber-400 font-mono">{stats.charsRemaining}</strong> حرف
                </span>
              </div>
            </div>

            {/* Additional parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رابط بوابة حجز الشيفت (Booking URL)
                </label>
                <input
                  type="text"
                  value={templateConfig.bookingUrl}
                  onChange={(e) =>
                    onUpdateTemplate({ ...templateConfig, bookingUrl: e.target.value })
                  }
                  placeholder="https://shifts.company.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 dir-ltr text-right focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم الشركة / الإدارة المرسلة
                </label>
                <input
                  type="text"
                  value={templateConfig.companyName}
                  onChange={(e) =>
                    onUpdateTemplate({ ...templateConfig, companyName: e.target.value })
                  }
                  placeholder="إدارة العمليات والشيفتات"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

          </div>

          {/* Smartphone Mockup Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span>معاينة حية لشاشة هاتف الموظف المستلم:</span>
            </div>

            {/* Mobile Device Frame */}
            <div className="w-[300px] h-[520px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/80 relative flex flex-col overflow-hidden">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 ml-6"></div>
              </div>

              {/* Phone Screen Content */}
              <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-[34px] flex flex-col pt-8 pb-3 px-3 overflow-hidden text-right">
                
                {/* Phone Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] text-slate-400 px-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                      SMS
                    </div>
                    <span className="font-bold text-white text-xs">
                      {gatewayConfig.senderName || 'ShiftAlert'}
                    </span>
                  </div>
                  <span className="text-[10px]">الآن</span>
                </div>

                {/* SMS Chat Area */}
                <div className="flex-1 py-4 space-y-3 overflow-y-auto">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded-full bg-slate-800/60">
                      اليوم، 11:00 ص
                    </span>
                  </div>

                  {/* SMS Bubble */}
                  <div className="bg-gradient-to-tr from-blue-600 to-blue-500 text-white p-3.5 rounded-2xl rounded-tr-sm text-xs leading-relaxed shadow-lg shadow-blue-600/20 max-w-[90%]">
                    <p className="whitespace-pre-line">{renderedPreview}</p>
                    <span className="text-[9px] text-blue-200 block text-left mt-2 font-mono">
                      تم التسليم ✓✓
                    </span>
                  </div>
                </div>

                {/* Bottom Input Mock */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 px-1">
                  <div className="flex-1 bg-slate-800/80 rounded-full px-3 py-1 text-[10px] text-slate-400">
                    رسالة نصية قصيرة (SMS)...
                  </div>
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <Send className="w-3 h-3" />
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {activeTab === 'gateway' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">اختيار وتوصيل بوابة الرسائل القصيرة (SMS Gateway)</h3>
            <p className="text-xs text-slate-400 mt-1">
              اختر طريقة الإرسال المناسبة لمنشأتك (سواء عبر المحاكي المدمج للاختبار، أو حساب Twilio، أو بوابة اتصالات محلية)
            </p>
          </div>

          {/* Gateway Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Simulator */}
            <div
              onClick={() => onUpdateGateway({ ...gatewayConfig, gatewayType: 'simulator' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                gatewayConfig.gatewayType === 'simulator'
                  ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                {gatewayConfig.gatewayType === 'simulator' && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <h4 className="font-bold text-sm text-slate-100">المحاكي المدمج (Simulator)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                جاهز ومفعل فوراً للاختبار بدون أي تكلفة أو إعدادات خارجية مع شاشة محاكاة حية.
              </p>
            </div>

            {/* 2. Twilio */}
            <div
              onClick={() => onUpdateGateway({ ...gatewayConfig, gatewayType: 'twilio' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                gatewayConfig.gatewayType === 'twilio'
                  ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Key className="w-5 h-5 text-indigo-400" />
                {gatewayConfig.gatewayType === 'twilio' && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <h4 className="font-bold text-sm text-slate-100">بوابة Twilio الرسمية</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                إرسال دولي مباشر وموثوق عبر حسابك في Twilio مع تقارير التسليم الفورية.
              </p>
            </div>

            {/* 3. Custom Webhook */}
            <div
              onClick={() => onUpdateGateway({ ...gatewayConfig, gatewayType: 'custom_webhook' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                gatewayConfig.gatewayType === 'custom_webhook'
                  ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                {gatewayConfig.gatewayType === 'custom_webhook' && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <h4 className="font-bold text-sm text-slate-100">بوابة Webhook / مزود محلي</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                ربط أي بوابة رسائل محلية (Vodafone, Orange, Taqnyat, Infobip, Unifonic).
              </p>
            </div>

            {/* 4. Native Device */}
            <div
              onClick={() => onUpdateGateway({ ...gatewayConfig, gatewayType: 'native_device' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                gatewayConfig.gatewayType === 'native_device'
                  ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                {gatewayConfig.gatewayType === 'native_device' && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <h4 className="font-bold text-sm text-slate-100">تطبيق الرسائل بالجهاز</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                فتح تطبيق SMS في هاتفك أو جهازك برقم الموظف ونص الرسالة جاهز للإرسال.
              </p>
            </div>

          </div>

          {/* Sender Name */}
          <div className="max-w-md">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              اسم المرسل (Sender ID / Alpha Name)
            </label>
            <input
              type="text"
              value={gatewayConfig.senderName}
              onChange={(e) => onUpdateGateway({ ...gatewayConfig, senderName: e.target.value })}
              placeholder="ShiftAlert"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Conditional settings for Twilio */}
          {gatewayConfig.gatewayType === 'twilio' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                بيانات حساب Twilio:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Account SID</label>
                  <input
                    type="text"
                    value={gatewayConfig.twilioSid || ''}
                    onChange={(e) =>
                      onUpdateGateway({ ...gatewayConfig, twilioSid: e.target.value })
                    }
                    placeholder="ACXXXXXXXXXXXXXXXXX"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Auth Token</label>
                  <input
                    type="password"
                    value={gatewayConfig.twilioToken || ''}
                    onChange={(e) =>
                      onUpdateGateway({ ...gatewayConfig, twilioToken: e.target.value })
                    }
                    placeholder="••••••••••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">From Number / Sender ID</label>
                  <input
                    type="text"
                    value={gatewayConfig.twilioFromNumber || ''}
                    onChange={(e) =>
                      onUpdateGateway({ ...gatewayConfig, twilioFromNumber: e.target.value })
                    }
                    placeholder="+1234567890"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conditional settings for Webhook */}
          {gatewayConfig.gatewayType === 'custom_webhook' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                إعدادات Webhook للمزود الخارجي:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs text-slate-400 mb-1">API Endpoint URL</label>
                  <input
                    type="text"
                    value={gatewayConfig.webhookUrl || ''}
                    onChange={(e) =>
                      onUpdateGateway({ ...gatewayConfig, webhookUrl: e.target.value })
                    }
                    placeholder="https://api.sms-provider.com/v1/send"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 dir-ltr text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">HTTP Method</label>
                  <select
                    value={gatewayConfig.webhookMethod || 'POST'}
                    onChange={(e: any) =>
                      onUpdateGateway({ ...gatewayConfig, webhookMethod: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Payload Body Template</label>
                <input
                  type="text"
                  value={gatewayConfig.webhookBodyTemplate || ''}
                  onChange={(e) =>
                    onUpdateGateway({ ...gatewayConfig, webhookBodyTemplate: e.target.value })
                  }
                  placeholder='{"to": "{phone}", "text": "{message}", "sender": "{sender}"}'
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 dir-ltr text-right"
                />
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
