import React from 'react';
import { Send, AlertTriangle, X, CheckCircle, Users } from 'lucide-react';
import { Employee, SmsGatewayConfig, SmsTemplateConfig } from '../types';
import { renderSmsMessage } from '../services/smsService';

interface ConfirmBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipients: Employee[];
  gatewayConfig: SmsGatewayConfig;
  templateConfig: SmsTemplateConfig;
  isSending: boolean;
}

export const ConfirmBatchModal: React.FC<ConfirmBatchModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recipients,
  gatewayConfig,
  templateConfig,
  isSending,
}) => {
  if (!isOpen) return null;

  const sampleRecipient = recipients[0];
  const template =
    templateConfig.language === 'ar'
      ? templateConfig.templateArabic
      : templateConfig.templateEnglish;

  const samplePreview = sampleRecipient
    ? renderSmsMessage(
        template,
        sampleRecipient,
        templateConfig.companyName,
        templateConfig.bookingUrl
      )
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-right">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSending}
          className="absolute left-5 top-5 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">تأكيد إرسال رسائل SMS جماعية</h3>
            <p className="text-xs text-rose-400 font-semibold">
              سيتم إرسال تذكيرات الحجز لـ ({recipients.length}) موظف لم يحجزوا شيفتاتهم
            </p>
          </div>
        </div>

        {/* Recipients List Preview */}
        <div className="my-4 p-3 rounded-2xl bg-slate-950 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>قائمة المستلمين ({recipients.length} موظف):</span>
          </p>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {recipients.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/80 border border-slate-800/80"
              >
                <span className="font-semibold text-slate-200">{emp.name}</span>
                <span className="font-mono text-slate-400 dir-ltr text-right">{emp.phone}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Message Preview */}
        <div className="mb-6 p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-xs">
          <p className="font-semibold text-blue-400 mb-1">معاينة الرسالة للموظف الأول:</p>
          <p className="text-slate-200 leading-relaxed font-sans">{samplePreview}</p>
          <div className="mt-2 pt-2 border-t border-blue-500/20 flex items-center justify-between text-[11px] text-slate-400">
            <span>البوابة المختارة: <strong className="text-white">{gatewayConfig.gatewayType}</strong></span>
            <span>اسم المرسل: <strong className="text-white">{gatewayConfig.senderName}</strong></span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${isSending ? 'animate-bounce' : ''}`} />
            <span>{isSending ? 'جارٍ الإرسال الآن...' : `تأكيد وإرسال لـ ${recipients.length} موظف`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
