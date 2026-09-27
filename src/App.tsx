import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  Users,
  Clock,
  MessageSquare,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import {
  Employee,
  SchedulerConfig,
  SheetColumnMapping,
  SmsGatewayConfig,
  SmsLogEntry,
  SmsTemplateConfig,
} from './types';
import {
  DEFAULT_GATEWAY_CONFIG,
  DEFAULT_TEMPLATE_CONFIG,
  isWithinCooldown,
  playSmsChime,
  sendSmsToEmployee,
} from './services/smsService';
import {
  DEFAULT_SHEET_URL,
  DEFAULT_SHEET_ID,
  fetchGoogleSheetData,
  detectColumnMapping,
  rowsToEmployees,
} from './services/sheetsService';
import { initAuth } from './services/firebaseAuth';
import { Header } from './components/Header';
import { StatCards } from './components/StatCards';
import { EmployeesList } from './components/EmployeesList';
import { SchedulerTab } from './components/SchedulerTab';
import { SmsTemplateAndGateway } from './components/SmsTemplateAndGateway';
import { SmsLogsTab } from './components/SmsLogsTab';
import { GoogleSheetSettingsTab } from './components/GoogleSheetSettingsTab';
import { ConfirmBatchModal } from './components/ConfirmBatchModal';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'employees' | 'scheduler' | 'template' | 'logs' | 'sheet'>('employees');

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Sheet configuration
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem('shift_sheet_url') || DEFAULT_SHEET_URL;
  });
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<SheetColumnMapping>({
    nameCol: '',
    phoneCol: '',
    statusCol: '',
    dateCol: '',
  });
  const [sheetSource, setSheetSource] = useState<string>('demo_fallback');
  const [sourceMessage, setSourceMessage] = useState<string>('جارٍ تهيئة الاتصال بالشيت...');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Employees data
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('shift_employees_cache');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  // SMS Gateway Config
  const [gatewayConfig, setGatewayConfig] = useState<SmsGatewayConfig>(() => {
    const saved = localStorage.getItem('shift_gateway_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_GATEWAY_CONFIG;
  });

  // SMS Template Config
  const [templateConfig, setTemplateConfig] = useState<SmsTemplateConfig>(() => {
    const saved = localStorage.getItem('shift_template_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_TEMPLATE_CONFIG;
  });

  // Scheduler Config
  const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig>(() => {
    const saved = localStorage.getItem('shift_scheduler_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      isEnabled: true, // Default to true as user requested automatic sending
      intervalMinutes: 30,
      cooldownHours: 12,
      autoSyncSheet: true,
      notifyOnSend: true,
      soundEnabled: true,
    };
  });

  // Logs
  const [logs, setLogs] = useState<SmsLogEntry[]>(() => {
    const saved = localStorage.getItem('shift_sms_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Runtime states
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [batchRecipients, setBatchRecipients] = useState<Employee[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Scheduler timer in seconds
  const [nextRunSeconds, setNextRunSeconds] = useState<number>(30 * 60);
  const schedulerTimerRef = useRef<any>(null);

  // Show toast notification
  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('shift_sheet_url', sheetUrl);
  }, [sheetUrl]);

  useEffect(() => {
    localStorage.setItem('shift_employees_cache', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('shift_gateway_config', JSON.stringify(gatewayConfig));
  }, [gatewayConfig]);

  useEffect(() => {
    localStorage.setItem('shift_template_config', JSON.stringify(templateConfig));
  }, [templateConfig]);

  useEffect(() => {
    localStorage.setItem('shift_scheduler_config', JSON.stringify(schedulerConfig));
  }, [schedulerConfig]);

  useEffect(() => {
    localStorage.setItem('shift_sms_logs', JSON.stringify(logs));
  }, [logs]);

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Load Sheet Data
  const loadSheet = useCallback(
    async (showFeedback = false) => {
      setIsRefreshing(true);
      try {
        const result = await fetchGoogleSheetData(sheetUrl);
        setHeaders(result.headers);
        setRawRows(result.rawRows);
        setSheetSource(result.source);
        setSourceMessage(result.message);

        const newMapping = detectColumnMapping(result.headers);
        setMapping(newMapping);

        // Merge with existing employees to preserve SMS sent timestamps
        setEmployees((prev) => {
          if (prev.length === 0) return result.employees;
          return result.employees.map((newEmp) => {
            const existing = prev.find(
              (p) => p.name === newEmp.name || (p.phone && p.phone === newEmp.phone)
            );
            if (existing) {
              return {
                ...newEmp,
                lastSmsSentAt: existing.lastSmsSentAt,
                smsCount: existing.smsCount,
              };
            }
            return newEmp;
          });
        });

        if (showFeedback) {
          showToast(`تم تحديث بيانات الشيت بنجاح (${result.employees.length} موظف)`, 'success');
        }
      } catch (err: any) {
        console.error('Failed to load sheet:', err);
        setSourceMessage('تعذر جلب الشيت. تأكد من صحة الرابط أو قم بتسجيل الدخول.');
        if (showFeedback) {
          showToast('فشل في جلب بيانات الشيت', 'error');
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [sheetUrl, showToast]
  );

  // Initial Sheet Load on start
  useEffect(() => {
    loadSheet(false);
  }, [loadSheet]);

  // Execute Automated Run
  const executeScheduledRun = useCallback(async () => {
    if (schedulerConfig.autoSyncSheet) {
      await loadSheet(false);
    }

    // Get unbooked employees who are not in cooldown
    setEmployees((currentEmployees) => {
      const candidates = currentEmployees.filter((emp) => {
        if (emp.shiftStatus !== 'unbooked') return false;
        // Check cooldown
        if (isWithinCooldown(emp.lastSmsSentAt, schedulerConfig.cooldownHours)) {
          return false;
        }
        return true;
      });

      if (candidates.length === 0) {
        showToast('فحص تلقائي: جميع الموظفين حجزوا أو استلموا تذكيراً حديثاً', 'info');
        return currentEmployees;
      }

      // Dispatch SMS to each candidate asynchronously
      (async () => {
        let sentCount = 0;
        const newLogs: SmsLogEntry[] = [];
        const updatedEmployees = [...currentEmployees];

        for (const candidate of candidates) {
          try {
            const logEntry = await sendSmsToEmployee(candidate, gatewayConfig, templateConfig, true);
            newLogs.unshift(logEntry);

            if (logEntry.status === 'delivered' || logEntry.status === 'sent') {
              sentCount++;
              const idx = updatedEmployees.findIndex((e) => e.id === candidate.id);
              if (idx !== -1) {
                updatedEmployees[idx] = {
                  ...updatedEmployees[idx],
                  lastSmsSentAt: new Date().toISOString(),
                  smsCount: (updatedEmployees[idx].smsCount || 0) + 1,
                };
              }
            }
          } catch (err) {
            console.error('Auto SMS dispatch error:', err);
          }
        }

        if (sentCount > 0) {
          playSmsChime(schedulerConfig.soundEnabled);
          showToast(`⚡ إرسال تلقائي: تم إرسال رسائل SMS لـ (${sentCount}) موظف لم يحجزوا`, 'success');
          setLogs((prev) => [...newLogs, ...prev]);
          setEmployees(updatedEmployees);
        }
      })();

      return currentEmployees;
    });

    // Reset countdown
    setNextRunSeconds(schedulerConfig.intervalMinutes * 60);
  }, [schedulerConfig, gatewayConfig, templateConfig, loadSheet, showToast]);

  // Scheduler Background Loop
  useEffect(() => {
    if (!schedulerConfig.isEnabled) {
      if (schedulerTimerRef.current) clearInterval(schedulerTimerRef.current);
      return;
    }

    schedulerTimerRef.current = setInterval(() => {
      setNextRunSeconds((prev) => {
        if (prev <= 1) {
          // Timer expired, run dispatch!
          executeScheduledRun();
          return schedulerConfig.intervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (schedulerTimerRef.current) clearInterval(schedulerTimerRef.current);
    };
  }, [schedulerConfig.isEnabled, schedulerConfig.intervalMinutes, executeScheduledRun]);

  // Single SMS dispatch handler
  const handleSendSmsSingle = async (employee: Employee) => {
    setSendingId(employee.id);
    try {
      const logEntry = await sendSmsToEmployee(employee, gatewayConfig, templateConfig, false);
      setLogs((prev) => [logEntry, ...prev]);

      if (logEntry.status === 'delivered' || logEntry.status === 'sent') {
        playSmsChime(schedulerConfig.soundEnabled);
        showToast(`تم إرسال SMS بنجاح إلى ${employee.name}`, 'success');

        setEmployees((prev) =>
          prev.map((e) =>
            e.id === employee.id
              ? {
                  ...e,
                  lastSmsSentAt: new Date().toISOString(),
                  smsCount: (e.smsCount || 0) + 1,
                }
              : e
          )
        );
      } else {
        showToast(`فشل الإرسال: ${logEntry.errorMessage || 'حدث خطأ'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطأ في الإرسال: ${err.message}`, 'error');
    } finally {
      setSendingId(null);
    }
  };

  const handleOpenBatchConfirm = (targetList?: Employee[]) => {
    const list =
      targetList && targetList.length > 0
        ? targetList
        : employees.filter((e) => e.shiftStatus === 'unbooked');
    setBatchRecipients(list);
    setShowBatchConfirm(true);
  };

  // Batch SMS dispatch to unbooked employees
  const handleConfirmBatchSend = async () => {
    const targets =
      batchRecipients.length > 0
        ? batchRecipients
        : employees.filter((e) => e.shiftStatus === 'unbooked');
    if (targets.length === 0) return;

    setIsBatchSending(true);
    setShowBatchConfirm(false);

    let deliveredCount = 0;
    const newLogs: SmsLogEntry[] = [];
    const updatedEmployees = [...employees];

    for (const emp of targets) {
      try {
        const log = await sendSmsToEmployee(emp, gatewayConfig, templateConfig, false);
        newLogs.unshift(log);

        if (log.status === 'delivered' || log.status === 'sent') {
          deliveredCount++;
          const idx = updatedEmployees.findIndex((e) => e.id === emp.id);
          if (idx !== -1) {
            updatedEmployees[idx] = {
              ...updatedEmployees[idx],
              lastSmsSentAt: new Date().toISOString(),
              smsCount: (updatedEmployees[idx].smsCount || 0) + 1,
            };
          }
        }
      } catch (err) {
        console.error('Batch send item error:', err);
      }
    }

    setLogs((prev) => [...newLogs, ...prev]);
    setEmployees(updatedEmployees);
    setIsBatchSending(false);

    if (deliveredCount > 0) {
      playSmsChime(schedulerConfig.soundEnabled);
      showToast(`تم إرسال ${deliveredCount} رسالة SMS بنجاح!`, 'success');
    } else {
      showToast('تعذر إرسال الرسائل. تحقق من إعدادات بوابة SMS.', 'error');
    }
  };

  // Retry a failed SMS from logs
  const handleRetrySms = async (failedLog: SmsLogEntry) => {
    const emp = employees.find((e) => e.id === failedLog.employeeId) || {
      id: failedLog.employeeId,
      name: failedLog.employeeName,
      phone: failedLog.phone,
      shiftStatus: 'unbooked',
    };
    await handleSendSmsSingle(emp);
  };

  // Update employee from table
  const handleUpdateEmployee = (updated: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    showToast(`تم تحديث بيانات ${updated.name}`, 'info');
  };

  // Add new employee
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees((prev) => [newEmp, ...prev]);
    showToast(`تمت إضافة الموظف ${newEmp.name}`, 'success');
  };

  // Update column mapping and recompute
  const handleUpdateMapping = (newMap: SheetColumnMapping) => {
    setMapping(newMap);
    if (headers.length > 0 && rawRows.length > 0) {
      const recalculated = rowsToEmployees(headers, rawRows, newMap);
      setEmployees(recalculated);
      showToast('تمت إعادة تعيين أعمدة الشيت وتحديث القائمة', 'info');
    }
  };

  // Unbooked employees count
  const unbookedEmployees = employees.filter((e) => e.shiftStatus === 'unbooked');

  // SMS sent today count
  const todayStr = new Date().toISOString().split('T')[0];
  const smsSentTodayCount = logs.filter(
    (l) => (l.status === 'delivered' || l.status === 'sent') && l.timestamp.startsWith(todayStr)
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-2.5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-blue-950/90 border-blue-500/50 text-blue-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          ) : (
            <Zap className="w-5 h-5 text-blue-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <Header
        user={user}
        setUser={setUser}
        token={token}
        setToken={setToken}
        isAutoEnabled={schedulerConfig.isEnabled}
        setIsAutoEnabled={(val) => setSchedulerConfig({ ...schedulerConfig, isEnabled: val })}
        nextRunSeconds={nextRunSeconds}
        soundEnabled={schedulerConfig.soundEnabled}
        setSoundEnabled={(val) => setSchedulerConfig({ ...schedulerConfig, soundEnabled: val })}
        onRefreshSheet={() => loadSheet(true)}
        isRefreshing={isRefreshing}
        sheetSource={sheetSource}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Stat Cards Overview */}
        <StatCards
          employees={employees}
          smsSentTodayCount={smsSentTodayCount}
          isAutoEnabled={schedulerConfig.isEnabled}
          nextRunSeconds={nextRunSeconds}
          onSendToAllUnbooked={() => handleOpenBatchConfirm()}
          onOpenSchedulerTab={() => setActiveTab('scheduler')}
        />

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'employees'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الموظفون والشيفتات</span>
            {unbookedEmployees.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-rose-500/80 text-white font-mono">
                {unbookedEmployees.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('scheduler')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'scheduler'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>الجدولة والإرسال التلقائي</span>
            {schedulerConfig.isEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'template'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>قالب الرسالة وبوابة SMS</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>سجل الرسائل والتقارير</span>
            {logs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300 font-mono">
                {logs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sheet')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'sheet'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ربط شيت جوجل ({DEFAULT_SHEET_ID.slice(0, 8)}...)</span>
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'employees' && (
          <EmployeesList
            employees={employees}
            onSendSmsSingle={handleSendSmsSingle}
            onSendToAllUnbooked={handleOpenBatchConfirm}
            onUpdateEmployee={handleUpdateEmployee}
            onAddEmployee={handleAddEmployee}
            sendingId={sendingId}
          />
        )}

        {activeTab === 'scheduler' && (
          <SchedulerTab
            config={schedulerConfig}
            onUpdateConfig={setSchedulerConfig}
            nextRunSeconds={nextRunSeconds}
            onTriggerManualRun={executeScheduledRun}
            isRunningNow={isBatchSending}
            unbookedCount={unbookedEmployees.length}
          />
        )}

        {activeTab === 'template' && (
          <SmsTemplateAndGateway
            templateConfig={templateConfig}
            onUpdateTemplate={setTemplateConfig}
            gatewayConfig={gatewayConfig}
            onUpdateGateway={setGatewayConfig}
            sampleEmployee={unbookedEmployees[0]}
          />
        )}

        {activeTab === 'logs' && (
          <SmsLogsTab
            logs={logs}
            onRetrySms={handleRetrySms}
            onClearLogs={() => setLogs([])}
          />
        )}

        {activeTab === 'sheet' && (
          <GoogleSheetSettingsTab
            sheetUrl={sheetUrl}
            onUpdateSheetUrl={setSheetUrl}
            onRefreshData={() => loadSheet(true)}
            isRefreshing={isRefreshing}
            user={user}
            setUser={setUser}
            setToken={setToken}
            headers={headers}
            rawRows={rawRows}
            mapping={mapping}
            onUpdateMapping={handleUpdateMapping}
            sheetSource={sheetSource}
            sourceMessage={sourceMessage}
          />
        )}

      </main>

      {/* Confirmation Modal for Batch SMS Sending */}
      <ConfirmBatchModal
        isOpen={showBatchConfirm}
        onClose={() => setShowBatchConfirm(false)}
        onConfirm={handleConfirmBatchSend}
        recipients={batchRecipients.length > 0 ? batchRecipients : unbookedEmployees}
        gatewayConfig={gatewayConfig}
        templateConfig={templateConfig}
        isSending={isBatchSending}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <p>ShiftSMS • نظام التذكير التلقائي بالشيفتات عبر الرسائل القصيرة • متصل بـ Google Sheets</p>
      </footer>

    </div>
  );
}
