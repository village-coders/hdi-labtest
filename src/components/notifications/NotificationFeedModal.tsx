import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { NotificationLog } from '../../types/index.js';
import { Mail, CheckCircle2, AlertCircle, Clock, Send, ShieldCheck, Play } from 'lucide-react';

interface NotificationFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: NotificationLog[];
  onTriggerCronReminder: () => Promise<void>;
}

export const NotificationFeedModal: React.FC<NotificationFeedModalProps> = ({
  isOpen,
  onClose,
  logs,
  onTriggerCronReminder,
}) => {
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState('');

  const handleManualReminder = async () => {
    setIsTriggering(true);
    setTriggerMsg('');
    try {
      await onTriggerCronReminder();
      setTriggerMsg('Automated 7-day reminder scan completed! Check notification feed below.');
    } catch (e: any) {
      setTriggerMsg(e.message || 'Error triggering reminder');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Workflow Notifications & Alerts Feed"
      subtitle="Complete real-time notifications log for all 10 automated sample lifecycle triggers"
      maxWidth="880px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Top explanation strip with manual cron test trigger */}
        <div
          style={{
            padding: '14px 18px',
            background: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Automated Email Notification Engine
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Automated notifications for all 10 stages: Registration, Invoice, Payment, Dispatch, Processing, Reminders, and Certificate Delivery.
            </div>
          </div>

          <button
            onClick={handleManualReminder}
            disabled={isTriggering}
            className="btn btn-secondary btn-sm"
            title="Scan for samples >= 7 days past processing date without results"
          >
            <Play size={13} color="#2563eb" />
            {isTriggering ? 'Running Scan...' : 'Test Reminder Trigger (#9)'}
          </button>
        </div>

        {triggerMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: '#ecfdf5',
              color: '#065f46',
              fontSize: '12.5px',
            }}
          >
            ✓ {triggerMsg}
          </div>
        )}

        {/* Notifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto' }}>
          {(!logs || logs.length === 0) ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No notification logs generated in this session yet. Take actions on samples to see triggers fire!
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '14px 16px',
                  background: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 4,
                      }}
                    >
                      Trigger #{log.triggerNumber}
                    </span>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                      {log.triggerName}
                    </strong>
                    <span className="code-tag">{log.sampleCode}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: log.status === 'SENT' ? '#dcfce7' : '#e0f2fe',
                        color: log.status === 'SENT' ? '#166534' : '#0369a1',
                      }}
                    >
                      {log.status === 'SENT' ? '✓ SENT (Live Email)' : 'SIMULATED (Logged)'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: 4 }}>
                  <strong>To:</strong> <span style={{ color: '#2563eb' }}>{log.recipient}</span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#1e293b', fontWeight: 600, marginBottom: 4 }}>
                  Subject: {log.subject}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#334155',
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #f1f5f9',
                  }}
                >
                  "{log.message}"
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
