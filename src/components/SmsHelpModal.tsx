import React from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Smartphone,
  MessageSquare,
  Globe,
  Zap,
  PhoneCall,
  Key,
} from 'lucide-react';
import { SmsGatewayType } from '../types';

interface SmsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGateway: SmsGatewayType;
  onSelectGateway: (gw: SmsGatewayType) => void;
}

export const SmsHelpModal: React.FC<SmsHelpModalProps> = ({
  isOpen,
  onClose,
  currentGateway,
  onSelectGateway,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-5 top-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              لماذا لا تصل الرسائل إلى الهواتف؟ وكيفية تفعيلها فوراً
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              شرح السبب والحلول الفورية لإيصال التذكيرات للموظفين الـ 67
            </p>
          </div>
        </div>

        {/* Reason Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 mb-6">
          <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <span>السبب:</span>
            <span className="font-normal text-slate-200">
              النظام مضبوط افتراضياً على وضع{' '}
              <strong className="text-blue-400">«المحاكي الداخلي التجريبي (Simulator)»</strong>
            </span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            المحاكي مصمم لاختبار فحص الشيت والتأكد من أرقام الموظفين والتصنيف بدون خصم رصيد مالي من شبكات المحمول. لإرسال رسائل حقيقية تصل إلى شاشات هواتف الموظفين (فودافون، أورانج، اتصالات، وي)، اختر إحدى الطرق العملية التالية:
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            اختر الطريقة الأنسب لك لتفعيل الإرسال الحقيقي الآن:
          </h4>

          {/* Solution 1: WhatsApp Direct */}
          <div
            onClick={() => {
              onSelectGateway('whatsapp');
              onClose();
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              currentGateway === 'whatsapp'
                ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950/20'
                : 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/50 text-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>1. الإرسال عبر واتساب (WhatsApp Direct)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                      مجاني ومضمون 100%
                    </span>
                  </h5>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    يفتح محادثة واتساب الرسمية برقم الموظف ونص التذكير بالشيفت جاهزاً. مجاني تماماً ولا يحتاج لاشتراك أو بوابة SMS، ويصل فوراً للموظفين في مصر.
                  </p>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer">
                {currentGateway === 'whatsapp' ? 'مفعل حالياً ✓' : 'تفعيل واتساب'}
              </button>
            </div>
          </div>

          {/* Solution 2: Native Device SMS */}
          <div
            onClick={() => {
              onSelectGateway('native_device');
              onClose();
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              currentGateway === 'native_device'
                ? 'bg-blue-950/40 border-blue-500 text-white shadow-lg shadow-blue-950/20'
                : 'bg-slate-950/70 border-slate-800 hover:border-blue-500/50 text-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>2. تطبيق رسائل الموبايل (Native Phone SMS)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                      من شريحة هاتفك
                    </span>
                  </h5>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    عند الضغط على إرسال، يفتح تطبيق الرسائل في هاتفك برقم الموظف ورسالة التذكير كاملة لترسلها مباشرة من باقة رسائل شريحتك العادية.
                  </p>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 cursor-pointer">
                {currentGateway === 'native_device' ? 'مفعل حالياً ✓' : 'تفعيل رسائل الموبايل'}
              </button>
            </div>
          </div>

          {/* Solution 3: Official SMS Gateway (Taqnyat / SMS Misr / Twilio) */}
          <div
            onClick={() => {
              onSelectGateway('custom_webhook');
              onClose();
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              currentGateway === 'custom_webhook' || currentGateway === 'twilio'
                ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-950/20'
                : 'bg-slate-950/70 border-slate-800 hover:border-indigo-500/50 text-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>3. بوابات الـ SMS المجمعة (SMS Misr / Taqnyat / Twilio)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                      إرسال آلي بالجملة لجميع الهواتف
                    </span>
                  </h5>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    إذا كان لديك حساب في أي شركة رسائل SMS (مثل إس إم إس مصر، تقنيات، Twilio، أو فودافون بيزنس)، يمكنك إدخال مفتاح الـ API ليرسل النظام الـ 67 رسالة تلقائياً بنقرة واحدة.
                  </p>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 cursor-pointer">
                ضبط البوابة
              </button>
            </div>
          </div>

          {/* Solution 4: Android Free Gateway */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>فكرة ذكية مجانية: تحويل أي هاتف أندرويد لبوابة إرسال SMS تلقائية</span>
            </p>
            <p className="leading-relaxed">
              يمكنك تثبيت تطبيق أندرويد مجاني (مثل SMS Gateway) على أي هاتف متصل بشريحة بها باقة رسائل، وربط الرابط في النظام، ليرسل النظام رسائل SMS حقيقية تلقائياً من الهاتف دون الحاجة لشراء باقات SMS مدفوعة!
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            يمكنك تغيير بوابة الإرسال في أي وقت من تبويب «قالب الرسالة وبوابة SMS»
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
