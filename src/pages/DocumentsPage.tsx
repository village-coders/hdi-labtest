import React, { useState, useMemo, useEffect } from 'react';
import { Sample, Company } from '../types/index.js';
import {
  Folder,
  FileText,
  Download,
  Search,
  Filter,
  ExternalLink,
  Receipt,
  CreditCard,
  Award,
  Building2,
  Eye,
  CheckCircle2,
  MoreHorizontal,
  TrendingUp,
  ClipboardList,
} from 'lucide-react';
import { WorkflowTrackerModal } from '../components/samples/WorkflowTrackerModal.js';
import { TableActionDropdown } from '../components/common/TableActionDropdown.js';

interface DocumentsPageProps {
  samples: Sample[];
  companies: Company[];
  onSelectSample: (sample: Sample) => void;
}

interface DocumentItem {
  id: string;
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  companyName: string;
  labName: string;
  type: 'CERTIFICATE' | 'INVOICE' | 'PAYMENT_PROOF' | 'SPEC_ATTACHMENT';
  typeLabel: string;
  typeColor: string;
  typeBg: string;
  title: string;
  fileUrl: string;
  refNo: string;
  date: string | Date;
  sample: Sample;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  samples,
  companies,
  onSelectSample,
}) => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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

  // Extract all documents sent and received across sample records
  const allDocuments = useMemo(() => {
    const docs: DocumentItem[] = [];

    samples.forEach((s) => {
      // 1. Certificate of Analysis (Issued by Lab)
      if (s.resultFileUrl) {
        docs.push({
          id: `${s._id}-cert`,
          sampleId: s._id,
          sampleCode: s.sampleCode,
          sampleName: s.sampleName,
          companyName: s.companyName,
          labName: s.receivingLabName,
          type: 'CERTIFICATE',
          typeLabel: 'Certificate of Analysis (CoA)',
          typeColor: '#16a34a',
          typeBg: '#dcfce7',
          title: `Halal Analysis Certificate — ${s.sampleName}`,
          fileUrl: s.resultFileUrl,
          refNo: `CERT-${s.sampleCode.replace(/\//g, '-')}`,
          date: s.updatedAt || s.dateOfEntry,
          sample: s,
        });
      }

      // 2. Invoice Document (Sent by Lab)
      if (s.invoiceFileUrl || s.invoiceNo) {
        docs.push({
          id: `${s._id}-inv`,
          sampleId: s._id,
          sampleCode: s.sampleCode,
          sampleName: s.sampleName,
          companyName: s.companyName,
          labName: s.receivingLabName,
          type: 'INVOICE',
          typeLabel: 'Laboratory Invoice',
          typeColor: '#1d4ed8',
          typeBg: '#eff6ff',
          title: `Testing Invoice — ${s.sampleName}`,
          fileUrl: s.invoiceFileUrl || '#',
          refNo: s.invoiceNo || 'INV-PENDING',
          date: s.processingDate || s.dateOfEntry,
          sample: s,
        });
      }

      // 3. Proof of Payment (Sent to Lab by Admin/Finance)
      if (s.receiptFileUrl || s.receiptNo) {
        docs.push({
          id: `${s._id}-receipt`,
          sampleId: s._id,
          sampleCode: s.sampleCode,
          sampleName: s.sampleName,
          companyName: s.companyName,
          labName: s.receivingLabName,
          type: 'PAYMENT_PROOF',
          typeLabel: 'Proof of Payment / Bank Slip',
          typeColor: '#b45309',
          typeBg: '#fef3c7',
          title: `Payment Proof — ${s.sampleName}`,
          fileUrl: s.receiptFileUrl || '#',
          refNo: s.receiptNo || 'REC-PENDING',
          date: s.updatedAt || s.dateOfEntry,
          sample: s,
        });
      }

      // 4. Registration Technical Dossier / Spec Sheet
      if (s.attachmentUrl) {
        docs.push({
          id: `${s._id}-spec`,
          sampleId: s._id,
          sampleCode: s.sampleCode,
          sampleName: s.sampleName,
          companyName: s.companyName,
          labName: s.receivingLabName,
          type: 'SPEC_ATTACHMENT',
          typeLabel: 'Technical Spec / Batch Dossier',
          typeColor: '#475569',
          typeBg: '#f1f5f9',
          title: `Technical Specification — ${s.sampleName}`,
          fileUrl: s.attachmentUrl,
          refNo: s.batchNo ? `BATCH-${s.batchNo}` : `SPEC-${s.sampleCode}`,
          date: s.dateOfEntry,
          sample: s,
        });
      }
    });

    return docs;
  }, [samples]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return allDocuments.filter((d) => {
      const matchCompany = selectedCompany ? d.companyName === selectedCompany : true;
      const matchCat = selectedCategory ? d.type === selectedCategory : true;
      const matchSearch =
        d.sampleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.sampleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCompany && matchCat && matchSearch;
    });
  }, [allDocuments, selectedCompany, selectedCategory, searchTerm]);

  const certsCount = allDocuments.filter((d) => d.type === 'CERTIFICATE').length;
  const invoicesCount = allDocuments.filter((d) => d.type === 'INVOICE').length;
  const receiptsCount = allDocuments.filter((d) => d.type === 'PAYMENT_PROOF').length;
  const specsCount = allDocuments.filter((d) => d.type === 'SPEC_ATTACHMENT').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.3px' }}>
          Company Document Management Center
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Central repository for all documents sent and received per client company — Laboratory Invoices, Bank Payment Receipts, and Halal Certificates of Analysis (CoAs).
        </p>
      </div>

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
          gap: 14,
        }}
      >
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Total Documents</span>
            <Folder size={18} color="#2563eb" />
          </div>
          <h3 style={{ fontSize: '26px', fontWeight: 800, margin: 0 }}>{allDocuments.length}</h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Across all companies</span>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#166534' }}>Halal Certificates</span>
            <Award size={18} color="#16a34a" />
          </div>
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#16a34a', margin: 0 }}>{certsCount}</h3>
          <span style={{ fontSize: '11px', color: '#16a34a' }}>Issued CoAs</span>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#1d4ed8' }}>Lab Invoices</span>
            <Receipt size={18} color="#2563eb" />
          </div>
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#2563eb', margin: 0 }}>{invoicesCount}</h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Received from labs</span>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#b45309' }}>Payment Receipts</span>
            <CreditCard size={18} color="#d97706" />
          </div>
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', margin: 0 }}>{receiptsCount}</h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Dispatched to labs</span>
        </div>
      </div>

      {/* Document Table Card */}
      <div className="card" style={{ padding: '20px 24px', borderRadius: 14 }}>
        {/* Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: 240, maxWidth: '100%', flex: '1 1 200px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search doc, code, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 30, fontSize: '12px', height: 34, width: '100%' }}
              />
            </div>

            {/* Company Filter */}
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="form-select"
              style={{ fontSize: '12px', height: 34, width: 190, maxWidth: '100%', flex: '1 1 160px' }}
            >
              <option value="">All Client Companies</option>
              {companies.map((c) => (
                <option key={c._id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Document Type Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-select"
              style={{ fontSize: '12px', height: 34, width: 180, maxWidth: '100%', flex: '1 1 150px' }}
            >
              <option value="">All Document Types</option>
              <option value="CERTIFICATE">Certificates of Analysis</option>
              <option value="INVOICE">Lab Invoices</option>
              <option value="PAYMENT_PROOF">Payment Proof Receipts</option>
              <option value="SPEC_ATTACHMENT">Technical Specs / Dossiers</option>
            </select>
          </div>

          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            Showing {filteredDocs.length} of {allDocuments.length} documents
          </span>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ fontSize: '12px', width: '105px' }}>Sample Code</th>
                <th style={{ fontSize: '12px' }}>Document Title / Sample</th>
                <th style={{ fontSize: '12px' }}>Company</th>
                <th style={{ fontSize: '12px', width: '160px' }}>Category</th>
                <th style={{ fontSize: '12px', width: '120px' }}>Reference No.</th>
                <th style={{ fontSize: '12px' }}>Testing Lab</th>
                <th style={{ fontSize: '12px', width: '95px' }}>Date</th>
                <th style={{ fontSize: '12px', textAlign: 'right', width: '70px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                    No sent or received documents match the selected company or category filter.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isMenuOpen = activeMenuId === doc.id;
                  return (
                    <tr key={doc.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="code-tag" style={{ fontSize: '11px' }}>{doc.sampleCode}</span>
                      </td>
                      <td>
                        <strong
                          style={{ fontSize: '13px', color: '#111827', display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                          title={doc.title}
                          onClick={() => onSelectSample(doc.sample)}
                        >
                          {doc.title}
                        </strong>
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#64748b',
                            display: 'block',
                            maxWidth: 220,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={doc.sampleName}
                        >
                          Product: {doc.sampleName}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.companyName}>
                          {doc.companyName}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            background: doc.typeBg,
                            color: doc.typeColor,
                            padding: '3px 9px',
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: '11.5px',
                            display: 'inline-block',
                          }}
                        >
                          {doc.typeLabel}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                          {doc.refNo}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 500 }} title={doc.labName}>
                          {doc.labName}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: '12.5px' }}>
                        {new Date(doc.date).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <TableActionDropdown
                          isOpen={isMenuOpen}
                          onToggle={() => setActiveMenuId(isMenuOpen ? null : doc.id)}
                          onClose={() => setActiveMenuId(null)}
                          width={200}
                          iconSize={16}
                          title="Actions & Track Process"
                        >
                          <button
                            className="dropdown-item"
                            style={{ fontWeight: 700, color: '#0f172a' }}
                            onClick={() => {
                              setActiveMenuId(null);
                              onSelectSample(doc.sample);
                            }}
                          >
                            <Eye size={14} color="#0f172a" />
                            <span>View Details</span>
                          </button>

                          <button
                            className="dropdown-item primary-track"
                            onClick={() => {
                              setActiveMenuId(null);
                              setTrackingSample(doc.sample);
                            }}
                          >
                            <TrendingUp size={14} color="#0f172a" />
                            <span>Track Process</span>
                          </button>

                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              navigator.clipboard.writeText(doc.refNo);
                            }}
                          >
                            <ClipboardList size={14} />
                            <span>Copy Reference</span>
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
