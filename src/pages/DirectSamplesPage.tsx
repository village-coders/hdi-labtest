import React, { useState, useEffect, useRef } from 'react';
import { Sample, Company } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  Layers,
  FileSpreadsheet,
  Search,
  FileText,
  Receipt,
  Award,
  FileCheck,
  Eye,
  Clock,
  PlusCircle,
  MoreVertical,
  ExternalLink,
  CheckCircle2,
  Building2,
  Calendar,
} from 'lucide-react';

interface DirectSamplesPageProps {
  samples: Sample[];
  companies: Company[];
  onSelectSample: (sample: Sample) => void;
  openUploadDirectModal: () => void;
  openBulkUploadModal: () => void;
  onRefreshData?: () => void;
}

export const DirectSamplesPage: React.FC<DirectSamplesPageProps> = ({
  samples,
  onSelectSample,
  openUploadDirectModal,
  openBulkUploadModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'INVOICED' | 'PROCESSING'>('ALL');
  const [natureFilter, setNatureFilter] = useState('ALL');

  // Three-dot action dropdown state
  const [activeMenuSampleId, setActiveMenuSampleId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuSampleId(null);
      }
    };
    if (activeMenuSampleId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuSampleId]);

  // STRICT FILTER: Only include samples registered/uploaded as Direct or Historical
  // Standard newly registered samples (from Registry Desk / Dashboard) are NEVER included here
  const directSamplesBase = samples.filter(
    (s) => s.isDirectSample === true || s.isHistorical === true
  );

  // Calculate KPI metrics
  const totalDirect = directSamplesBase.length;
  const completedWithCoA = directSamplesBase.filter(
    (s) => s.resultFileUrl || s.resultStatus === 'Completed' || s.workflowStatus === 'Closed'
  ).length;
  const invoicedAndSettled = directSamplesBase.filter(
    (s) => (s.invoiceNo || s.invoiceFileUrl) && (s.receiptNo || s.receiptFileUrl || s.paymentConfirmedByLab)
  ).length;
  const inProcessing = directSamplesBase.filter(
    (s) => s.workflowStatus === 'In Processing' || s.workflowStatus === 'Sent to Lab' || !s.resultFileUrl
  ).length;

  // Filtered samples for table
  const filteredSamples = directSamplesBase.filter((s) => {
    // Status filter
    if (statusFilter === 'COMPLETED') {
      const isDone = s.resultFileUrl || s.resultStatus === 'Completed' || s.workflowStatus === 'Closed';
      if (!isDone) return false;
    } else if (statusFilter === 'INVOICED') {
      const hasInvoice = s.invoiceNo || s.invoiceFileUrl;
      const hasPayment = s.receiptNo || s.receiptFileUrl || s.paymentConfirmedByLab;
      if (!hasInvoice || !hasPayment) return false;
    } else if (statusFilter === 'PROCESSING') {
      const isDone = s.resultFileUrl || s.resultStatus === 'Completed' || s.workflowStatus === 'Closed';
      if (isDone) return false;
    }

    // Nature filter
    if (natureFilter !== 'ALL') {
      if (!s.sampleNature.toLowerCase().includes(natureFilter.toLowerCase())) return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const match =
        s.sampleCode.toLowerCase().includes(q) ||
        s.sampleName.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q) ||
        (s.batchNo && s.batchNo.toLowerCase().includes(q)) ||
        (s.invoiceNo && s.invoiceNo.toLowerCase().includes(q)) ||
        (s.receiptNo && s.receiptNo.toLowerCase().includes(q)) ||
        (s.nafdacNo && s.nafdacNo.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ── Top Header Strip ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '19px',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.3px',
                }}
              >
                Direct Samples Desk
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Dedicated repository for direct intake and historical samples with invoices, payment proofs, and certificates.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            onClick={openBulkUploadModal}
            className="btn btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Import multiple direct samples from Excel or CSV spreadsheet"
          >
            <FileSpreadsheet size={15} color="#0284c7" />
            <span>Bulk Spreadsheet Import</span>
          </button>

          <button
            type="button"
            onClick={openUploadDirectModal}
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '12.5px',
              fontWeight: 700,
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
            }}
            title="Upload a new direct sample with invoices, payment proofs, and certificates"
          >
            <PlusCircle size={15} />
            <span>Upload Direct Sample</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards Strip ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: 12,
        }}
      >
        <div className="card" style={{ padding: '16px 18px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>Total Direct Samples</span>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                {totalDirect}
              </h3>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
              <Layers size={18} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#0369a1' }}>With Certificate (CoA)</span>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0284c7', margin: '4px 0 0 0' }}>
                {completedWithCoA}
              </h3>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Award size={18} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#166534' }}>Invoiced &amp; Settled</span>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a', margin: '4px 0 0 0' }}>
                {invoicedAndSettled}
              </h3>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <Receipt size={18} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#b45309' }}>In Processing</span>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#d97706', margin: '4px 0 0 0' }}>
                {inProcessing}
              </h3>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters Strip ── */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          borderRadius: 12,
        }}
      >
        {/* Status Pills */}
        <div className="touch-scroll-row" style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', maxWidth: '100%', paddingBottom: 2 }}>
          {[
            { id: 'ALL', label: 'All Direct', count: directSamplesBase.length },
            { id: 'COMPLETED', label: 'Completed (CoA Issued)', count: completedWithCoA },
            { id: 'INVOICED', label: 'Invoiced & Paid', count: invoicedAndSettled },
            { id: 'PROCESSING', label: 'In Processing', count: inProcessing },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className="btn btn-sm"
                style={{
                  background: isActive ? '#0f172a' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#475569',
                  borderRadius: 99,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '11.5px',
                  padding: '4px 12px',
                  whiteSpace: 'nowrap',
                  border: 'none',
                }}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Search & Nature Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: '1 1 260px', justifyContent: 'flex-end' }}>
          <select
            className="form-select"
            value={natureFilter}
            onChange={(e) => setNatureFilter(e.target.value)}
            style={{ fontSize: '12px', padding: '6px 10px', width: 'auto', maxWidth: 160 }}
          >
            <option value="ALL">All Categories</option>
            <option value="Food">Food / Food Grade</option>
            <option value="Cosmetic">Cosmetics</option>
            <option value="Chemical">Chemical</option>
            <option value="Pharmaceutical">Pharmaceutical</option>
          </select>

          <div style={{ position: 'relative', width: 220, maxWidth: '100%' }}>
            <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search code, name, invoice..."
              className="form-input"
              style={{ paddingLeft: 30, fontSize: '12px', padding: '6px 10px 6px 30px', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Clean Direct Samples Table ── */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ whiteSpace: 'nowrap' }}>Sample Code</th>
              <th style={{ minWidth: 180 }}>Sample Name</th>
              <th style={{ minWidth: 160 }}>Client Company</th>
              <th style={{ whiteSpace: 'nowrap' }}>Date of Entry</th>
              <th style={{ whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ minWidth: 140 }}>Assigned Lab</th>
              <th style={{ textAlign: 'center', width: 70, whiteSpace: 'nowrap' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSamples.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                  <Layers size={36} color="#94a3b8" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                    No Direct Samples Found
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#64748b', maxWidth: 440, margin: '0 auto 16px auto' }}>
                    {searchTerm || statusFilter !== 'ALL'
                      ? 'No sample records match your search or filter criteria. Try resetting filters.'
                      : 'You have not uploaded any direct or historical samples yet. Standard registered samples do not appear here. Click "Upload Direct Sample" above to record a direct intake sample.'}
                  </p>
                  <button
                    type="button"
                    onClick={openUploadDirectModal}
                    className="btn btn-primary btn-sm"
                    style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <PlusCircle size={14} /> Upload First Direct Sample
                  </button>
                </td>
              </tr>
            ) : (
              filteredSamples.map((sample) => {
                const isMenuOpen = activeMenuSampleId === sample._id;
                const hasInvoice = Boolean(sample.invoiceFileUrl || sample.invoiceNo);
                const hasReceipt = Boolean(sample.receiptFileUrl || sample.receiptNo);
                const hasCert = Boolean(sample.resultFileUrl);
                const hasDossier = Boolean(sample.attachmentUrl);

                return (
                  <tr key={sample._id} style={{ position: 'relative' }}>
                    {/* Sample Code */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="code-tag" style={{ fontSize: '11.5px', padding: '3px 7px' }}>
                        {sample.sampleCode}
                      </span>
                    </td>

                    {/* Sample Name & Nature */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                        {sample.sampleName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: sample.sampleNature.toLowerCase().includes('food') ? '#dcfce7' : '#eff6ff',
                            color: sample.sampleNature.toLowerCase().includes('food') ? '#166534' : '#1d4ed8',
                          }}
                        >
                          {sample.sampleNature}
                        </span>
                        {sample.batchNo && (
                          <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                            Batch: {sample.batchNo}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Company */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '12.5px' }}>
                        {sample.companyName}
                      </div>
                      {sample.companyAddress && (
                        <div style={{ fontSize: '11px', color: '#64748b', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sample.companyAddress}
                        </div>
                      )}
                    </td>

                    {/* Date of Entry */}
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: '#64748b' }}>
                      {new Date(sample.dateOfEntry).toLocaleDateString()}
                    </td>

                    {/* Workflow Status */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge status={sample.workflowStatus} />
                    </td>

                    {/* Assigned Lab */}
                    <td>
                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                        {sample.receivingLabName}
                      </div>
                    </td>

                    {/* Three-Dot Action Button & Dropdown Menu */}
                    <td style={{ textAlign: 'center', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuSampleId(isMenuOpen ? null : sample._id);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{
                          width: 32,
                          height: 32,
                          padding: 0,
                          borderRadius: 8,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isMenuOpen ? '#0f172a' : '#ffffff',
                          color: isMenuOpen ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          cursor: 'pointer',
                        }}
                        title="Actions & Documents"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: 40,
                            width: 230,
                            maxWidth: 'calc(100vw - 32px)',
                            background: '#ffffff',
                            borderRadius: 10,
                            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(0, 0, 0, 0.08)',
                            border: '1px solid #e2e8f0',
                            zIndex: 100,
                            padding: '6px 0',
                            textAlign: 'left',
                            animation: 'fadeIn 0.15s ease',
                          }}
                        >
                          <div style={{ padding: '6px 12px 6px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {sample.sampleCode} Actions
                          </div>

                          {/* 1. Primary Action: View Details (Full Dossier) */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuSampleId(null);
                              onSelectSample(sample);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              background: 'none',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: '12.5px',
                              fontWeight: 700,
                              color: '#0f172a',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                          >
                            <Eye size={14} color="#2563eb" />
                            <span>View Details &amp; Dossier</span>
                          </button>

                          {/* 2. Direct Document Links Section */}
                          {(hasInvoice || hasReceipt || hasCert || hasDossier) && (
                            <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0', padding: '4px 0' }}>
                              {/* Open Invoice Document */}
                              {sample.invoiceFileUrl && (
                                <a
                                  href={sample.invoiceFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setActiveMenuSampleId(null)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '7px 12px',
                                    fontSize: '12px',
                                    color: '#7c3aed',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#faf5ff')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  <FileText size={13} color="#7c3aed" />
                                  <span>View Invoice Document ↗</span>
                                </a>
                              )}

                              {/* Open Payment Proof Receipt */}
                              {sample.receiptFileUrl && (
                                <a
                                  href={sample.receiptFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setActiveMenuSampleId(null)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '7px 12px',
                                    fontSize: '12px',
                                    color: '#16a34a',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  <Receipt size={13} color="#16a34a" />
                                  <span>View Proof of Payment ↗</span>
                                </a>
                              )}

                              {/* Open Signed Certificate (CoA) */}
                              {sample.resultFileUrl && (
                                <a
                                  href={sample.resultFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setActiveMenuSampleId(null)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '7px 12px',
                                    fontSize: '12px',
                                    color: '#0284c7',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  <Award size={13} color="#0284c7" />
                                  <span>View Certificate (CoA) ↗</span>
                                </a>
                              )}

                              {/* Open Technical Spec Dossier */}
                              {sample.attachmentUrl && (
                                <a
                                  href={sample.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setActiveMenuSampleId(null)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '7px 12px',
                                    fontSize: '12px',
                                    color: '#334155',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  <FileCheck size={13} color="#64748b" />
                                  <span>View Technical Dossier ↗</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
