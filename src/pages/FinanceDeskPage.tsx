import React, { useState, useEffect, useMemo } from 'react';
import { Sample } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  Receipt,
  DollarSign,
  CheckCircle2,
  Clock,
  Eye,
  TrendingUp,
  MoreHorizontal,
  FileText,
  ClipboardList,
  Search,
  X,
  Copy,
} from 'lucide-react';
import { WorkflowTrackerModal } from '../components/samples/WorkflowTrackerModal.js';
import { TableActionDropdown } from '../components/common/TableActionDropdown.js';

interface FinanceDeskPageProps {
  samples: Sample[];
  onSelectSample: (sample: Sample) => void;
}

type FinanceFilterStatus = 'ALL' | 'PENDING' | 'AWAITING_PAYMENT' | 'PAID' | 'AWAITING_CERT';

export const FinanceDeskPage: React.FC<FinanceDeskPageProps> = ({
  samples,
  onSelectSample,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [trackingSample, setTrackingSample] = useState<Sample | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FinanceFilterStatus>('ALL');

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

  const allInvoiced = useMemo(() => samples.filter((s) => s.invoiceNo), [samples]);
  const pendingAck = useMemo(() => samples.filter((s) => s.invoiceNo && !s.invoiceAcknowledged), [samples]);
  const pendingPayment = useMemo(() => samples.filter((s) => s.invoiceNo && s.invoiceAcknowledged && !s.receiptNo), [samples]);
  const paidSamples = useMemo(() => samples.filter((s) => s.receiptNo), [samples]);
  const awaitingCert = useMemo(() => samples.filter((s) => s.receiptNo && s.resultStatus !== 'Completed'), [samples]);

  const filteredInvoices = useMemo(() => {
    return allInvoiced.filter((s) => {
      // 1. Status Filter
      if (statusFilter === 'PENDING' && (s.invoiceAcknowledged || s.receiptNo)) return false;
      if (statusFilter === 'AWAITING_PAYMENT' && (!s.invoiceAcknowledged || s.receiptNo)) return false;
      if (statusFilter === 'PAID' && !s.receiptNo) return false;
      if (statusFilter === 'AWAITING_CERT' && (!s.receiptNo || s.resultStatus === 'Completed')) return false;

      // 2. Search Term Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches =
          s.sampleCode.toLowerCase().includes(q) ||
          s.sampleName.toLowerCase().includes(q) ||
          s.companyName.toLowerCase().includes(q) ||
          (s.receivingLabName && s.receivingLabName.toLowerCase().includes(q)) ||
          (s.invoiceNo && s.invoiceNo.toLowerCase().includes(q)) ||
          (s.batchNo && s.batchNo.toLowerCase().includes(q)) ||
          (s.receiptNo && s.receiptNo.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [allInvoiced, statusFilter, searchTerm]);

  const getPaymentStatus = (s: Sample) => {
    if (s.resultStatus === 'Completed') return { label: 'Completed', color: '#166534', bg: '#dcfce7' };
    if (s.receiptNo && s.paymentConfirmedByLab) return { label: 'Paid', color: '#166534', bg: '#dcfce7' };
    if (s.receiptNo) return { label: 'Paid', color: '#166534', bg: '#dcfce7' };
    if (s.invoiceAcknowledged) return { label: 'Awaiting Payment', color: '#b45309', bg: '#fef3c7' };
    if (s.invoiceNo) return { label: 'Pending', color: '#9a3412', bg: '#fef2f2' };
    return { label: 'No Invoice', color: '#6b7280', bg: '#f3f4f6' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Finance Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          Finance &amp; Invoice Settlement Desk
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Track laboratory invoices, acknowledge billing, and record payment proofs. Click the actions menu on any row to view full details and track process.
        </p>
      </div>

      {/* KPI Cards — Clickable to quickly filter status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
          gap: 14,
        }}
      >
        {/* Total Invoices */}
        <div
          className="card"
          onClick={() => setStatusFilter('ALL')}
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: statusFilter === 'ALL' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            background: statusFilter === 'ALL' ? '#f8faff' : '#ffffff',
            transition: 'all 0.15s ease',
          }}
          title="Click to view all invoices"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Total Invoices
            </span>
            <Receipt size={17} color="#2563eb" />
          </div>
          <h3 style={{ fontSize: '26px', fontWeight: 800, margin: 0 }}>{allInvoiced.length}</h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Issued by labs</span>
        </div>

        {/* Pending Acknowledgment */}
        <div
          className="card"
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: statusFilter === 'PENDING' ? '2px solid #dc2626' : '1px solid #e2e8f0',
            background: statusFilter === 'PENDING' ? '#fff5f5' : '#ffffff',
            transition: 'all 0.15s ease',
          }}
          title="Click to filter invoices awaiting acknowledgment"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Pending
            </span>
            <Clock size={17} color="#dc2626" />
          </div>
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', margin: 0 }}>{pendingAck.length}</h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Awaiting acknowledgement</span>
        </div>

        {/* Awaiting Payment */}
        <div
          className="card"
          onClick={() => setStatusFilter(statusFilter === 'AWAITING_PAYMENT' ? 'ALL' : 'AWAITING_PAYMENT')}
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: statusFilter === 'AWAITING_PAYMENT' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
            background: statusFilter === 'AWAITING_PAYMENT' ? '#fffdf7' : '#ffffff',
            transition: 'all 0.15s ease',
          }}
          title="Click to filter invoices awaiting payment"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Awaiting Payment
            </span>
            <DollarSign size={17} color="#f59e0b" />
          </div>
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', margin: 0 }}>{pendingPayment.length}</h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Invoice ack'd, not paid</span>
        </div>

        {/* Paid */}
        <div
          className="card"
          onClick={() => setStatusFilter(statusFilter === 'PAID' ? 'ALL' : 'PAID')}
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: statusFilter === 'PAID' ? '2px solid #10b981' : '1px solid #e2e8f0',
            background: statusFilter === 'PAID' ? '#f0fdf4' : '#ffffff',
            transition: 'all 0.15s ease',
          }}
          title="Click to filter paid invoices"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Paid
            </span>
            <CheckCircle2 size={17} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', margin: 0 }}>{paidSamples.length}</h3>
          <span style={{ fontSize: '11px', color: '#16a34a' }}>Payment confirmed & sent</span>
        </div>

        {/* Awaiting Certificate */}
        <div
          className="card"
          onClick={() => setStatusFilter(statusFilter === 'AWAITING_CERT' ? 'ALL' : 'AWAITING_CERT')}
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: statusFilter === 'AWAITING_CERT' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
            background: statusFilter === 'AWAITING_CERT' ? '#faf5ff' : '#ffffff',
            transition: 'all 0.15s ease',
          }}
          title="Click to filter paid samples awaiting certificate"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Awaiting Certificate
            </span>
            <TrendingUp size={17} color="#7c3aed" />
          </div>
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#7c3aed', margin: 0 }}>{awaitingCert.length}</h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Paid, cert not yet issued</span>
        </div>
      </div>

      {/* Invoice Table Container */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Laboratory Invoices &amp; Payment Tracking
            </h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0 0' }}>
              Click the three dots action on any row to view details, track process, and settle payments.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
              Showing {filteredInvoices.length} of {allInvoiced.length} invoices
            </span>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {/* Status Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: 99 }}
            >
              All ({allInvoiced.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`btn btn-sm ${statusFilter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                borderRadius: 99,
                color: statusFilter === 'PENDING' ? '#ffffff' : '#dc2626',
              }}
            >
              Pending ({pendingAck.length})
            </button>
            <button
              onClick={() => setStatusFilter('AWAITING_PAYMENT')}
              className={`btn btn-sm ${statusFilter === 'AWAITING_PAYMENT' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                borderRadius: 99,
                color: statusFilter === 'AWAITING_PAYMENT' ? '#ffffff' : '#b45309',
              }}
            >
              Awaiting Payment ({pendingPayment.length})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`btn btn-sm ${statusFilter === 'PAID' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                borderRadius: 99,
                color: statusFilter === 'PAID' ? '#ffffff' : '#166534',
              }}
            >
              Paid ({paidSamples.length})
            </button>
            <button
              onClick={() => setStatusFilter('AWAITING_CERT')}
              className={`btn btn-sm ${statusFilter === 'AWAITING_CERT' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                borderRadius: 99,
                color: statusFilter === 'AWAITING_CERT' ? '#ffffff' : '#7c3aed',
              }}
            >
              Awaiting Cert ({awaitingCert.length})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: 260, maxWidth: '100%', flex: '1 1 200px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search code, invoice, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{
                width: '100%',
                padding: '6px 28px 6px 30px',
                fontSize: '12px',
                borderRadius: 8,
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 2,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Sample Code</th>
                <th style={{ fontSize: '12px' }}>Sample Name</th>
                <th style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Batch No.</th>
                <th style={{ fontSize: '12px' }}>Company</th>
                <th style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Lab</th>
                <th style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Invoice No.</th>
                <th style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ fontSize: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                    {searchTerm || statusFilter !== 'ALL'
                      ? 'No invoices match your filter criteria.'
                      : 'No invoices recorded yet. When external labs issue invoices, they will appear here.'}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((s) => {
                  const ps = getPaymentStatus(s);
                  const isMenuOpen = activeMenuId === s._id;
                  const nameTruncated = s.sampleName.length > 28 ? s.sampleName.slice(0, 28) + '…' : s.sampleName;
                  const companyTruncated = s.companyName.length > 22 ? s.companyName.slice(0, 22) + '…' : s.companyName;
                  return (
                    <tr key={s._id}>
                      {/* 1. Sample Code */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="code-tag" style={{ fontSize: '11px' }}>{s.sampleCode}</span>
                      </td>

                      {/* 2. Sample Name — cleanly truncated */}
                      <td style={{ maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong
                          style={{ fontSize: '13px', color: '#111827', fontWeight: 700, cursor: 'pointer' }}
                          title={s.sampleName}
                          onClick={() => onSelectSample(s)}
                        >
                          {nameTruncated}
                        </strong>
                      </td>

                      {/* 3. Batch No — split out */}
                      <td style={{ whiteSpace: 'nowrap', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }} title={s.batchNo || '—'}>
                        {s.batchNo ? (
                          <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{s.batchNo}</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 4. Company */}
                      <td style={{ fontSize: '13px', color: '#374151', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={s.companyName}>
                        {companyTruncated}
                      </td>

                      {/* 5. Lab */}
                      <td style={{ whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }} title={s.receivingLabName}>
                        <strong style={{ fontSize: '12.5px', color: '#1e293b', fontWeight: 600 }}>
                          {s.receivingLabName}
                        </strong>
                      </td>

                      {/* 6. Invoice No */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong style={{ color: '#0f172a', fontSize: '13px', fontWeight: 800 }}>{s.invoiceNo}</strong>
                      </td>

                      {/* 7. Status */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            background: ps.bg,
                            color: ps.color,
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 99,
                            display: 'inline-block',
                          }}
                        >
                          {ps.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <TableActionDropdown
                          isOpen={isMenuOpen}
                          onToggle={() => setActiveMenuId(isMenuOpen ? null : s._id)}
                          onClose={() => setActiveMenuId(null)}
                          width={205}
                          iconSize={16}
                          title="Actions & Track Process"
                        >
                          <button
                            className="dropdown-item"
                            style={{ fontWeight: 700, color: '#0f172a' }}
                            onClick={() => {
                              setActiveMenuId(null);
                              onSelectSample(s);
                            }}
                          >
                            <Eye size={14} color="#0f172a" />
                            <span>View Details</span>
                          </button>

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

                          {s.invoiceNo && (
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setActiveMenuId(null);
                                navigator.clipboard.writeText(s.invoiceNo || '');
                              }}
                            >
                              <Receipt size={14} />
                              <span>Copy Invoice No</span>
                            </button>
                          )}

                          {s.receiptNo && (
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setActiveMenuId(null);
                                navigator.clipboard.writeText(s.receiptNo || '');
                              }}
                            >
                              <DollarSign size={14} />
                              <span>Copy Receipt No</span>
                            </button>
                          )}
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

      {/* Workflow Tracker Modal */}
      <WorkflowTrackerModal
        sample={trackingSample}
        isOpen={!!trackingSample}
        onClose={() => setTrackingSample(null)}
        onOpenFullDetail={(s) => onSelectSample(s)}
      />
    </div>
  );
};
