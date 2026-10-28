import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal.js';
import { Sample, Comment } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { ThreadedChat } from '../chat/ThreadedChat.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  FileText,
  DollarSign,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Truck,
  Upload,
  Clock,
  Award,
  CreditCard,
  Eye,
  ZoomIn,
  X,
  Package,
  Calendar,
  Building2,
  FlaskConical,
  MessageSquare,
  History,
  AlertCircle,
  ShieldCheck,
  Check,
  Receipt,
  Bell,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  Trash2,
} from 'lucide-react';

interface SampleDetailModalProps {
  sample: Sample | null;
  isOpen: boolean;
  onClose: () => void;
  onSampleUpdated: (updated: Sample) => void;
  initialTab?: 'details' | 'actions' | 'chat';
}

type ActionType =
  | 'SEND_INVOICE'
  | 'CONFIRM_PAYMENT'
  | 'ISSUE_CERTIFICATE'
  | 'ACCEPT_SAMPLE'
  | 'DISPATCH_SAMPLE'
  | 'ACKNOWLEDGE_INVOICE'
  | 'SEND_PAYMENT'
  | 'REJECT_SAMPLE'
  | 'SEND_TAT_NOTICE'
  | 'CANNOT_TEST'
  | 'REPORT_RESULT_ISSUE'
  | null;

