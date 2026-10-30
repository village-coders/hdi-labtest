import React from 'react';
import { Sample, WorkflowStatusType } from '../../types/index.js';
import { Modal } from '../common/Modal.js';
import { StatusBadge } from '../common/StatusBadge.js';
import {
  CheckCircle2,
  Clock,
  Circle,
  Truck,
  FlaskConical,
  FileCheck,
  Receipt,
  ShieldCheck,
  Building2,
  Calendar,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext.js';

interface WorkflowTrackerModalProps {
  sample: Sample | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullDetail?: (sample: Sample) => void;
}

interface StepDefinition {
  id: number;
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  role: string;
}

export const WorkflowTrackerModal: React.FC<WorkflowTrackerModalProps> = ({
  sample,
  isOpen,
  onClose,
  onOpenFullDetail,
}) => {
  const { user } = useAuth();
  const isLabUser = user?.role === 'LAB_USER';

  if (!sample) return null;

  const isRejected = sample.workflowStatus === 'Rejected';

  const steps: StepDefinition[] = isRejected
    ? [
        {
          id: 1,
          key: 'Registered',
          title: 'Sample Received & Registered',
          subtitle: `Registered on ${new Date(sample.createdAt).toLocaleDateString()} by ${sample.sentBy || 'Registry'}`,
          icon: FlaskConical,
          role: 'Registry Desk',
        },
        {
          id: 2,
          key: 'Sent to Lab',
          title: isLabUser ? 'Sample Received' : 'Sent to Lab',
          subtitle: `Dispatched to ${sample.receivingLabName || 'partner laboratory'}`,
          icon: Truck,
          role: isLabUser ? 'Laboratory Intake' : 'Registry & Courier',
        },
        {
          id: 3,
          key: 'Rejected',
          title: 'Sample Rejected',
          subtitle: `Reason: "${sample.rejectionReason || 'Sample rejected during intake inspection.'}" (By ${sample.rejectedBy || sample.receivingLabName || 'Assigned Laboratory'})`,
          icon: AlertCircle,
          role: 'Intake Inspection',
        },
        {
          id: 4,
          key: 'Resolution',
          title: 'Administrative Review & Replacement Batch',
          subtitle: 'Client company notified. Pending client resubmission of replacement batch or dossier cancellation.',
          icon: ShieldCheck,
          role: 'Registry & Client Company',
        },
      ]
    : [
        {
          id: 1,
          key: 'Registered',
          title: 'Sample Received & Registered',
          subtitle: 'Sample logged, physical packaging checked & coded in registry',
          icon: FlaskConical,
          role: 'Registry Desk',
        },
        {
          id: 2,
          key: 'Sent to Lab',
          title: isLabUser ? 'Sample Received' : 'Sent to Lab',
          subtitle: isLabUser
            ? `Intake recorded at ${sample.receivingLabName || 'laboratory'} facility`
            : `Dispatched to ${sample.receivingLabName || 'partner laboratory'}`,
          icon: Truck,
          role: isLabUser ? 'Laboratory Intake' : 'Registry & Courier',
        },
        {
          id: 3,
          key: 'In Processing',
          title: 'Lab Testing & Analysis',
          subtitle: 'Undergoing physicochemical & microbial analysis in lab',
          icon: FlaskConical,
          role: sample.receivingLabName || 'Assigned Lab',
        },
        {
          id: 4,
          key: 'Invoiced',
          title: isLabUser ? 'Invoice Sent & Confirmed Payment' : 'Invoice Received & Paid',
          subtitle: sample.invoiceNo
            ? (isLabUser
                ? `Invoice ${sample.invoiceNo} • ${sample.paymentConfirmedByLab ? 'Payment Confirmed' : sample.receiptNo ? 'Payment Proof Received' : 'Awaiting Payment'}`
                : `Invoice ${sample.invoiceNo} • ${sample.receiptNo ? 'Paid' : 'Awaiting Payment'}`)
            : (isLabUser ? 'Invoice generation & billing submission' : 'Invoice received & fee settlement'),
          icon: Receipt,
          role: isLabUser ? 'Laboratory Accounts' : 'Finance Officer',
        },
        {
          id: 5,
          key: 'Result Received',
          title: 'Result & Certificate of Analysis (CoA)',
          subtitle: sample.resultFileUrl
            ? 'Official Certificate of Analysis uploaded'
            : 'Awaiting CoA test report upload from laboratory',
          icon: FileCheck,
          role: 'External Lab QA',
        },
        {
          id: 6,
          key: 'Closed',
          title: 'QA Review & Final Halal Certification',
          subtitle: 'Final compliance verified and certificate delivered to client',
          icon: ShieldCheck,
          role: 'Quality Assurance & Registry',
        },
      ];

  // Helper to determine step status
  const getStepState = (stepIndex: number, currentWorkflow: WorkflowStatusType) => {
    if (currentWorkflow === 'Rejected') {
      if (stepIndex === 1 || stepIndex === 2) return 'completed';
      if (stepIndex === 3) return 'rejected';
      return 'pending';
    }

    const orderMap: Record<string, number> = {
      Received: 0,
      Registered: 1,
      'Sent to Lab': 2,
      'In Processing': 3,
      'Result Received': 5,
      Closed: 6,
      Rejected: -1,
    };

    const currentLevel = orderMap[currentWorkflow] ?? 1;

    // Condition for Invoiced step (Step 4: Invoice Sent & Paid)
    if (stepIndex === 4) {
      if (sample.paymentConfirmedByLab || sample.receiptNo || sample.resultFileUrl || sample.workflowStatus === 'Closed' || sample.workflowStatus === 'Result Received') {
        return 'completed';
      }
      if (sample.invoiceNo) return 'current';
      if (currentLevel >= 3) return 'current';
      return 'pending';
    }

    // Condition for Result & CoA step (Step 5: Certificate of Analysis)
    if (stepIndex === 5) {
      if (sample.resultFileUrl || sample.resultStatus === 'Completed' || sample.workflowStatus === 'Closed') {
        return 'completed';
      }
      if (currentWorkflow === 'Result Received' || sample.paymentConfirmedByLab) return 'current';
      return 'pending';
    }

    if (currentWorkflow === 'Closed') {
      return 'completed';
    }

    if (stepIndex < currentLevel) {
      return 'completed';
    } else if (stepIndex === currentLevel) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Workflow Process Tracking"
      subtitle={`Live lifecycle status for sample: ${sample.sampleCode}`}
      maxWidth="780px"
    >
      {/* Sample Meta Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '18px 22px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontFamily: 'monospace',
                }}
              >
                {sample.sampleCode}
              </span>
              <span style={{ fontSize: '12px', color: '#dcfce7' }}>
                Batch: {sample.batchNo || 'N/A'}
              </span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 2px 0', letterSpacing: '-0.2px' }}>
              {sample.sampleName}
            </h3>
            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
              Company: <strong>{sample.companyName}</strong>
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
              Assigned Partner Lab
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              {sample.receivingLabName}
            </div>
          </div>
        </div>

        {/* Current status bar */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Current Stage:</span>
            <span
              style={{
                background: '#ffffff',
                color: '#0d5c2a',
                padding: '3px 10px',
                borderRadius: 99,
                fontWeight: 800,
                fontSize: '11.5px',
              }}
            >
              {sample.workflowStatus}
            </span>
          </div>

        </div>
      </div>

      {/* Stepper Timeline */}
      <div style={{ padding: '4px 8px 16px 8px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
          Workflow Process Steps
        </h4>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {steps.map((step, idx) => {
            const state = getStepState(step.id, sample.workflowStatus);
            const isCompleted = state === 'completed';
            const isCurrent = state === 'current';
            const isPending = state === 'pending';
            const isRejected = state === 'rejected';

            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  position: 'relative',
                }}
              >
                {/* Connecting line to next step */}
                {idx < steps.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 17,
                      top: 36,
                      bottom: -16,
                      width: 2,
                      background: isCompleted ? '#16a34a' : '#e5e7eb',
                      zIndex: 1,
                    }}
                  />
                )}

                {/* Step indicator circle */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    zIndex: 2,
                    background: isCompleted
                      ? '#16a34a'
                      : isCurrent
                      ? '#0f172a'
                      : isRejected
                      ? '#ef4444'
                      : '#f3f4f6',
                    color: isCompleted || isCurrent || isRejected ? '#ffffff' : '#9ca3af',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(15, 23, 42, 0.2)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={18} />
                  ) : isCurrent ? (
                    <StepIcon size={18} />
                  ) : isRejected ? (
                    <AlertCircle size={18} />
                  ) : (
                    <Circle size={14} />
                  )}
                </div>

                {/* Step Content Card */}
                <div
                  style={{
                    flex: 1,
                    background: isCurrent ? '#f8fafc' : '#ffffff',
                    border: isCurrent
                      ? '1px solid #cbd5e1'
                      : isCompleted
                      ? '1px solid #dcfce7'
                      : '1px solid #f3f4f6',
                    borderRadius: 10,
                    padding: '12px 16px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: isCurrent ? '#0f172a' : '#1f2937' }}>
                        {step.title}
                      </span>
                      {isCurrent && (
                        <span
                          style={{
                            background: '#0f172a',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 7px',
                            borderRadius: 99,
                            textTransform: 'uppercase',
                          }}
                        >
                          In Progress
                        </span>
                      )}
                      {isCompleted && (
                        <span
                          style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 99,
                          }}
                        >
                          Done
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>
                      {step.role}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: '#4b5563', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                    {step.subtitle}
                  </p>

                  {/* Specific Action Attachments in Steps */}
                  {step.id === 4 && (sample.invoiceNo || sample.receiptNo) && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {sample.invoiceNo && (
                        <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                          Invoice: {sample.invoiceNo}
                        </span>
                      )}
                      {sample.receiptNo && (
                        <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                          Receipt: {sample.receiptNo}
                        </span>
                      )}
                    </div>
                  )}

                  {step.id === 5 && sample.resultFileUrl && (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={sample.resultFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '11.5px', padding: '4px 10px', color: '#0f172a', borderColor: '#cbd5e1' }}
                      >
                        <ExternalLink size={12} /> View Certificate of Analysis (CoA)
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status History Logs */}
      {sample.statusHistory && sample.statusHistory.length > 0 && (
        <div style={{ marginTop: 12, padding: '14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <h5 style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
            Audit Trail &amp; Transition History
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sample.statusHistory.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b' }}>
                <div>
                  <strong style={{ color: '#0f172a' }}>{h.status}</strong> — {h.changedBy || 'System'}: <em>{h.note || 'Status updated'}</em>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                  {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Footer */}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
        <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
          Close Tracker
        </button>

        {onOpenFullDetail && (
          <button
            onClick={() => {
              onClose();
              onOpenFullDetail(sample);
            }}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '12px', background: '#0f172a' }}
          >
            Open Full Details &amp; Actions <ArrowRight size={13} />
          </button>
        )}
      </div>
    </Modal>
  );
};
