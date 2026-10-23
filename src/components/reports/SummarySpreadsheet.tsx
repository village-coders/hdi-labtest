import React, { useState, useMemo, useEffect } from 'react';
import { Sample, Company } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  RotateCcw,
  FileText,
  Calendar,
  Building2,
  ExternalLink,
  Eye,
  MoreHorizontal,
  TrendingUp,
  ClipboardList,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { WorkflowTrackerModal } from '../samples/WorkflowTrackerModal.js';
import { TableActionDropdown } from '../common/TableActionDropdown.js';

interface SummarySpreadsheetProps {
  samples: Sample[];
  companies: Company[];
  onSelectSample: (sample: Sample) => void;
}

export const SummarySpreadsheet: React.FC<SummarySpreadsheetProps> = ({
  samples,
  companies,
  onSelectSample,
}) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [labFilter, setLabFilter] = useState('');
  const [natureFilter, setNatureFilter] = useState('');
  const [analysisFilter, setAnalysisFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Dropdown & Tracking states
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

  const filteredSamples = useMemo(() => {
    return samples.filter((s) => {
      // Search across all fields
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches =
          s.sampleCode.toLowerCase().includes(query) ||
          s.sampleName.toLowerCase().includes(query) ||
          s.companyName.toLowerCase().includes(query) ||
          (s.batchNo && s.batchNo.toLowerCase().includes(query)) ||
          (s.nafdacNo && s.nafdacNo.toLowerCase().includes(query)) ||
          (s.invoiceNo && s.invoiceNo.toLowerCase().includes(query)) ||
          (s.receiptNo && s.receiptNo.toLowerCase().includes(query));
        if (!matches) return false;
      }

      if (companyFilter && s.companyName !== companyFilter) return false;
      if (statusFilter && s.workflowStatus !== statusFilter) return false;
      if (labFilter && s.receivingLabId !== labFilter) return false;
      if (natureFilter && !s.sampleNature.toLowerCase().includes(natureFilter.toLowerCase())) return false;
      if (
        analysisFilter &&
        !s.analysisRequired?.some((a) => a.toLowerCase().includes(analysisFilter.toLowerCase()))
      ) {
        return false;
      }

      if (dateFrom && new Date(s.dateOfEntry) < new Date(dateFrom)) return false;
      if (dateTo) {
        const d = new Date(dateTo);
        d.setHours(23, 59, 59, 999);
        if (new Date(s.dateOfEntry) > d) return false;
      }

      return true;
    });
  }, [
    samples,
    searchTerm,
    companyFilter,
    statusFilter,
    labFilter,
    natureFilter,
    analysisFilter,
    dateFrom,
    dateTo,
  ]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setCompanyFilter('');
    setStatusFilter('');
    setLabFilter('');
    setNatureFilter('');
    setAnalysisFilter('');
    setDateFrom('');
    setDateTo('');
  };

  // Export to Excel client-side
  const handleExportExcel = () => {
    const exportData = filteredSamples.map((s) => ({
      'Sample Code': s.sampleCode,
      'Sample Name': s.sampleName,
      'Company Name': s.companyName,
      'Sample Nature': s.sampleNature,
      'Date of Entry': new Date(s.dateOfEntry).toLocaleDateString(),
      'Analysis Required': (s.analysisRequired || []).join(', '),
      'Receiving Lab': s.receivingLabName,
      'Processing Date': s.processingDate ? new Date(s.processingDate).toLocaleDateString() : 'N/A',
      'Sent By': s.sentBy,
      'Invoice No': s.invoiceNo || 'N/A',
      'Invoice Acknowledged': s.invoiceAcknowledged ? 'Yes' : 'No',
      'Receipt / Ref No': s.receiptNo || 'N/A',
      'Result Status': s.resultStatus,
      'Turnaround Time (Days)': s.turnaroundTimeDays || '—',
      'Workflow Status': s.workflowStatus,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Summary');
    XLSX.writeFile(workbook, `HDI_Sample_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Server-side PDF export
  const handleExportPdf = () => {
    const params = new URLSearchParams();
    if (companyFilter) params.append('companyName', companyFilter);
    if (statusFilter) params.append('workflowStatus', statusFilter);
    if (labFilter) params.append('receivingLabId', labFilter);
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    window.open(`${apiBase}/api/reports/export-pdf?${params.toString()}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header and Export Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Summary Spreadsheet &amp; Management Review
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Comprehensive register with live multi-column filtering, Turnaround Time tracking, and export
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={handleExportExcel} className="btn btn-secondary btn-sm" title="Download Excel (.xlsx)">
            <FileSpreadsheet size={15} color="#16a34a" />
            Export Excel (.xlsx)
          </button>
          <button onClick={handleExportPdf} className="btn btn-secondary btn-sm" title="Generate PDF Document">
            <FileText size={15} color="#dc2626" />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="btn btn-primary btn-sm"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <Download size={15} />
            Monthly Management Review (.xlsx)
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '18px 20px',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            <Filter size={15} color="#2563eb" />
            Filter Records ({filteredSamples.length} matching)
          </div>
          <button
            onClick={handleResetFilters}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 10px', fontSize: '11px' }}
          >
            <RotateCcw size={12} /> Reset Filters
          </button>
        </div>

        {/* Row 1: Search, Company, Status, Lab */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {/* Universal Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              color="#94a3b8"
              style={{ position: 'absolute', left: 12, top: 12 }}
            />
            <input
              type="text"
              placeholder="Search code, name, batch..."
              className="form-input"
              style={{ paddingLeft: 34, fontSize: '13px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Company */}
          <select
            className="form-select"
            style={{ fontSize: '13px' }}
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Workflow Status */}
          <select
            className="form-select"
            style={{ fontSize: '13px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Workflow Statuses</option>
            <option value="Registered">Registered</option>
            <option value="Sent to Lab">Sent to Lab</option>
            <option value="In Processing">In Processing</option>
            <option value="Result Received">Result Received</option>
            <option value="Closed">Closed</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Lab */}
          <select
            className="form-select"
            style={{ fontSize: '13px' }}
            value={labFilter}
            onChange={(e) => setLabFilter(e.target.value)}
          >
            <option value="">All External Labs</option>
            <option value="LAB_1">Hydrochrom Analytical Services Limited</option>
            <option value="LAB_2">SAAG Chemical Nigeria Limited (SNCL)</option>
            <option value="LAB_3">Kazlat Public Analyst Laboratory</option>
            <option value="LAB_4">Central Halal Laboratory</option>
          </select>

          {/* Sample Nature */}
          <select
            className="form-select"
            style={{ fontSize: '13px' }}
            value={natureFilter}
            onChange={(e) => setNatureFilter(e.target.value)}
          >
            <option value="">All Natures (FD / NF)</option>
            <option value="Food">Food / Beverage (FD)</option>
            <option value="Non-Food">Non-Food (NF)</option>
          </select>
        </div>

        {/* Row 2: Date From, Date To, Analysis Type */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>From:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 145, fontSize: '12px', padding: '6px 10px' }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>To:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 145, fontSize: '12px', padding: '6px 10px' }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <input
            type="text"
            placeholder="Filter by analysis keyword (e.g. Microbial, Heavy Metals)..."
            className="form-input"
            style={{ flex: 1, minWidth: 200, fontSize: '12.5px', padding: '6px 10px' }}
            value={analysisFilter}
            onChange={(e) => setAnalysisFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Spreadsheet Data Grid */}
      {/* Spreadsheet Data Grid - Optimized to fit screen */}
      <div className="table-responsive" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table className="data-table" style={{ fontSize: '11px' }}>
          <thead>
            <tr>
              <th style={{ width: '95px' }}>Code</th>
              <th>Sample Name</th>
              <th>Company</th>
              <th style={{ width: '60px' }}>Nature</th>
              <th style={{ width: '75px' }}>Entry Date</th>
              <th style={{ width: '80px' }}>Lab</th>
              <th style={{ maxWidth: '140px' }}>Analysis</th>
              <th style={{ width: '90px' }}>Status</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSamples.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No samples match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredSamples.map((s) => (
                <tr
                  key={s._id}
                  onClick={() => onSelectSample(s)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view full details and take action"
                >
                  <td>
                    <span className="code-tag">{s.sampleCode}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.sampleName}>
                      {s.sampleName}
                    </div>
                    {s.batchNo && (
                      <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>
                        B: {s.batchNo}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.companyName}>
                      {s.companyName}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: s.sampleNature.includes('Food') ? '#1d4ed8' : '#64748b',
                      }}
                    >
                      {s.sampleNature.includes('Food') ? 'FD' : 'NF'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(s.dateOfEntry).toLocaleDateString()}</td>
                  <td>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#166534', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', whiteSpace: 'nowrap' }} title={s.receivingLabName}>
                      {s.receivingLabName?.split(' ')[0] || s.receivingLabName}
                    </span>
                  </td>
                  <td>
                    <div style={{ maxWidth: 130, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '10.5px' }} title={(s.analysisRequired || []).join(', ')}>
                      {(s.analysisRequired || []).join(', ')}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={s.workflowStatus} />
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSample(s);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '10.5px', gap: 4 }}
                        title="View full details"
                      >
                        <Eye size={12} /> View
                      </button>

                      <TableActionDropdown
                        isOpen={activeMenuId === s._id}
                        onToggle={() => setActiveMenuId(activeMenuId === s._id ? null : s._id)}
                        onClose={() => setActiveMenuId(null)}
                        width={195}
                        iconSize={14}
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
                      </TableActionDropdown>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