export const SampleDetailModal: React.FC<SampleDetailModalProps> = ({
  sample,
  isOpen,
  onClose,
  onSampleUpdated,
  initialTab,
}) => {
  const { user } = useAuth();

  // Active action being performed (shows the corresponding form drawer)
  const [activeAction, setActiveAction] = useState<ActionType>(null);

  // Action Form Inputs
  const [invoiceNoInput, setInvoiceNoInput] = useState('');
  const [invoiceAmountInput, setInvoiceAmountInput] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const [receiptInput, setReceiptInput] = useState('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  const [processingDateInput, setProcessingDateInput] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [rejectionReason, setRejectionReason] = useState('');

  const [certResultStatus, setCertResultStatus] = useState<string>('Completed');
  const [certComments, setCertComments] = useState<string>(
    'Analysis completed in full compliance with Halal standards. No prohibited porcine or ethanol traces detected.'
  );
  const [certFile, setCertFile] = useState<File | null>(null);

  // New action inputs: Cannot Test & Discrepancy reporting
  const [cannotTestReason, setCannotTestReason] = useState('');
  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [discrepancyFile, setDiscrepancyFile] = useState<File | null>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Delete sample state (Super Admin only)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Permissions & Due-Process helper for lifecycle actions
  const canPerformAction = (action?: ActionType | null): boolean => {
    if (!action || !sample) return false;
    const isLab = user?.role === 'LAB_USER';
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'REGISTRY' || user?.role === 'MANAGEMENT' || isSuperAdmin;
    const isFinanceStaff = user?.role === 'ACCOUNTANT' || user?.role === 'FINANCE' || isSuperAdmin;

    // Disallow standard progression actions if sample is rejected
    if (sample.workflowStatus === 'Rejected') {
      return false;
    }

    // Strict sequential due-process rules:
    // 1. DISPATCH_SAMPLE: only Registry/Admin can dispatch, and ONLY if status is Registered
    if (action === 'DISPATCH_SAMPLE') {
      return isAdminOrStaff && sample.workflowStatus === 'Registered';
    }

    // 2. ACCEPT_SAMPLE: only Laboratory can accept intake, and ONLY if status is Sent to Lab
    if (action === 'ACCEPT_SAMPLE') {
      return isLab && sample.workflowStatus === 'Sent to Lab';
    }

    // 3. SEND_INVOICE: only Laboratory can send invoice, and ONLY if intake is accepted (In Processing) and invoice not yet submitted
    if (action === 'SEND_INVOICE') {
      return isLab && (sample.workflowStatus === 'In Processing' || !!sample.processingDate) && !sample.invoiceNo;
    }

    // 4. ACKNOWLEDGE_INVOICE: only Registry/Finance, and ONLY if invoice is present and not yet acknowledged
    if (action === 'ACKNOWLEDGE_INVOICE') {
      return (isAdminOrStaff || isFinanceStaff) && !!sample.invoiceNo && !sample.invoiceAcknowledged;
    }

    // 5. SEND_PAYMENT: only Registry/Finance, and ONLY if invoice is acknowledged and receipt proof not yet submitted
    if (action === 'SEND_PAYMENT') {
      return (isAdminOrStaff || isFinanceStaff) && !!sample.invoiceNo && !!sample.invoiceAcknowledged && !sample.receiptNo;
    }

    // 6. CONFIRM_PAYMENT: only Laboratory, and ONLY if payment receipt is submitted and payment not yet confirmed
    if (action === 'CONFIRM_PAYMENT') {
      return isLab && !!sample.receiptNo && !sample.paymentConfirmedByLab;
    }

    // 7. ISSUE_CERTIFICATE: only Laboratory, and ONLY after payment confirmation or receipt proof, and result not yet completed
    if (action === 'ISSUE_CERTIFICATE') {
      return isLab && (sample.paymentConfirmedByLab || !!sample.receiptNo) && sample.resultStatus !== 'Completed';
    }

    // 8. REJECT_SAMPLE: Laboratory can reject active sample; Admin/Registry can ONLY reject before sending to lab (Registered)
    if (action === 'REJECT_SAMPLE') {
      if (sample.workflowStatus === 'Closed') return false;
      if (isLab) return true;
      if (isAdminOrStaff) return sample.workflowStatus === 'Registered';
      return false;
    }

    // 9. REPORT_RESULT_ISSUE: only Registry/Admin, and ONLY after CoA is issued or completed
    if (action === 'REPORT_RESULT_ISSUE') {
      return isAdminOrStaff && (!!sample.resultFileUrl || sample.resultStatus === 'Completed');
    }

    // 10. Operational notices: only Laboratory during active intake/processing
    if (action === 'SEND_TAT_NOTICE' || action === 'CANNOT_TEST') {
      return isLab && (sample.workflowStatus === 'Sent to Lab' || sample.workflowStatus === 'In Processing');
    }

    return false;
  };

  // Helper to trigger any action, open drawer, and smooth-scroll
  const triggerAction = (action: ActionType) => {
    if (!action) return;

    if (!canPerformAction(action)) {
      if (sample?.workflowStatus === 'Rejected') {
        setActionErrorMsg('Sample Rejected: Standard workflow actions are suspended.');
        return;
      }
      setActionErrorMsg(`Due Process Notice: This action cannot be performed yet. The sample is currently at stage '${sample?.workflowStatus}' and must complete prior prerequisite steps.`);
      return;
    }

    setActiveAction(action);
    setActionSuccessMsg('');
    setActionErrorMsg('');
    setTimeout(() => {
      const el = document.getElementById('action-drawer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
        el.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.4)';
        setTimeout(() => {
          el.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.12)';
        }, 1200);
      }
    }, 100);
  };

  // Set default action when modal opens based on sample state
  useEffect(() => {
    if (isOpen && sample) {
      setActionSuccessMsg('');
      setActionErrorMsg('');
      setProcessingDateInput(new Date().toISOString().split('T')[0]);

      // Pre-fill invoice defaults if empty
      if (!sample.invoiceNo) {
        const labCode = (sample.receivingLabName || 'LAB').slice(0, 3).toUpperCase();
        setInvoiceNoInput(`INV-${labCode}-${Date.now().toString().slice(-4)}`);
        setInvoiceAmountInput('₦185,000');
      } else {
        setInvoiceNoInput(sample.invoiceNo);
        setInvoiceAmountInput(sample.invoiceAmount || '');
      }

      if (!sample.receiptNo) {
        setReceiptInput(`REC-HDI-${Date.now().toString().slice(-4)}`);
      } else {
        setReceiptInput(sample.receiptNo);
      }

      // If sample is waiting for a specific step, pre-select that action ONLY for the authorized role
      const isLab = user?.role === 'LAB_USER';
      const isSuperAdmin = user?.role === 'SUPER_ADMIN';
      const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'REGISTRY' || user?.role === 'MANAGEMENT' || isSuperAdmin;
      const isFinanceStaff = user?.role === 'ACCOUNTANT' || user?.role === 'FINANCE' || isSuperAdmin;

      if (isLab) {
        if (sample.receiptNo && !sample.paymentConfirmedByLab && sample.workflowStatus !== 'Rejected') {
          setActiveAction('CONFIRM_PAYMENT');
        } else if ((sample.workflowStatus === 'In Processing' || !!sample.processingDate) && !sample.invoiceNo && sample.workflowStatus !== 'Rejected') {
          setActiveAction('SEND_INVOICE');
        } else if ((sample.paymentConfirmedByLab || sample.receiptNo) && sample.resultStatus !== 'Completed' && sample.workflowStatus !== 'Rejected') {
          setActiveAction('ISSUE_CERTIFICATE');
        } else if (sample.workflowStatus === 'Sent to Lab') {
          setActiveAction('ACCEPT_SAMPLE');
        } else {
          setActiveAction(null);
        }
      } else if (isAdminOrStaff || isFinanceStaff) {
        if (sample.invoiceNo && !sample.invoiceAcknowledged && sample.workflowStatus !== 'Rejected') {
          setActiveAction('ACKNOWLEDGE_INVOICE');
        } else if (sample.invoiceNo && sample.invoiceAcknowledged && !sample.receiptNo && sample.workflowStatus !== 'Rejected') {
          setActiveAction('SEND_PAYMENT');
        } else if (sample.workflowStatus === 'Registered') {
          setActiveAction('DISPATCH_SAMPLE');
        } else {
          // Sent to Lab, In Processing, or awaiting lab payment confirmation — NOT admin's action
          setActiveAction(null);
        }
      } else {
        setActiveAction(null);
      }
    }
  }, [isOpen, sample?._id, user?.role]);

  if (!sample) return null;

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'REGISTRY' || user?.role === 'MANAGEMENT' || isSuperAdmin;
  const isLabUser = user?.role === 'LAB_USER';
  const isAccountant = user?.role === 'ACCOUNTANT' || user?.role === 'FINANCE' || isSuperAdmin;
  const isAdminOrFin = isAdmin || isAccountant;

  // Generic Update Handler
  const handleUpdateField = async (
    updatePayload: Record<string, any>,
    fileToUpload?: File | null,
    successNote?: string
  ) => {
    setIsUpdating(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');
    try {
      if (fileToUpload) {
        const uploadRes = await api.uploadFile(fileToUpload);
        if (updatePayload.invoiceNo !== undefined) updatePayload.invoiceFileUrl = uploadRes.fileUrl;
        if (updatePayload.receiptNo !== undefined) updatePayload.receiptFileUrl = uploadRes.fileUrl;
        if (updatePayload.resultStatus !== undefined) updatePayload.resultFileUrl = uploadRes.fileUrl;
      }

      const updated = await api.updateSample(sample._id, updatePayload);
      onSampleUpdated(updated);
      setActionSuccessMsg(successNote || '✓ Action successfully completed & workflow notification dispatched!');
      setActiveAction(null);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendComment = async (msg: string) => {
    const updatedComments = await api.addComment(sample._id, msg);
    onSampleUpdated({ ...sample, comments: updatedComments });
  };

  // 1. Lab sends 1-Week TAT Notice
  const handleSendOneWeekTatNotice = async () => {
    setIsUpdating(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');
    try {
      const updated = await api.sendOneWeekTatNotice(sample._id);
      onSampleUpdated(updated);
      setActionSuccessMsg('✓ 1-Week timeline notice dispatched to Admin and email notification sent.');
      setActiveAction(null);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to dispatch 1-week timeline notification.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 2. Lab cannot perform test
  const handleNotifyCannotTest = async () => {
    if (!cannotTestReason.trim()) {
      setActionErrorMsg('Please provide the reason why the laboratory cannot perform the required test.');
      return;
    }
    setIsUpdating(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');
    try {
      const updated = await api.notifyCannotTest(sample._id, cannotTestReason.trim());
      onSampleUpdated(updated);
      setActionSuccessMsg('✓ Admin has been notified of inability to test. Sample status marked as Rejected.');
      setActiveAction(null);
      setCannotTestReason('');
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to notify admin.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. Admin reports result discrepancy / rejects certificate
  const handleReportDiscrepancy = async () => {
    if (!discrepancyNote.trim()) {
      setActionErrorMsg('Please explain the discrepancy or error found with the certificate / results.');
      return;
    }
    setIsUpdating(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');
    try {
      let attachmentUrl: string | undefined = undefined;
      if (discrepancyFile) {
        const uploadRes = await api.uploadFile(discrepancyFile);
        attachmentUrl = uploadRes.fileUrl;
      }
      const updated = await api.reportResultDiscrepancy(sample._id, discrepancyNote.trim(), attachmentUrl);
      onSampleUpdated(updated);
      setActionSuccessMsg('✓ Certificate rejected / discrepancy reported to Lab. Notification email dispatched.');
      setActiveAction(null);
      setDiscrepancyNote('');
      setDiscrepancyFile(null);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to report discrepancy to lab.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 4. Super Admin: Soft-delete sample to Deleted Bin
  const handleDeleteSample = async () => {
    if (!deleteReason.trim()) {
      setActionErrorMsg('Please provide a reason for deleting this sample.');
      return;
    }
    setIsDeleting(true);
    setActionErrorMsg('');
    try {
      await api.deleteSample(sample._id, deleteReason.trim());
      setShowDeleteConfirm(false);
      setDeleteReason('');
      onClose();
      onSampleUpdated({ ...sample, isDeleted: true });
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to delete sample. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Progression Stepper with direct interactive action triggers
  const isRejected = sample.workflowStatus === 'Rejected';
  const steps: {
    key: string;
    label: string;
    done: boolean;
    isFailed?: boolean;
    action?: ActionType;
    hint: string;
    roleLabel: string;
  }[] = isRejected
    ? [
        {
          key: 'Registered',
          label: '1. Registered',
          done: true,
          hint: `Registered on ${new Date(sample.createdAt).toLocaleDateString()} by ${sample.sentBy}`,
          roleLabel: 'Registry',
        },
        {
          key: 'SentToLab',
          label: isLabUser ? '2. Sample Received' : '2. Sent to Lab',
          done: true,
          hint: `Sample received by ${sample.receivingLabName || 'partner laboratory'}`,
          roleLabel: isLabUser ? 'Laboratory' : 'Registry',
        },
        {
          key: 'Rejected',
          label: '3. Sample Rejected',
          done: true,
          isFailed: true,
          hint: `Sample rejected: ${sample.rejectionReason || 'Sample rejected'}`,
          roleLabel: 'Intake Inspection',
        },
        {
          key: 'Resolution',
          label: '4. Resolution',
          done: false,
          hint: 'Registry & client to resolve via replacement batch or dossier update',
          roleLabel: 'Registry / Client',
        },
      ]
    : [
        {
          key: 'Registered',
          label: '1. Registered',
          done: true,
          hint: `Registered on ${new Date(sample.createdAt).toLocaleDateString()} by ${sample.sentBy}`,
          roleLabel: 'Registry',
        },
        {
          key: 'Stage2',
          label: isLabUser ? '2. Sample Received' : '2. Sent to Lab',
          done: ['Sent to Lab', 'In Processing', 'Result Received', 'Closed', 'Completed'].includes(sample.workflowStatus),
          action: isLabUser ? 'ACCEPT_SAMPLE' : 'DISPATCH_SAMPLE',
          hint: isLabUser
            ? (sample.processingDate ? `Sample received on ${new Date(sample.processingDate).toLocaleDateString()}` : 'Click to confirm Sample Received')
            : (sample.workflowStatus === 'Registered' ? 'Click to Dispatch Sample to Lab' : 'Sample dispatched to lab via courier'),
          roleLabel: isLabUser ? 'Laboratory' : 'Registry',
        },
        {
          key: 'Stage3',
          label: isLabUser ? '3. Invoice Sent' : '3. Invoice Received',
          done: Boolean(sample.invoiceNo),
          action: isLabUser ? 'SEND_INVOICE' : 'ACKNOWLEDGE_INVOICE',
          hint: sample.invoiceNo
            ? (isLabUser ? `Invoice ${sample.invoiceNo} Sent` : `Invoice ${sample.invoiceNo} Received from Lab`)
            : (isLabUser ? 'Click to Submit Invoice to Registry' : 'Awaiting Invoice from Laboratory'),
          roleLabel: isLabUser ? 'Laboratory' : 'Finance / Admin',
        },
        {
          key: 'Stage4',
          label: isLabUser ? '4. Confirmed Payment' : '4. Paid',
          done: isLabUser ? Boolean(sample.paymentConfirmedByLab) : Boolean(sample.receiptNo),
          action: isLabUser ? 'CONFIRM_PAYMENT' : 'SEND_PAYMENT',
          hint: isLabUser
            ? (sample.paymentConfirmedByLab ? 'Payment Confirmed received by Laboratory' : 'Click to Confirm Payment Receipt')
            : (sample.receiptNo ? `Paid with reference ${sample.receiptNo}` : 'Click to Pay Invoice & Record Payment'),
          roleLabel: isLabUser ? 'Laboratory' : 'Finance / Admin',
        },
        {
          key: 'Stage5',
          label: '5. Certificate Issued',
          done: sample.resultStatus === 'Completed' || sample.workflowStatus === 'Closed',
          action: sample.resultFileUrl || sample.resultStatus === 'Completed' ? 'REPORT_RESULT_ISSUE' : 'ISSUE_CERTIFICATE',
          hint: sample.resultFileUrl ? 'Certificate of Analysis (CoA) Issued' : (isLabUser ? 'Click to Issue Certificate of Analysis' : 'Awaiting Certificate of Analysis'),
          roleLabel: sample.resultFileUrl ? 'Registry' : 'Laboratory',
        },
      ];

  // Determine Primary Recommended Action based on current workflow status AND current user role
  let recommendedAction: {
    type: ActionType;
    label: string;
    icon: React.ReactNode;
    bg: string;
    border: string;
    color: string;
  } | null = null;

  if (sample.workflowStatus === 'Registered') {
    if (isAdmin) {
      recommendedAction = {
        type: 'DISPATCH_SAMPLE',
        label: 'Dispatch Sample (Sent to Lab)',
        icon: <Truck size={15} />,
        bg: '#2563eb',
        border: '#1d4ed8',
        color: '#ffffff',
      };
    }
  } else if (sample.workflowStatus === 'Sent to Lab') {
    if (isLabUser) {
      recommendedAction = {
        type: 'ACCEPT_SAMPLE',
        label: 'Confirm Sample Received',
        icon: <Package size={15} />,
        bg: '#d97706',
        border: '#b45309',
        color: '#ffffff',
      };
    }
  } else if ((sample.workflowStatus === 'In Processing' || !!sample.processingDate) && !sample.invoiceNo) {
    if (isLabUser) {
      recommendedAction = {
        type: 'SEND_INVOICE',
        label: 'Send Invoice (Invoice Sent)',
        icon: <DollarSign size={15} />,
        bg: '#2563eb',
        border: '#1d4ed8',
        color: '#ffffff',
      };
    }
  } else if (sample.invoiceNo && !sample.invoiceAcknowledged) {
    if (isAdminOrFin) {
      recommendedAction = {
        type: 'ACKNOWLEDGE_INVOICE',
        label: 'Acknowledge Invoice Received',
        icon: <CheckCircle size={15} />,
        bg: '#16a34a',
        border: '#15803d',
        color: '#ffffff',
      };
    }
  } else if (sample.invoiceNo && sample.invoiceAcknowledged && !sample.receiptNo) {
    if (isAdminOrFin) {
      recommendedAction = {
        type: 'SEND_PAYMENT',
        label: 'Pay Invoice (Record as Paid)',
        icon: <CreditCard size={15} />,
        bg: '#d97706',
        border: '#b45309',
        color: '#ffffff',
      };
    }
  } else if (sample.receiptNo && !sample.paymentConfirmedByLab) {
    if (isLabUser) {
      recommendedAction = {
        type: 'CONFIRM_PAYMENT',
        label: 'Confirmed Payment',
        icon: <CheckCircle2 size={15} />,
        bg: '#16a34a',
        border: '#15803d',
        color: '#ffffff',
      };
    }
  } else if ((sample.paymentConfirmedByLab || sample.receiptNo) && sample.resultStatus !== 'Completed') {
    if (isLabUser) {
      recommendedAction = {
        type: 'ISSUE_CERTIFICATE',
        label: 'Issue Certificate of Analysis (CoA)',
        icon: <Award size={15} />,
        bg: '#7c3aed',
        border: '#6d28d9',
        color: '#ffffff',
      };
    }
  } else if (sample.resultFileUrl || sample.resultStatus === 'Completed') {
    if (isAdmin) {
      recommendedAction = {
        type: 'REPORT_RESULT_ISSUE',
        label: 'Report Result Discrepancy',
        icon: <AlertTriangle size={15} />,
        bg: '#fee2e2',
        border: '#fca5a5',
        color: '#dc2626',
      };
    }
  }



  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${sample.sampleName} — [${sample.sampleCode}]`}
      subtitle={`Company: ${sample.companyName} | Laboratory: ${sample.receivingLabName}`}
      maxWidth="1280px"
      className="modal-big"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── TOP HERO BANNER: Sample Code, Statuses, Physical Thumbnail, TAT ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div
              onClick={() => setIsZoomOpen(true)}
              style={{
                position: 'relative',
                cursor: 'pointer',
                width: 76,
                height: 76,
                borderRadius: 12,
                overflow: 'hidden',
                border: '2.5px solid #cbd5e1',
                flexShrink: 0,
                boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
                background: '#0f172a',
              }}
              title="Click to view large sample inspection photo"
            >
              <img
                src={
                  sample.pictureUrl ||
                  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=400&q=80'
                }
                alt={sample.sampleName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.7)',
                  color: '#ffffff',
                  fontSize: '9px',
                  textAlign: 'center',
                  padding: '2px 0',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                }}
              >
                ZOOM
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="code-tag" style={{ fontSize: '13px', padding: '3px 10px' }}>
                  {sample.sampleCode}
                </span>
                <StatusBadge status={sample.workflowStatus} />
                <StatusBadge status={sample.resultStatus} type="result" />
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 99,
                    background: sample.sampleNature === 'Food' ? '#dcfce7' : '#e0f2fe',
                    color: sample.sampleNature === 'Food' ? '#166534' : '#0369a1',
                  }}
                >
                  {sample.sampleNature} Category
                </span>
              </div>
              <h3 style={{ margin: '6px 0 2px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {sample.sampleName}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Registered on <strong>{new Date(sample.dateOfEntry).toLocaleDateString()}</strong> by {sample.sentBy} • Client: <strong>{sample.companyName}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {/* Super Admin: Delete Sample Button */}
            {user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setDeleteReason('');
                  setActionErrorMsg('');
                }}
                title="Move sample to Deleted Bin (Super Admin only)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  background: '#fff5f5',
                  border: '1.5px solid #fca5a5',
                  borderRadius: 8,
                  color: '#dc2626',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* ── SUPER ADMIN DELETE CONFIRMATION PANEL ── */}
        {showDeleteConfirm && user?.role === 'SUPER_ADMIN' && (
          <div
            style={{
              background: 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)',
              border: '2px solid #f87171',
              borderRadius: 14,
              padding: '20px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Trash2 size={18} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#991b1b' }}>Move to Deleted Bin</div>
                <div style={{ fontSize: '12px', color: '#b91c1c' }}>This sample will be removed from the active registry. You can restore it from the Deleted Bin.</div>
              </div>
            </div>

            {actionErrorMsg && (
              <div style={{
                padding: '10px 14px', marginBottom: 14, background: '#fef2f2',
                color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: '13px',
              }}>
                ⚠️ {actionErrorMsg}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>
                Reason for Deletion <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Provide a clear reason for moving this sample to the deleted bin..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '13px',
                  border: '1.5px solid #fca5a5', borderRadius: 8, resize: 'vertical',
                  fontFamily: 'inherit', background: '#ffffff', color: '#1e293b',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteReason(''); setActionErrorMsg(''); }}
                style={{
                  padding: '8px 18px', background: '#ffffff', border: '1.5px solid #e5e7eb',
                  borderRadius: 8, fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSample}
                disabled={isDeleting || !deleteReason.trim()}
                style={{
                  padding: '8px 20px', background: isDeleting || !deleteReason.trim() ? '#f87171' : '#dc2626',
                  border: 'none', borderRadius: 8, fontWeight: 800, fontSize: '13px',
                  cursor: isDeleting || !deleteReason.trim() ? 'not-allowed' : 'pointer',
                  color: '#ffffff', display: 'flex', alignItems: 'center', gap: 7,
                  opacity: !deleteReason.trim() ? 0.7 : 1,
                }}
              >
                <Trash2 size={14} />
                {isDeleting ? 'Deleting…' : 'Confirm — Move to Bin'}
              </button>
            </div>
          </div>
        )}

        {/* ── DEDICATED SAMPLE REJECTED WORKFLOW BANNER ── */}
        {isRejected && (
          <div
            style={{
              background: 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)',
              border: '2px solid #f87171',
              borderRadius: 14,
              padding: '18px 22px',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#dc2626',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#991b1b' }}>
                    Sample Rejected
                  </h3>
                  <span style={{ fontSize: '12px', color: '#b91c1c' }}>
                    Physical intake was rejected. Standard laboratory analysis, invoicing, and certification are suspended.
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #fca5a5',
                  padding: '4px 12px',
                  borderRadius: 99,
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#dc2626',
                }}
              >
                ● Status: REJECTED
              </div>
            </div>

            {/* Rejection Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                background: '#ffffff',
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid #fecaca',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                  Rejection Reason
                </span>
                <strong style={{ fontSize: '13px', color: '#991b1b' }}>
                  "{sample.rejectionReason || 'Sample rejected during intake inspection.'}"
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                  Rejected By / Authority
                </span>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                  {sample.rejectedBy || sample.receivingLabName || 'Assigned Laboratory'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                  Rejection Date
                </span>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                  {sample.rejectedAt ? new Date(sample.rejectedAt).toLocaleString() : 'Recorded at Intake'}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* ── WORKFLOW LIFECYCLE PROGRESSION TRACKER (INTERACTIVE) ── */}
        <div
          className="touch-scroll-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: '12px 18px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            boxShadow: 'var(--shadow-sm)',
            justifyContent: 'space-between',
            maxWidth: '100%',
          }}
        >
          {steps.map((step, idx) => {
            const isCurrentActive = activeAction === step.action;
            const isCurrentExecutable = Boolean(step.action && !step.done && canPerformAction(step.action));

            const StepContent = (
              <>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: step.isFailed
                      ? '#dc2626'
                      : step.done
                      ? '#0f172a'
                      : isCurrentActive || isCurrentExecutable
                      ? '#2563eb'
                      : '#f1f5f9',
                    color: step.isFailed || step.done || isCurrentActive || isCurrentExecutable ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800,
                    border: step.isFailed
                      ? '2px solid #dc2626'
                      : step.done
                      ? '2px solid #0f172a'
                      : isCurrentActive || isCurrentExecutable
                      ? '2px solid #2563eb'
                      : '2px solid #cbd5e1',
                    boxShadow: isCurrentActive || isCurrentExecutable ? '0 0 0 3px rgba(37,99,235,0.2)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {step.isFailed ? '✕' : step.done ? '✓' : idx + 1}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: step.isFailed
                      ? '#dc2626'
                      : step.done
                      ? '#0f172a'
                      : isCurrentActive || isCurrentExecutable
                      ? '#2563eb'
                      : '#64748b',
                    fontWeight: step.isFailed || step.done || isCurrentActive || isCurrentExecutable ? 700 : 500,
                    marginTop: 5,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.label}
                </div>

                {/* Status Badges - strictly following due process */}
                {step.isFailed ? (
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#dc2626',
                      fontWeight: 700,
                      background: '#fee2e2',
                      padding: '1px 6px',
                      borderRadius: 4,
                      marginTop: 4,
                      border: '1px solid #fecaca',
                    }}
                  >
                    Rejected
                  </span>
                ) : step.done ? (
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#0f172a',
                      fontWeight: 600,
                      background: '#f1f5f9',
                      padding: '1px 6px',
                      borderRadius: 4,
                      marginTop: 4,
                    }}
                  >
                    {idx === 0
                      ? 'Registered'
                      : idx === 1
                      ? isLabUser
                        ? 'Received'
                        : 'Dispatched'
                      : idx === 2
                      ? isLabUser
                        ? 'Invoiced'
                        : 'Inv. Received'
                      : idx === 3
                      ? isLabUser
                        ? 'Confirmed'
                        : 'Paid'
                      : 'Issued'}
                  </span>
                ) : isCurrentExecutable ? (
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#2563eb',
                      fontWeight: 700,
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      padding: '1px 6px',
                      borderRadius: 4,
                      marginTop: 4,
                    }}
                  >
                    In Progress
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#94a3b8',
                      fontWeight: 500,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      padding: '1px 6px',
                      borderRadius: 4,
                      marginTop: 4,
                    }}
                    title={`Waiting for prior process. Handled by ${step.roleLabel}`}
                  >
                    {step.roleLabel}
                  </span>
                )}
              </>
            );

            return (
              <React.Fragment key={step.key}>
                {isCurrentExecutable ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (step.action) {
                        triggerAction(step.action);
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: 120,
                      background: isCurrentActive ? '#eff6ff' : 'transparent',
                      border: isCurrentActive ? '1px solid #bfdbfe' : '1px solid transparent',
                      borderRadius: 10,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title={step.hint}
                  >
                    {StepContent}
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: 120,
                      background: 'transparent',
                      border: '1px solid transparent',
                      borderRadius: 10,
                      padding: '8px 10px',
                      cursor: 'default',
                      userSelect: 'none',
                    }}
                    title={step.hint}
                  >
                    {StepContent}
                  </div>
                )}
                {idx < steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 3,
                      background: step.isFailed
                        ? '#f87171'
                        : step.done
                        ? (steps[idx + 1]?.isFailed ? '#f87171' : '#0f172a')
                        : '#e2e8f0',
                      minWidth: 16,
                      margin: '0 4px',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── ALERTS / TOASTS ── */}
        {actionSuccessMsg && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{actionSuccessMsg}</span>
            <button onClick={() => setActionSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}>
              ✕
            </button>
          </div>
        )}

        {actionErrorMsg && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{actionErrorMsg}</span>
            <button onClick={() => setActionErrorMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>
              ✕
            </button>
          </div>
        )}

        {/* ── MAIN ONE-PAGE CONTENT GRID: 2 BALANCED COLUMNS ── */}
        <div className="responsive-modal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20 }}>
          {/* ════════ LEFT COLUMN: Physical Sample Inspection & Product Specifications ════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Physical Sample Inspection Photo Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Physical Sample Inspection Photo
                </h4>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '12px', gap: 6 }}
                >
                  <Eye size={14} /> Full Screen / Zoom
                </button>
              </div>

              <div
                onClick={() => setIsZoomOpen(true)}
                style={{
                  width: '100%',
                  maxHeight: 250,
                  minHeight: 180,
                  background: '#0f172a',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid #cbd5e1',
                }}
              >
                <img
                  src={
                    sample.pictureUrl ||
                    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=85'
                  }
                  alt={sample.sampleName}
                  style={{ maxHeight: 250, maxWidth: '100%', objectFit: 'contain' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 12,
                    background: 'rgba(15, 23, 42, 0.85)',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  🔍 Click to inspect seal & labels
                </div>
              </div>
            </div>

            {/* Section A: Sample Information */}
            <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: 12, border: '1px solid #bae6fd', boxShadow: 'var(--shadow-sm)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Section A — Sample Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8, fontSize: '12.5px', color: '#1e293b' }}>
                <div><strong>Sample Name:</strong> {sample.sampleName}</div>
                <div><strong>Client Company:</strong> {sample.companyName}</div>
                {sample.companyAddress && <div><strong>Company Address:</strong> {sample.companyAddress}</div>}
                <div><strong>Nature / Category:</strong> {sample.sampleNature}</div>
                <div><strong>Sample Code:</strong> <span className="code-tag">{sample.sampleCode}</span></div>
                {sample.attachmentUrl && (
                  <div style={{ gridColumn: '1 / -1', marginTop: 8, padding: '10px 14px', background: '#ffffff', borderRadius: 8, border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div>
                      <strong style={{ fontSize: '12.5px', color: '#0369a1', display: 'block' }}>Technical Specification / Batch Dossier:</strong>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>Original manufacturer document registered with sample</span>
                    </div>
                    <a
                      href={sample.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, gap: 5 }}
                    >
                      <FileText size={14} /> Open Technical Spec
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Section B: Product Details */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Section B — Product Details
                </h4>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Optional Product Information</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8, fontSize: '12.5px', color: '#1e293b' }}>
                <div><strong>Batch Number:</strong> {sample.batchNo || '—'}</div>
                <div><strong>NAFDAC Reg No.:</strong> {sample.nafdacNo || '—'}</div>
                {sample.sonNo && <div><strong>SON / MANCAP No.:</strong> {sample.sonNo}</div>}
                {sample.isoNo && <div><strong>ISO Certification:</strong> {sample.isoNo}</div>}
                {sample.barcodeNo && <div><strong>Barcode / EAN:</strong> {sample.barcodeNo}</div>}
                {sample.otherIdentifier && <div><strong>Other Identifier:</strong> {sample.otherIdentifier}</div>}
                <div><strong>Production Date:</strong> {sample.productionDate ? new Date(sample.productionDate).toLocaleDateString() : '—'}</div>
                <div><strong>Expiry Date:</strong> {sample.expiryDate ? new Date(sample.expiryDate).toLocaleDateString() : '—'}</div>
              </div>
            </div>

            {/* Section C: Receipt & Dispatch */}
            <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: 12, border: '1px solid #bbf7d0', boxShadow: 'var(--shadow-sm)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Section C — Laboratory & Analysis Intake
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8, fontSize: '12.5px', color: '#1e293b' }}>
                <div><strong>Receiving Lab:</strong> {sample.receivingLabName}</div>
                <div><strong>Lab Identifier:</strong> {sample.receivingLabId || 'LAB_1'}</div>
                <div><strong>Date of Entry:</strong> {new Date(sample.dateOfEntry).toLocaleDateString()}</div>
                <div>
                  <strong>Date Sent:</strong>{' '}
                  {sample.processingDate ? (
                    <span style={{ color: '#166534', fontWeight: 700 }}>{new Date(sample.processingDate).toLocaleDateString()}</span>
                  ) : (
                    <span style={{ color: '#b45309', fontWeight: 700 }}>Pending Lab Intake</span>
                  )}
                </div>
                <div><strong>Sent By:</strong> {sample.sentBy}</div>
                <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                  <strong>Analysis Required:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                    {(sample.analysisRequired || []).map((a, i) => (
                      <span key={i} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 5, fontSize: '11px', fontWeight: 700, border: '1px solid #bfdbfe' }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ════════ RIGHT COLUMN: Section D Finance/CoA, Discussion & Audit Trail ════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Section D: Finance & Certification */}
            <div style={{ background: '#fefce8', padding: '16px', borderRadius: 12, border: '1px solid #fef08a', boxShadow: 'var(--shadow-sm)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 800, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Section D — Finance, Invoicing & Certification
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '12.5px', color: '#1e293b' }}>
                {/* Invoice Details */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#ffffff', borderRadius: 8, border: '1px solid #fef08a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block', fontWeight: 600 }}>Laboratory Invoice:</span>
                    {sample.invoiceNo ? (
                      <strong style={{ color: '#166534', fontSize: '13.5px' }}>{sample.invoiceNo} {sample.invoiceAmount ? `(${sample.invoiceAmount})` : ''}</strong>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Unbilled / Awaiting Lab Invoice</span>
                    )}
                    <div style={{ marginTop: 3 }}>
                      {sample.invoiceAcknowledged ? (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 7px', borderRadius: 5, fontWeight: 700, fontSize: '11px' }}>
                          ✓ Acknowledged
                        </span>
                      ) : sample.invoiceNo ? (
                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 7px', borderRadius: 5, fontWeight: 700, fontSize: '11px' }}>
                          Pending Acknowledgement
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    {sample.invoiceFileUrl ? (
                      <a
                        href={sample.invoiceFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '12px', padding: '6px 12px', fontWeight: 700, gap: 5 }}
                      >
                        <Receipt size={14} /> Open Invoice Document
                      </a>
                    ) : sample.invoiceNo ? (
                      <span style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>
                        Ref: {sample.invoiceNo} (On File)
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Payment Confirmation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#ffffff', borderRadius: 8, border: '1px solid #fef08a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block', fontWeight: 600 }}>Payment Confirmation Proof:</span>
                    {sample.receiptNo ? (
                      <strong style={{ color: '#0284c7', fontSize: '13.5px' }}>Receipt: {sample.receiptNo}</strong>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Awaiting Payment Settlement</span>
                    )}
                    <div style={{ marginTop: 3 }}>
                      {sample.paymentConfirmedByLab ? (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 7px', borderRadius: 5, fontWeight: 700, fontSize: '11px' }}>
                          ✓ Paid & Confirmed by Lab
                        </span>
                      ) : sample.receiptNo ? (
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 7px', borderRadius: 5, fontWeight: 700, fontSize: '11px' }}>
                          Proof Sent (Pending Confirmation)
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    {sample.receiptFileUrl ? (
                      <a
                        href={sample.receiptFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-success btn-sm"
                        style={{ fontSize: '12px', padding: '6px 12px', fontWeight: 700, gap: 5 }}
                      >
                        <CreditCard size={14} /> Open Payment Receipt
                      </a>
                    ) : sample.receiptNo ? (
                      <span style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>
                        Receipt: {sample.receiptNo}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Certificate of Analysis */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#ffffff', borderRadius: 10, border: '1px solid #fef08a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '12px', display: 'block', fontWeight: 600 }}>Certificate of Analysis (CoA):</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <StatusBadge status={sample.resultStatus} type="result" />
                      {sample.resultComments && (
                        <span style={{ fontSize: '12.5px', color: '#475569', fontStyle: 'italic' }}>
                          "{sample.resultComments}"
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {sample.resultFileUrl ? (
                      <a
                        href={sample.resultFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm"
                        style={{ background: '#7c3aed', color: '#ffffff', borderColor: '#6d28d9', fontSize: '12px', padding: '6px 12px', fontWeight: 700, gap: 5 }}
                      >
                        <Award size={14} /> Download Certificate (CoA)
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Not yet issued by lab
                      </span>
                    )}
                  </div>
                </div>

                {/* Special Status Banners */}
                {sample.tatNoticeSentAt && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={16} color="#16a34a" />
                    <div>
                      <strong style={{ fontSize: '12px', color: '#166534', display: 'block' }}>1-Week Analysis Timeline Notice Dispatched:</strong>
                      <span style={{ fontSize: '11.5px', color: '#15803d' }}>
                        Laboratory confirmed payment and estimated results ready by {new Date(sample.tatNoticeSentAt).toLocaleDateString()} (within 1 week).
                      </span>
                    </div>
                  </div>
                )}

                {sample.resultDiscrepancyNote && (
                  <div style={{ background: '#fff7ed', border: '1px solid #fdba74', padding: '10px 14px', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={15} color="#ea580c" />
                      <strong style={{ fontSize: '12px', color: '#c2410c' }}>Certificate Discrepancy / Error Flagged by Admin:</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9a3412', fontStyle: 'italic' }}>
                      "{sample.resultDiscrepancyNote}"
                    </p>
                    {sample.resultDiscrepancyFileUrl && (
                      <a
                        href={sample.resultDiscrepancyFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '11.5px', color: '#ea580c', fontWeight: 700, textDecoration: 'underline', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <FileText size={12} /> View Uploaded Error Markup / Correction File
                      </a>
                    )}
                  </div>
                )}

                {sample.cannotPerformTestReason && (
                  <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '10px 14px', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircle size={15} color="#e11d48" />
                      <strong style={{ fontSize: '12px', color: '#be123c' }}>Laboratory Cannot Perform Required Test:</strong>
                    </div>
                    <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#9f1239', fontStyle: 'italic' }}>
                      "{sample.cannotPerformTestReason}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Threaded Comments & Collaborative Chat */}
            <div style={{ background: '#ffffff', padding: '18px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <MessageSquare size={16} color="#0f172a" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Threaded Discussion & Lab Notes ({sample.comments?.length || 0})
                </h4>
              </div>
              <ThreadedChat comments={sample.comments} onSendMessage={handleSendComment} />
            </div>

            {/* Lifecycle Audit Trail */}
            <div style={{ background: '#ffffff', padding: '18px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <History size={16} color="#2563eb" />
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    History
                  </h4>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#eff6ff',
                    color: '#2563eb',
                    padding: '2px 8px',
                    borderRadius: 12,
                    border: '1px solid #dbeafe',
                  }}
                >
                  {sample.statusHistory?.length || 0} event{sample.statusHistory?.length === 1 ? '' : 's'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxHeight: 460,
                  overflowY: 'auto',
                  paddingRight: 6,
                }}
              >
                {sample.statusHistory && sample.statusHistory.length > 0 ? (
                  sample.statusHistory.map((h, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        paddingLeft: 18,
                        borderLeft: '2px solid #cbd5e1',
                        paddingBottom: idx === sample.statusHistory!.length - 1 ? 0 : 8,
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: -6,
                          top: 4,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background:
                            h.status === 'Closed' || h.status === 'Result Received'
                              ? '#16a34a'
                              : h.status === 'Rejected'
                              ? '#dc2626'
                              : h.status === 'Sent to Lab'
                              ? '#2563eb'
                              : h.status === 'In Processing'
                              ? '#d97706'
                              : '#0f172a',
                          boxShadow: '0 0 0 2px #ffffff',
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{h.status}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#475569', marginTop: 1 }}>
                        By <strong style={{ color: '#1e293b' }}>{h.changedBy || 'System / Registry'}</strong>
                      </div>
                      {h.note && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#1e293b',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            padding: '6px 10px',
                            marginTop: 5,
                            lineHeight: 1.45,
                          }}
                        >
                          "{h.note}"
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                    No audit history events recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ════════ ACTIVE ACTION EXECUTION DRAWER / FORM CARD ════════ */}
        {activeAction && (
          <div
            id="action-drawer"
            style={{
              background: '#f8fafc',
              border: '2px solid #2563eb',
              borderRadius: 14,
              padding: '20px 24px',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              marginTop: 6,
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {activeAction === 'CONFIRM_PAYMENT' && <CheckCircle2 size={20} color="#059669" />}
                {activeAction === 'SEND_INVOICE' && <Receipt size={20} color="#2563eb" />}
                {activeAction === 'ISSUE_CERTIFICATE' && <Award size={20} color="#7c3aed" />}
                {activeAction === 'ACCEPT_SAMPLE' && <Package size={20} color="#d97706" />}
                {activeAction === 'DISPATCH_SAMPLE' && <Truck size={20} color="#2563eb" />}
                {activeAction === 'ACKNOWLEDGE_INVOICE' && <CheckCircle size={20} color="#16a34a" />}
                {activeAction === 'SEND_PAYMENT' && <CreditCard size={20} color="#d97706" />}
                {activeAction === 'REJECT_SAMPLE' && <XCircle size={20} color="#dc2626" />}
                {activeAction === 'SEND_TAT_NOTICE' && <Bell size={20} color="#0284c7" />}
                {activeAction === 'CANNOT_TEST' && <AlertCircle size={20} color="#e11d48" />}
                {activeAction === 'REPORT_RESULT_ISSUE' && <AlertTriangle size={20} color="#ea580c" />}

                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  {activeAction === 'CONFIRM_PAYMENT' && 'Confirm Client Payment Receipt'}
                  {activeAction === 'SEND_INVOICE' && 'Submit Laboratory Invoice to Registry & Finance'}
                  {activeAction === 'ISSUE_CERTIFICATE' && 'Upload Certificate of Analysis & Complete Analysis'}
                  {activeAction === 'ACCEPT_SAMPLE' && 'Accept Physical Sample Intake & Begin Analysis'}
                  {activeAction === 'DISPATCH_SAMPLE' && 'Dispatch Sample to External Laboratory'}
                  {activeAction === 'ACKNOWLEDGE_INVOICE' && 'Acknowledge Receipt of Laboratory Invoice'}
                  {activeAction === 'SEND_PAYMENT' && 'Send Payment Confirmation & Upload Proof'}
                  {activeAction === 'REJECT_SAMPLE' && 'Reject Sample Submission'}
                  {activeAction === 'SEND_TAT_NOTICE' && 'Dispatch 1-Week Timeline Notice to Admin'}
                  {activeAction === 'CANNOT_TEST' && 'Notify Admin: Laboratory Cannot Perform Required Test'}
                  {activeAction === 'REPORT_RESULT_ISSUE' && 'Reject Certificate / Report Result Discrepancy to Laboratory'}
                </h3>
              </div>
              <button
                onClick={() => setActiveAction(null)}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '50%', width: 30, height: 30, padding: 0 }}
              >
                ✕
              </button>
            </div>

            {/* FORM 1: SEND INVOICE */}
            {activeAction === 'SEND_INVOICE' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14 }}>
                <div>
                  <label className="form-label">Invoice Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={invoiceNoInput}
                    onChange={(e) => setInvoiceNoInput(e.target.value)}
                    placeholder="e.g. INV-HYD-2026-081"
                  />
                </div>
                <div>
                  <label className="form-label">Billing Amount (₦)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={invoiceAmountInput}
                    onChange={(e) => setInvoiceAmountInput(e.target.value)}
                    placeholder="e.g. ₦185,000"
                  />
                </div>
                <div>
                  <label className="form-label">Attach Invoice PDF (optional)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setInvoiceFile(e.target.files ? e.target.files[0] : null)}
                    className="form-input"
                    style={{ padding: '6px 10px' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button onClick={() => setActiveAction(null)} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateField(
                        {
                          invoiceNo: invoiceNoInput,
                          invoiceAmount: invoiceAmountInput,
                          statusNote: `Invoice ${invoiceNoInput} issued for ${invoiceAmountInput || 'analysis'}.`,
                        },
                        invoiceFile,
                        `✓ Invoice [${invoiceNoInput}] sent to Registry! Notification dispatched.`
                      )
                    }
                    disabled={isUpdating || !invoiceNoInput.trim()}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '12.5px', padding: '6px 14px', background: '#2563eb', borderColor: '#1d4ed8' }}
                  >
                    <DollarSign size={14} /> {isUpdating ? 'Submitting Invoice...' : 'Confirm & Send Invoice to Registry'}
                  </button>
                </div>
              </div>
            )}

            {/* FORM 2: CONFIRM PAYMENT */}
            {activeAction === 'CONFIRM_PAYMENT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px 18px', borderRadius: 10 }}>
                  <div style={{ fontSize: '13px', color: '#065f46', lineHeight: 1.5 }}>
                    HDI Registry / Finance team has remitted payment with reference: <strong>{sample.receiptNo || 'Bank Transfer Confirmed'}</strong>.
                    {sample.receiptFileUrl && (
                      <div style={{ marginTop: 8 }}>
                        <a
                          href={sample.receiptFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '12px' }}
                        >
                          <CreditCard size={13} /> View Attached Payment Receipt Proof
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>
                  Clicking <strong>Confirm Payment Received</strong> verifies the funds in your laboratory account and clears this sample for Certificate of Analysis issuance.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setActiveAction(null)} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateField(
                        {
                          paymentConfirmedByLab: true,
                          statusNote: `Payment confirmed received by ${sample.receivingLabName}. Ready for certificate issuance.`,
                        },
                        null,
                        `✓ Payment confirmed! Certificate of Analysis can now be issued.`
                      )
                    }
                    disabled={isUpdating}
                    className="btn btn-success btn-sm"
                    style={{ fontSize: '12.5px', padding: '6px 14px' }}
                  >
                    <CheckCircle2 size={15} /> {isUpdating ? 'Verifying...' : 'Confirm Payment Received'}
                  </button>
                </div>
              </div>
            )}

            {/* FORM 3: ISSUE CERTIFICATE */}
            {activeAction === 'ISSUE_CERTIFICATE' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
                <div>
                  <label className="form-label">Analytical Verdict *</label>
                  <select
                    className="form-select"
                    value={certResultStatus}
                    onChange={(e) => setCertResultStatus(e.target.value)}
                  >
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Certificate PDF / Document *</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setCertFile(e.target.files ? e.target.files[0] : null)}
                    className="form-input"
                    style={{ padding: '6px 10px' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Laboratory Remarks & Conformity Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    value={certComments}
                    onChange={(e) => setCertComments(e.target.value)}
                    placeholder="e.g. Porcine DNA: Negative (<0.01%). Ethanol: 0.00%."
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button onClick={() => setActiveAction(null)} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!certFile && !sample.resultFileUrl) {
                        setActionErrorMsg('You must upload a Certificate of Analysis (PDF or image) before completing this sample.');
                        return;
                      }
                      handleUpdateField(
                        {
                          resultStatus: certResultStatus || 'Completed',
                          workflowStatus: 'Closed',
                          resultComments: certComments,
                          statusNote: `Certificate of Analysis issued by ${sample.receivingLabName}. Status: ${certResultStatus}.`,
                        },
                        certFile,
                        `✓ Certificate of Analysis issued and sample completed!`
                      );
                    }}
                    disabled={isUpdating}
                    className="btn btn-primary btn-sm"
                    style={{ background: '#7c3aed', borderColor: '#6d28d9', fontSize: '12.5px', padding: '6px 14px' }}
                  >
                    <Award size={15} /> {isUpdating ? 'Issuing Certificate...' : 'Upload & Issue Certificate of Analysis'}
                  </button>
                </div>
              </div>
            )}

            {/* FORM 4: ACCEPT SAMPLE INTAKE */}
            {activeAction === 'ACCEPT_SAMPLE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#1e293b' }}>
                  Confirm physical sample batch arrival and select the laboratory analysis start date:
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label className="form-label">Date Sent *</label>
                    <input
                      type="date"
                      className="form-input"
                      style={{ width: 180 }}
                      value={processingDateInput}
                      onChange={(e) => setProcessingDateInput(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleUpdateField(
                        {
                          processingDate: processingDateInput,
                          workflowStatus: 'In Processing',
                          resultStatus: 'In Progress',
                          statusNote: `Sample accepted and logged for analysis on ${processingDateInput}`,
                        },
                        null,
                        `✓ Sample intake accepted! Processing commenced.`
                      )
                    }
                    disabled={isUpdating}
                    className="btn btn-success btn-sm"
                    style={{ alignSelf: 'flex-end', fontSize: '12.5px', padding: '6px 14px' }}
                  >
                    <Check size={15} /> Accept Sample & Begin Analysis
                  </button>
                </div>
              </div>
            )}

            {/* FORM 5: DISPATCH SAMPLE */}
            {activeAction === 'DISPATCH_SAMPLE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#1e293b' }}>
                  Mark sample <strong>[{sample.sampleCode}]</strong> as dispatched via courier to <strong>{sample.receivingLabName}</strong>. The laboratory will be alerted immediately.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setActiveAction(null)} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateField(
                        {
                          workflowStatus: 'Sent to Lab',
                          statusNote: `Sample dispatched to ${sample.receivingLabName} via courier`,
                        },
                        null,
                        `✓ Sample marked as dispatched! External lab notified.`
                      )
                    }
                    disabled={isUpdating}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '12.5px', padding: '6px 14px' }}
                  >
                    <Truck size={15} /> Confirm Dispatch → Sent to Lab
                  </button>
                </div>
              </div>
            )}

            {/* FORM 6: ACKNOWLEDGE INVOICE */}
            {activeAction === 'ACKNOWLEDGE_INVOICE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#1e293b' }}>
                  Acknowledge receipt of invoice <strong>{sample.invoiceNo || 'from Lab'}</strong>. This confirms to the lab that HDI has received their billing and is processing payment settlement.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setActiveAction(null)} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateField(
                        {
                          invoiceAcknowledged: true,
                          statusNote: 'Invoice acknowledged by Registry / Accountant',
                        },
                        null,
                        `✓ Invoice acknowledged! Lab notified.`
                      )
                    }
                    disabled={isUpdating}
                    className="btn btn-success btn-sm"
                    style={{ fontSize: '12.5px', padding: '6px 14px' }}
                  >
                    <CheckCircle size={15} /> Acknowledge Invoice
                  </button>
                </div>
              </div>
            )}

            {/* FORM 7: SEND PAYMENT */}
            {activeAction === 'SEND_PAYMENT' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
                <div>
                  <label className="form-label">Receipt / Bank Reference No. *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={receiptInput}
                    onChange={(e) => setReceiptInput(e.target.value)}
                    placeholder="e.g. REC-HDI-2026-991"
                  />
                </div>
                <div>
                  <label className="form-label">Attach Payment Voucher / Receipt Proof (PDF/Image)</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setPaymentFile(e.target.files ? e.target.files[0] : null)}
                    className="form-input"
                    style={{ padding: '6px 10px' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button onClick={() => setActiveAction(null)} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateField(
                        {
                          receiptNo: receiptInput,
                          statusNote: `Payment sent. Ref: ${receiptInput}`,
                        },
                        paymentFile,
                        `✓ Payment record sent to lab! External lab notified.`
                      )
                    }
                    disabled={isUpdating || !receiptInput.trim()}
                    className="btn btn-primary btn-sm"
                    style={{ background: '#d97706', borderColor: '#b45309', fontSize: '12.5px', padding: '6px 14px' }}
                  >
                    <CreditCard size={15} /> Send Payment & Notify Lab
                  </button>
                </div>
              </div>
            )}

            {/* FORM 8: REJECT SAMPLE */}
            {activeAction === 'REJECT_SAMPLE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#991b1b' }}>
                  Please state the reason for rejection (e.g. damaged seal, insufficient volume, or batch discrepancies):
                </p>
                <input
                  type="text"
                  className="form-input"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter detailed reason for sample rejection..."
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setActiveAction(null)} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateField(
                        {
                          workflowStatus: 'Rejected',
                          resultStatus: 'Rejected',
                          rejectionReason: rejectionReason.trim(),
                          statusNote: rejectionReason || 'Sample rejected',
                        },
                        null,
                        `Sample marked as Rejected. Rejection alert dispatched.`
                      )
                    }
                    disabled={isUpdating || !rejectionReason.trim()}
                    className="btn btn-danger btn-sm"
                    style={{ fontSize: '12.5px', padding: '6px 14px' }}
                  >
                    <XCircle size={15} /> Reject Sample
                  </button>
                </div>
              </div>
            )}

            {/* FORM 9: SEND 1-WEEK TIMELINE NOTICE TO ADMIN */}
            {activeAction === 'SEND_TAT_NOTICE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 16px', borderRadius: 10 }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
                    Notify Quality Assurance &amp; Registry that payment has been received and verified, laboratory processing has begun, and official test results with Certificate of Analysis will be provided within <strong>one (1) week (7 business days)</strong>.
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#15803d' }}>
                    An automated email and portal activity notification will be dispatched to Admin.
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setActiveAction(null)} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSendOneWeekTatNotice}
                    disabled={isUpdating}
                    className="btn btn-success btn-sm"
                    style={{ fontSize: '12.5px', padding: '6px 14px', background: '#16a34a', borderColor: '#15803d' }}
                  >
                    <Bell size={15} /> Send 1-Week Notice to Admin
                  </button>
                </div>
              </div>
            )}

            {/* FORM 10: CANNOT PERFORM TEST */}
            {activeAction === 'CANNOT_TEST' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '12px 14px', borderRadius: 8 }}>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#9f1239' }}>
                    If your laboratory cannot perform the required testing (e.g. parameter outside scope, equipment breakdown, or reagent shortage), state the reason below. Admin will be immediately notified via email to reassign or resubmit the sample.
                  </p>
                </div>
                <div>
                  <label className="form-label">Reason Why Test Cannot Be Performed *</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    value={cannotTestReason}
                    onChange={(e) => setCannotTestReason(e.target.value)}
                    placeholder="Specify why the laboratory cannot perform the required test(s)..."
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setActiveAction(null)} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleNotifyCannotTest}
                    disabled={isUpdating || !cannotTestReason.trim()}
                    className="btn btn-danger btn-sm"
                    style={{ fontSize: '12.5px', padding: '6px 14px' }}
                  >
                    <AlertCircle size={15} /> Notify Admin of Inability to Test
                  </button>
                </div>
              </div>
            )}

            {/* FORM 11: REJECT CERTIFICATE / REPORT RESULT DISCREPANCY */}
            {activeAction === 'REPORT_RESULT_ISSUE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '12px 14px', borderRadius: 8 }}>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#9a3412' }}>
                    Flag an error or discrepancy with the issued Certificate of Analysis or test result. You can explain the issue in detail and upload an annotated PDF or image highlighting the problem. The laboratory will be notified by email to rectify and upload a corrected certificate.
                  </p>
                </div>
                <div>
                  <label className="form-label">Discrepancy Details / Rejection Reason *</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    value={discrepancyNote}
                    onChange={(e) => setDiscrepancyNote(e.target.value)}
                    placeholder="Detail the error found in the certificate or test results (e.g. incorrect batch number, missing parameter, invalid threshold)..."
                  />
                </div>
                <div>
                  <label className="form-label">Upload Highlighted Error Markup / Document (Optional)</label>
                  <input
                    type="file"
                    className="form-input"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setDiscrepancyFile(e.target.files?.[0] || null)}
                  />
                  {discrepancyFile && (
                    <span style={{ fontSize: '11.5px', color: '#16a34a', display: 'block', marginTop: 4 }}>
                      Selected: {discrepancyFile.name} ({(discrepancyFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setActiveAction(null)} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleReportDiscrepancy}
                    disabled={isUpdating || !discrepancyNote.trim()}
                    className="btn btn-sm"
                    style={{ background: '#ea580c', color: '#ffffff', borderColor: '#c2410c', fontSize: '12.5px', padding: '6px 14px', fontWeight: 700 }}
                  >
                    <AlertTriangle size={15} /> Reject Certificate &amp; Notify Lab
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Spacer ensuring full breathing space above sticky footer so cards are never clipped */}
        <div style={{ height: 48 }} />

        {/* ═══════════════════════════════════════════════════════════════
            BOTTOM ACTION BUTTONS BAR (INTERACTIVE, RECOMMENDED ACTION & ALL-ACTIONS MENU)
        ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: 'sticky',
            bottom: -24,
            marginLeft: -24,
            marginRight: -24,
            marginBottom: -24,
            padding: '14px 24px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
            zIndex: 30,
            borderRadius: '0 0 16px 16px',
          }}
        >
          {/* Left Side: Danger / Close / Document Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px', padding: '7px 14px' }}
            >
              Close Window
            </button>

            {((isLabUser && sample.workflowStatus !== 'Closed' && sample.workflowStatus !== 'Rejected') ||
              (!isLabUser && sample.workflowStatus === 'Registered')) && (
              <button
                type="button"
                onClick={() => triggerAction('REJECT_SAMPLE')}
                className="btn btn-danger btn-sm"
                style={{ fontSize: '12px', padding: '7px 12px', background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}
                title="Reject sample submission"
              >
                <XCircle size={14} /> Reject Sample
              </button>
            )}

            {/* Quick Document Links */}
            {(sample.invoiceFileUrl || sample.invoiceNo) && (
              <a
                href={sample.invoiceFileUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm"
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  textDecoration: 'none',
                  padding: '6px 10px',
                }}
                title="Open and view laboratory invoice document"
              >
                <Receipt size={13} /> Invoice {sample.invoiceNo ? `(${sample.invoiceNo})` : ''}
              </a>
            )}

            {sample.resultFileUrl && (
              <a
                href={sample.resultFileUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm"
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#f5f3ff',
                  color: '#6d28d9',
                  border: '1px solid #ddd6fe',
                  textDecoration: 'none',
                  padding: '6px 10px',
                }}
                title="Open and download Certificate of Analysis (CoA)"
              >
                <Award size={13} /> View Certificate (CoA)
              </a>
            )}

            {sample.receiptFileUrl && (
              <a
                href={sample.receiptFileUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm"
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#fffbeb',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  textDecoration: 'none',
                  padding: '6px 10px',
                }}
                title="Open and view payment receipt"
              >
                <CreditCard size={13} /> Receipt
              </a>
            )}

            {sample.attachmentUrl && (
              <a
                href={sample.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm"
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#f8fafc',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  textDecoration: 'none',
                  padding: '6px 10px',
                }}
                title="Open and view technical specification dossier"
              >
                <FileText size={13} /> Dossier
              </a>
            )}
          </div>

          {/* Right Side: PRIMARY RECOMMENDED ACTION */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {sample.workflowStatus === 'Rejected' ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                <XCircle size={15} color="#dc2626" />
                <span>Sample Rejected</span>
              </div>
            ) : recommendedAction ? (
              <button
                type="button"
                onClick={() => triggerAction(recommendedAction!.type)}
                className="btn btn-sm"
                style={{
                  background: recommendedAction.bg,
                  color: recommendedAction.color,
                  borderColor: recommendedAction.border,
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '7px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
                title={`Recommended Next Action: ${recommendedAction.label}`}
              >
                {recommendedAction.icon}
                <span>{recommendedAction.label}</span>
              </button>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <Clock size={14} color="#64748b" />
                <span>
                  {sample.workflowStatus === 'Registered' && isLabUser
                    ? 'Awaiting Registry Dispatch'
                    : sample.workflowStatus === 'Sent to Lab' && !isLabUser
                    ? `Awaiting Lab Intake (${sample.receivingLabName})`
                    : sample.workflowStatus === 'In Processing' && !sample.invoiceNo && !isLabUser
                    ? `Testing Ongoing — Awaiting Lab Invoice (${sample.receivingLabName})`
                    : sample.invoiceNo && !sample.receiptNo && isLabUser
                    ? 'Awaiting Payment from HDI Finance'
                    : sample.receiptNo && !sample.paymentConfirmedByLab && !isLabUser
                    ? 'Payment Proof Sent — Awaiting Lab Confirmation'
                    : sample.paymentConfirmedByLab && !sample.resultFileUrl && !isLabUser
                    ? 'Payment Confirmed — Testing Underway in Lab'
                    : sample.workflowStatus === 'Closed'
                    ? 'Sample Closed — Certificate Issued'
                    : 'Workflow Step Completed'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── HIGH-RESOLUTION FULL-SIZE IMAGE LIGHTBOX ── */}
      {isZoomOpen && (
        <div
          onClick={() => setIsZoomOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            cursor: 'zoom-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#0f172a',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
              border: '1px solid #334155',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
                color: '#ffffff',
              }}
            >
              <div>
                <strong style={{ fontSize: '16px' }}>{sample.sampleName}</strong>
                <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: 10 }}>
                  [{sample.sampleCode}]
                </span>
              </div>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ background: '#334155', color: '#ffffff', borderColor: '#475569', fontSize: '13px' }}
              >
                Close (✕)
              </button>
            </div>
            <img
              src={
                sample.pictureUrl ||
                'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1600&q=90'
              }
              alt={sample.sampleName}
              style={{ maxWidth: '100%', maxHeight: '76vh', objectFit: 'contain', borderRadius: 8 }}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};
