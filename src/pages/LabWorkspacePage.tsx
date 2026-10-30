import React, { useState, useEffect } from 'react';
import { Sample } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Building2,
  Clock,
  DollarSign,
  Eye,
  CheckCircle2,
  FlaskConical,
  Package,
  Receipt,
  Award,
  CreditCard,
  Search,
  Filter,
  ArrowRight,
  FileText,
  AlertCircle,
  ExternalLink,
  Upload,
  X,
  Check,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  TrendingUp,
  ClipboardList,
  AlertOctagon,
} from 'lucide-react';
import { WorkflowTrackerModal } from '../components/samples/WorkflowTrackerModal.js';
import { TableActionDropdown } from '../components/common/TableActionDropdown.js';

interface LabWorkspacePageProps {
  samples: Sample[];
  currentSection?: string;
  onNavigateSection?: (section: string) => void;
  onRefreshData?: () => void;
  onSelectSample: (sample: Sample, initialTab?: 'details' | 'actions' | 'chat') => void;
}

export const LabWorkspacePage: React.FC<LabWorkspacePageProps> = ({
  samples,
  currentSection = 'lab-portal',
  onNavigateSection,
  onRefreshData,
  onSelectSample,
}) => {
  const { user } = useAuth();

  const labs = [
    { id: 'LAB_1', name: 'Hydrochrom Analytical Services Limited', shortName: 'Hydrochrom', color: '#16a34a' },
    { id: 'LAB_2', name: 'SAAG Chemical Nigeria Limited (SNCL)', shortName: 'SAAG Chemical', color: '#0284c7' },
    { id: 'LAB_3', name: 'Kazlat Public Analyst Laboratory', shortName: 'Kazlat Lab', color: '#7c3aed' },
    { id: 'LAB_4', name: 'Central Halal Laboratory', shortName: 'Central Halal', color: '#b45309' },
  ];

  const isLabUser = user?.role === 'LAB_USER';
  // Always derive the active lab from the logged-in user's identifier; no manual switcher
  const effectiveLabId = user?.labIdentifier || 'LAB_1';
  const activeLab = labs.find((l) => l.id === effectiveLabId) || labs[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterNature, setFilterNature] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [trackingSample, setTrackingSample] = useState<Sample | null>(null);

  // Close action dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.action-menu-container') && !target.closest('.table-action-dropdown-portal')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active section state synchronized with parent if provided
  const [internalSection, setInternalSection] = useState<string>(currentSection);
  const activeSection = onNavigateSection ? currentSection : internalSection;

  const handleSectionChange = (sec: string) => {
    setInternalSection(sec);
    if (onNavigateSection) {
      onNavigateSection(sec);
    }
  };



  // Samples assigned to this specific lab and sent from admin
  const labSamples = samples.filter((s) => {
    const matchesLab =
      s.receivingLabId === effectiveLabId ||
      (activeLab?.shortName && s.receivingLabName && s.receivingLabName.toLowerCase().includes(activeLab.shortName.toLowerCase()));
    return matchesLab && s.workflowStatus !== 'Registered';
  });

  // Workflow classification for this lab
  // 1. Receive Samples: Dispatched by Admin, waiting for lab to acknowledge & set processing date
  const pendingIntake = labSamples.filter(
    (s) => (s.workflowStatus === 'Sent to Lab' || !s.processingDate) && s.workflowStatus !== 'Rejected'
  );

  // 2. Send Invoices: In processing where invoice hasn't been issued yet
  const needInvoice = labSamples.filter(
    (s) => (s.workflowStatus === 'In Processing' || !!s.processingDate) && !s.invoiceNo && s.workflowStatus !== 'Rejected'
  );
  const issuedInvoices = labSamples.filter((s) => !!s.invoiceNo);

  // 3. Confirm Payments: Receipt / payment reference uploaded by Admin, waiting for lab confirmation
  const pendingPaymentConfirm = labSamples.filter(
    (s) => !!s.receiptNo && !s.paymentConfirmedByLab && s.workflowStatus !== 'Rejected'
  );
  const confirmedPayments = labSamples.filter((s) => !!s.paymentConfirmedByLab);

  // 4. Issue Certificate: Payment confirmed or proof sent, CoA not yet completed
  const pendingCertificates = labSamples.filter(
    (s) => (s.paymentConfirmedByLab || s.receiptNo) && s.resultStatus !== 'Completed' && s.workflowStatus !== 'Rejected'
  );
  const completedCertificates = labSamples.filter((s) => s.resultStatus === 'Completed');

  // 5. Rejected Samples: Batches rejected during intake inspection
  const rejectedSamples = labSamples.filter((s) => s.workflowStatus === 'Rejected');

  // Filtered samples for active view
  const getDisplaySamples = () => {
    let list = labSamples;
    if (activeSection === 'lab-intake') {
      list = pendingIntake;
    } else if (activeSection === 'lab-invoices') {
      list = labSamples.filter((s) => s.workflowStatus === 'In Processing' || !!s.invoiceNo || !!s.processingDate);
    } else if (activeSection === 'lab-payments') {
      list = labSamples.filter((s) => !!s.receiptNo || !!s.invoiceNo);
    } else if (activeSection === 'lab-certificates') {
      list = labSamples.filter((s) => s.paymentConfirmedByLab || s.receiptNo || s.resultStatus === 'Completed');
    } else if (activeSection === 'lab-rejected' || activeSection === 'rejected-samples') {
      list = rejectedSamples;
    }

    return list.filter((s) => {
      const matchSearch =
        s.sampleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sampleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.batchNo && s.batchNo.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchNature = filterNature ? s.sampleNature.includes(filterNature) : true;
      return matchSearch && matchNature;
    });
  };

  const displaySamples = getDisplaySamples();

  // ── Action State & Modals ──
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 6000);
  };

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 6000);
  };

  // 1. Intake Modal state (Accept / Reject)
  const [intakeSample, setIntakeSample] = useState<Sample | null>(null);
  const [processingDateInput, setProcessingDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [rejectionReason, setRejectionReason] = useState('');

  // 2. Invoice Modal state
  const [invoiceSample, setInvoiceSample] = useState<Sample | null>(null);
  const [invoiceNoInput, setInvoiceNoInput] = useState('');
  const [invoiceAmountInput, setInvoiceAmountInput] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  // 3. Confirm Payment Modal state
  const [confirmPaySample, setConfirmPaySample] = useState<Sample | null>(null);

  // 4. Certificate Upload & Issuance Space state
  const [certSelectedSampleId, setCertSelectedSampleId] = useState<string>('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certResultStatus, setCertResultStatus] = useState<string>('Completed');
  const [certComments, setCertComments] = useState<string>('Analysis completed in full compliance with Halal standards. No prohibited porcine or ethanol traces detected.');

  // ── Action Handlers ──
  const handleAcceptSample = async () => {
    if (!intakeSample) return;
    try {
      setActionLoading(true);
      await api.updateSample(intakeSample._id, {
        processingDate: processingDateInput || new Date().toISOString().split('T')[0],
        workflowStatus: 'In Processing',
        resultStatus: 'In Progress',
        statusNote: `Sample accepted and logged for laboratory analysis on ${processingDateInput}`,
      });
      showSuccess(`Sample [${intakeSample.sampleCode}] has been accepted and moved to In Processing.`);
      setIntakeSample(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showError(err.message || 'Failed to accept sample');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSample = async () => {
    if (!intakeSample) return;
    if (!rejectionReason.trim()) {
      showError('Please provide a reason for rejecting the sample.');
      return;
    }
    try {
      setActionLoading(true);
      await api.updateSample(intakeSample._id, {
        workflowStatus: 'Rejected',
        resultStatus: 'Rejected',
        rejectionReason: rejectionReason.trim(),
        statusNote: rejectionReason.trim(),
      });
      showSuccess(`Sample [${intakeSample.sampleCode}] has been rejected. Notification sent.`);
      setIntakeSample(null);
      setRejectionReason('');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showError(err.message || 'Failed to reject sample');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitInvoice = async () => {
    if (!invoiceSample) return;
    if (!invoiceNoInput.trim()) {
      showError('Please enter an Invoice Number.');
      return;
    }
    try {
      setActionLoading(true);
      let fileUrl = '';
      if (invoiceFile) {
        const uploadRes = await api.uploadFile(invoiceFile);
        fileUrl = uploadRes.fileUrl;
      }

      await api.updateSample(invoiceSample._id, {
        invoiceNo: invoiceNoInput,
        invoiceAmount: invoiceAmountInput,
        invoiceFileUrl: fileUrl || invoiceSample.invoiceFileUrl,
        statusNote: `Invoice ${invoiceNoInput} issued for ${invoiceAmountInput || 'analysis'}. Awaiting admin acknowledgement.`,
      });
      showSuccess(`Invoice [${invoiceNoInput}] successfully submitted for ${invoiceSample.sampleCode}.`);
      setInvoiceSample(null);
      setInvoiceNoInput('');
      setInvoiceAmountInput('');
      setInvoiceFile(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showError(err.message || 'Failed to submit invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async (sample: Sample) => {
    try {
      setActionLoading(true);
      await api.updateSample(sample._id, {
        paymentConfirmedByLab: true,
        statusNote: `Payment confirmed by ${activeLab.shortName}. Receipt: ${sample.receiptNo || 'Verified'}. Sample cleared for certificate issuance.`,
      });
      showSuccess(`Payment for [${sample.sampleCode}] successfully confirmed! You can now issue the certificate.`);
      setConfirmPaySample(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showError(err.message || 'Failed to confirm payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueCertificate = async (targetSampleId?: string) => {
    const sId = targetSampleId || certSelectedSampleId;
    if (!sId) {
      showError('Please select a sample to issue certificate for.');
      return;
    }
    const sample = labSamples.find((s) => s._id === sId);
    if (!sample) return;

    // Enforce: Certificate file must be uploaded before completing
    if (!certFile && !sample.resultFileUrl) {
      showError('You must upload a Certificate of Analysis (PDF or image) before marking this sample as completed.');
      return;
    }

    try {
      setActionLoading(true);
      let fileUrl = '';
      if (certFile) {
        const uploadRes = await api.uploadFile(certFile);
        fileUrl = uploadRes.fileUrl;
      }

      await api.updateSample(sId, {
        resultStatus: certResultStatus || 'Completed',
        workflowStatus: 'Closed',
        resultFileUrl: fileUrl || sample.resultFileUrl,
        resultComments: certComments,
        statusNote: `Certificate of Analysis issued by ${activeLab.shortName}. Test Status: ${certResultStatus}.`,
      });
      showSuccess(`Certificate of Analysis issued for [${sample.sampleCode}]!`);
      setCertSelectedSampleId('');
      setCertFile(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showError(err.message || 'Failed to issue certificate');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Toast Notifications ── */}
      {successToast && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: 10,
            padding: '12px 18px',
            color: '#065f46',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {errorToast && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: 10,
            padding: '12px 18px',
            color: '#991b1b',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} color="#dc2626" />
            <span>{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Top Laboratory Tenant Header Strip ── */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderRadius: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: activeLab.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
            flexShrink: 0,
          }}
        >
          <FlaskConical size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
            {activeLab.name}
          </h2>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Laboratory Portal</span>
        </div>
      </div>


      {/* ── DEDICATED UPLOAD SPACE ON CERTIFICATE PAGE ── */}
      {activeSection === 'lab-certificates' && (
        <div
          className="card"
          style={{
            padding: '24px',
            borderRadius: 14,
            border: '2px solid #ddd6fe',
            background: 'linear-gradient(180deg, #fbfaff 0%, #ffffff 100%)',
            boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#7c3aed',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(124, 58, 237, 0.3)',
                }}
              >
                <Upload size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#4c1d95', margin: 0 }}>
                  Certificate of Analysis (CoA) Upload & Issuance Space
                </h3>
                <p style={{ fontSize: '12px', color: '#6d28d9', margin: '2px 0 0 0' }}>
                  Directly upload the officially signed Certificate of Analysis and issue test results to HDI Admin & client.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 16 }}>
            {/* Field 1: Target Sample */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Select Sample for Certification *
              </label>
              <select
                className="form-select"
                style={{ width: '100%', fontSize: '13px' }}
                value={certSelectedSampleId}
                onChange={(e) => setCertSelectedSampleId(e.target.value)}
              >
                <option value="">-- Choose Eligible Sample --</option>
                {labSamples
                  .filter((s) => s.resultStatus !== 'Completed' && s.workflowStatus !== 'Rejected')
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      [{s.sampleCode}] {s.sampleName} — {s.companyName} {s.paymentConfirmedByLab ? '(Payment Confirmed ✓)' : s.receiptNo ? '(Proof Sent)' : ''}
                    </option>
                  ))}
              </select>
              <span style={{ fontSize: '11px', color: '#6b7280', marginTop: 4, display: 'block' }}>
                Only active samples assigned to {activeLab.shortName} are listed.
              </span>
            </div>

            {/* Field 2: CoA File Upload */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Upload Certificate Document (PDF / Scanned CoA) *
              </label>
              <div
                style={{
                  border: '2px dashed #c4b5fd',
                  borderRadius: 10,
                  padding: '12px 16px',
                  background: '#fcfaff',
                  textAlign: 'center',
                }}
              >
                <input
                  type="file"
                  accept=".pdf,image/*"
                  id="coa-file-upload-input"
                  style={{ display: 'none' }}
                  onChange={(e) => setCertFile(e.target.files ? e.target.files[0] : null)}
                />
                <label
                  htmlFor="coa-file-upload-input"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    color: '#6d28d9',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                >
                  <Upload size={20} color="#7c3aed" />
                  {certFile ? (
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>
                      Selected: {certFile.name} ({(certFile.size / 1024).toFixed(0)} KB)
                    </span>
                  ) : (
                    <span>Click here to select Certificate PDF or scanned image</span>
                  )}
                </label>
              </div>
            </div>

            {/* Field 3: Analytical Result Status */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Analytical Verdict *
              </label>
              <select
                className="form-select"
                style={{ width: '100%', fontSize: '13px' }}
                value={certResultStatus}
                onChange={(e) => setCertResultStatus(e.target.value)}
              >
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Field 4: Analytical Comments */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Laboratory Remarks & Halal Conformity Notes
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', fontSize: '13px' }}
                value={certComments}
                onChange={(e) => setCertComments(e.target.value)}
                placeholder="e.g. Porcine DNA: Negative (<0.01%). Ethanol: 0.00%."
              />
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={() => handleIssueCertificate()}
              disabled={actionLoading || !certSelectedSampleId}
              className="btn btn-primary"
              style={{
                background: '#7c3aed',
                borderColor: '#6d28d9',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Award size={16} />
              {actionLoading ? 'Uploading & Issuing...' : 'Upload & Issue Certificate of Analysis'}
            </button>
          </div>
        </div>
      )}

      {/* ── Active Section Table Card ── */}
      <div className="card" style={{ padding: '20px 24px', borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#111827' }}>
              {activeSection === 'lab-intake' && 'Step 1: Sample Received — Accept or Reject'}
              {activeSection === 'lab-invoices' && 'Step 2: Invoice Sent — Laboratory Invoicing Center'}
              {activeSection === 'lab-payments' && 'Step 3: Confirmed Payment — Verify & Confirm Receipt'}
              {activeSection === 'lab-certificates' && 'Step 4: Issue Certificate of Analysis'}
              {(activeSection === 'lab-rejected' || activeSection === 'rejected-samples') && 'Rejected Samples — Laboratory Intake Rejections'}
              {activeSection === 'lab-portal' && `All Samples Assigned to ${activeLab.name}`}
              {' '}
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                ({displaySamples.length} records)
              </span>
            </h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>
              {activeSection === 'lab-intake' && 'Confirm that dispatched sample batches have physically arrived at your facility. Accept to begin analysis or reject unsuitable samples.'}
              {activeSection === 'lab-invoices' && 'Generate and submit invoices for testing protocols. Admin will acknowledge receipt before releasing payment.'}
              {activeSection === 'lab-payments' && 'Verify bank references and payment proof uploaded by HDI finance team, and confirm receipt.'}
              {activeSection === 'lab-certificates' && 'Upload the final signed Certificate of Analysis (CoA) and submit official analytical remarks.'}
              {(activeSection === 'lab-rejected' || activeSection === 'rejected-samples') && 'Review all sample batches that were rejected during physical intake inspection, including non-compliance reasons and timestamps.'}
              {activeSection === 'lab-portal' && 'Complete laboratory portfolio view with direct access to actions and full details.'}
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
            <div style={{ position: 'relative', width: 220, maxWidth: '100%', flex: '1 1 180px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search code, name, batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 30, fontSize: '12px', height: 34, width: '100%' }}
              />
            </div>

            <select
              value={filterNature}
              onChange={(e) => setFilterNature(e.target.value)}
              className="form-select"
              style={{ fontSize: '12px', height: 34, width: 140, flex: '0 1 140px' }}
            >
              <option value="">All Categories</option>
              <option value="Food">Food (FD)</option>
              <option value="Non-Food">Non-Food (NF)</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap', width: '110px' }}>Sample Code</th>
                <th>Sample Name</th>
                <th style={{ width: '100px' }}>Batch No.</th>
                <th>Client Company</th>
                <th>Required Analysis</th>
                <th style={{ whiteSpace: 'nowrap', width: '100px' }}>Proc. Date</th>
                <th style={{ whiteSpace: 'nowrap', width: '100px' }}>Invoice</th>
                <th style={{ whiteSpace: 'nowrap', width: '100px' }}>Payment</th>
                <th style={{ whiteSpace: 'nowrap', width: '90px' }}>Status</th>
                <th style={{ textAlign: 'right', whiteSpace: 'nowrap', width: '60px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displaySamples.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    No samples found matching this workflow stage or filter criteria.
                  </td>
                </tr>
              ) : (
                displaySamples.map((s) => {
                  const analysisStr = (s.analysisRequired || []).join(', ');

                  return (
                    <tr key={s._id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="code-tag">{s.sampleCode}</span>
                      </td>
                      <td style={{ maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong
                          style={{ fontSize: '13px', color: '#111827', cursor: 'pointer', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={s.sampleName}
                          onClick={() => onSelectSample(s, 'details')}
                        >
                          {s.sampleName}
                        </strong>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }} title={s.batchNo || '—'}>
                        <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                          {s.batchNo || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: '#374151', fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.companyName}>
                        {s.companyName}
                      </td>
                      <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '11.5px', color: '#475569', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={analysisStr || 'Standard Halal Panel'}>
                          {analysisStr || 'Standard Halal Panel'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {s.processingDate ? (
                          <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '12.5px' }}>
                            {new Date(s.processingDate).toLocaleDateString()}
                          </span>
                        ) : s.workflowStatus === 'Rejected' ? (
                          <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : (
                          <span style={{ color: '#d97706', fontSize: '12px', fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {s.invoiceNo ? (
                          <span style={{ fontWeight: 700, color: '#166534', fontSize: '13px' }}>
                            {s.invoiceNo}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Unbilled</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {s.paymentConfirmedByLab ? (
                          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '12.5px' }}>
                            ✓ Confirmed
                          </span>
                        ) : s.receiptNo ? (
                          <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '12px' }} title={`Receipt: ${s.receiptNo}`}>
                            Proof Sent
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Pending</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <StatusBadge status={s.workflowStatus} />
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <TableActionDropdown
                          isOpen={activeMenuId === s._id}
                          onToggle={() => setActiveMenuId(activeMenuId === s._id ? null : s._id)}
                          onClose={() => setActiveMenuId(null)}
                          width={220}
                          iconSize={16}
                          title="Actions & Track Process"
                        >
                          {/* 1. Primary: View Details */}
                          <button
                            className="dropdown-item"
                            style={{ fontWeight: 700, color: '#0f172a' }}
                            onClick={() => {
                              setActiveMenuId(null);
                              onSelectSample(s, 'details');
                            }}
                          >
                            <Eye size={14} color="#0f172a" />
                            <span>View Details</span>
                          </button>

                          {/* 2. Track Process */}
                          <button
                            className="dropdown-item primary-track"
                            onClick={() => {
                              setActiveMenuId(null);
                              setTrackingSample(s);
                            }}
                          >
                            <TrendingUp size={14} color="#0f172a" />
                            <span>Track Process</span>
                          </button>

                          {/* 3. Stage Action shortcuts into View Details */}
                          {(!s.processingDate || s.workflowStatus === 'Sent to Lab' || s.workflowStatus === 'Registered') && s.workflowStatus !== 'Rejected' && (
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setActiveMenuId(null);
                                onSelectSample(s, 'actions');
                              }}
                            >
                              <Package size={14} color="#d97706" />
                              <span>Confirm Sample Received</span>
                            </button>
                          )}

                          {(s.workflowStatus === 'In Processing' || !!s.processingDate) && !s.invoiceNo && s.workflowStatus !== 'Rejected' && (
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setActiveMenuId(null);
                                onSelectSample(s, 'actions');
                              }}
                            >
                              <DollarSign size={14} color="#2563eb" />
                              <span>Send Invoice (Invoice Sent)</span>
                            </button>
                          )}

                          {s.receiptNo && !s.paymentConfirmedByLab && s.workflowStatus !== 'Rejected' && (
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setActiveMenuId(null);
                                onSelectSample(s, 'actions');
                              }}
                            >
                              <CheckCircle2 size={14} color="#16a34a" />
                              <span>Confirmed Payment</span>
                            </button>
                          )}

                          {(s.paymentConfirmedByLab || s.receiptNo) && s.resultStatus !== 'Completed' && s.workflowStatus !== 'Rejected' && (
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setActiveMenuId(null);
                                onSelectSample(s, 'actions');
                              }}
                            >
                              <Award size={14} color="#7c3aed" />
                              <span>Issue Certificate</span>
                            </button>
                          )}

                          {/* 4. Copy Sample Code */}
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              navigator.clipboard.writeText(s.sampleCode);
                            }}
                          >
                            <ClipboardList size={14} />
                            <span>Copy Sample Code</span>
                          </button>
                        </TableActionDropdown>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 1: ACCEPT OR REJECT SAMPLE INTAKE
      ═══════════════════════════════════════════════════════════════ */}
      {intakeSample && (
        <div className="modal-overlay" onClick={() => setIntakeSample(null)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={20} color="#d97706" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Sample Received: Accept or Reject Intake</h3>
              </div>
              <button className="modal-close" onClick={() => setIntakeSample(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Sample info pill */}
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="code-tag">{intakeSample.sampleCode}</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Batch: {intakeSample.batchNo || 'N/A'}</span>
                </div>
                <div style={{ marginTop: 6, fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                  {intakeSample.sampleName}
                </div>
                <div style={{ fontSize: '11.5px', color: '#475569' }}>
                  Client: {intakeSample.companyName} | Lab: {activeLab.name}
                </div>
              </div>

              {/* Action 1: Accept */}
              <div style={{ border: '2px solid #bbf7d0', background: '#f0fdf4', padding: '14px', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <strong style={{ fontSize: '13px', color: '#166534' }}>Option A: Confirm Sample Received & Start Analysis</strong>
                </div>
                <p style={{ fontSize: '11.5px', color: '#15803d', margin: '0 0 10px 0' }}>
                  Confirm sample has physically arrived intact at your testing facility.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#166534' }}>Date Accepted & Analysis Started:</label>
                    <input
                      type="date"
                      className="form-input"
                      style={{ fontSize: '12px', width: 160 }}
                      value={processingDateInput}
                      onChange={(e) => setProcessingDateInput(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleAcceptSample}
                    disabled={actionLoading}
                    className="btn btn-success btn-sm"
                    style={{ alignSelf: 'flex-end', height: 34, fontSize: '12px', fontWeight: 700 }}
                  >
                    <Check size={14} /> Confirm Sample Received
                  </button>
                </div>
              </div>

              {/* Action 2: Reject */}
              <div style={{ border: '2px solid #fecaca', background: '#fef2f2', padding: '14px', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <XCircle size={16} color="#dc2626" />
                  <strong style={{ fontSize: '13px', color: '#991b1b' }}>Option B: Reject Sample</strong>
                </div>
                <p style={{ fontSize: '11.5px', color: '#b91c1c', margin: '0 0 10px 0' }}>
                  If seal is compromised, sample spoiled, or volume insufficient.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Reason for rejection (e.g. broken container, insufficient mass)..."
                    className="form-input"
                    style={{ fontSize: '12px' }}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <button
                    onClick={handleRejectSample}
                    disabled={actionLoading}
                    className="btn btn-danger btn-sm"
                    style={{ alignSelf: 'flex-start', fontSize: '12px', fontWeight: 700 }}
                  >
                    <XCircle size={14} /> Reject Sample
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setIntakeSample(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 2: SEND INVOICE
      ═══════════════════════════════════════════════════════════════ */}
      {invoiceSample && (
        <div className="modal-overlay" onClick={() => setInvoiceSample(null)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Invoice Sent: Issue Analysis Invoice</h3>
              </div>
              <button className="modal-close" onClick={() => setInvoiceSample(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="code-tag">{invoiceSample.sampleCode}</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Client: {invoiceSample.companyName}</span>
                </div>
                <div style={{ marginTop: 4, fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                  {invoiceSample.sampleName}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                  Invoice Number *
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', fontSize: '13px' }}
                  value={invoiceNoInput}
                  onChange={(e) => setInvoiceNoInput(e.target.value)}
                  placeholder="e.g. INV-HYD-2026-081"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                  Invoice Amount (₦)
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', fontSize: '13px' }}
                  value={invoiceAmountInput}
                  onChange={(e) => setInvoiceAmountInput(e.target.value)}
                  placeholder="e.g. ₦185,000"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                  Attach Invoice PDF (optional)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setInvoiceFile(e.target.files ? e.target.files[0] : null)}
                  style={{ fontSize: '12px' }}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setInvoiceSample(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSubmitInvoice}
                disabled={actionLoading || !invoiceNoInput.trim()}
              >
                <DollarSign size={14} /> {actionLoading ? 'Sending...' : 'Send Invoice (Invoice Sent)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 3: CONFIRM PAYMENT
      ═══════════════════════════════════════════════════════════════ */}
      {confirmPaySample && (
        <div className="modal-overlay" onClick={() => setConfirmPaySample(null)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Confirmed Payment: Verify Receipt</h3>
              </div>
              <button className="modal-close" onClick={() => setConfirmPaySample(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>
                HDI finance team has sent payment confirmation for sample <strong>[{confirmPaySample.sampleCode}]</strong>:
              </p>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: 8 }}>
                <div style={{ fontSize: '12px', color: '#065f46' }}>
                  <strong>Payment Reference:</strong> {confirmPaySample.receiptNo || 'Provided'}
                </div>
                {confirmPaySample.receiptFileUrl && (
                  <div style={{ marginTop: 6 }}>
                    <a
                      href={confirmPaySample.receiptFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '2px 8px', gap: 4 }}
                    >
                      <FileText size={12} /> View Payment Receipt Proof
                    </a>
                  </div>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                Confirming payment will authorize the issuance of the official Certificate of Analysis.
              </p>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirmPaySample(null)}>
                Cancel
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={() => handleConfirmPayment(confirmPaySample)}
                disabled={actionLoading}
              >
                <Check size={14} /> {actionLoading ? 'Confirming...' : 'Confirmed Payment (Confirm Receipt)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Tracker Modal */}
      <WorkflowTrackerModal
        sample={trackingSample}
        isOpen={!!trackingSample}
        onClose={() => setTrackingSample(null)}
        onOpenFullDetail={(s) => onSelectSample(s, 'details')}
      />
    </div>
  );
};
