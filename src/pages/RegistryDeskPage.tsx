import React, { useState, useEffect } from 'react';
import { Sample, Company } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { WorkflowTrackerModal } from '../components/samples/WorkflowTrackerModal.js';
import { TableActionDropdown } from '../components/common/TableActionDropdown.js';
import {
  Search,
  PlusCircle,
  Eye,
  MoreHorizontal,
  TrendingUp,
  ClipboardList,
  Activity,
} from 'lucide-react';

interface RegistryDeskPageProps {
  samples: Sample[];
  companies: Company[];
  onSelectSample: (sample: Sample) => void;
  openRegisterModal: () => void;
  initialStatusTab?: 'ALL' | 'REGISTERED' | 'DISPATCHED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
}

const truncate = (str: string, max = 28) =>
  str && str.length > max ? str.slice(0, max) + '…' : str;

export const RegistryDeskPage: React.FC<RegistryDeskPageProps> = ({
  samples,
  companies,
  onSelectSample,
  openRegisterModal,
  initialStatusTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'REGISTERED' | 'DISPATCHED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'>(
    initialStatusTab || 'ALL'
  );
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [trackingSample, setTrackingSample] = useState<Sample | null>(null);

  useEffect(() => {
    if (initialStatusTab) {
      setStatusTab(initialStatusTab);
    }
  }, [initialStatusTab]);

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

  const filteredSamples = samples.filter((s) => {
    if (statusTab === 'REGISTERED' && s.workflowStatus !== 'Registered') return false;
    if (statusTab === 'DISPATCHED' && s.workflowStatus !== 'Sent to Lab') return false;
    if (statusTab === 'PROCESSING' && s.workflowStatus !== 'In Processing') return false;
    if (statusTab === 'COMPLETED' && s.workflowStatus !== 'Closed' && s.workflowStatus !== 'Result Received') return false;
    if (statusTab === 'REJECTED' && s.workflowStatus !== 'Rejected') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        s.sampleCode.toLowerCase().includes(q) ||
        s.sampleName.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q) ||
        (s.batchNo && s.batchNo.toLowerCase().includes(q)) ||
        (s.nafdacNo && s.nafdacNo.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
            Registered Samples Desk
          </h2>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>
            Primary management desk for registered samples, code generation, external dispatch, and certificates
          </p>
        </div>
        <button onClick={openRegisterModal} className="btn btn-primary" style={{ background: '#0f172a' }}>
          <PlusCircle size={15} /> Register New Sample
        </button>
      </div>

      {/* Tabs & Search Filter Strip */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All', count: samples.length },
            { id: 'DISPATCHED', label: 'Sent to Lab', count: samples.filter((s) => s.workflowStatus === 'Sent to Lab').length },
            { id: 'PROCESSING', label: 'In Processing', count: samples.filter((s) => s.workflowStatus === 'In Processing').length },
            { id: 'COMPLETED', label: 'Completed', count: samples.filter((s) => s.workflowStatus === 'Closed' || s.workflowStatus === 'Result Received').length },
            { id: 'REJECTED', label: 'Rejected', count: samples.filter((s) => s.workflowStatus === 'Rejected').length },
          ].map((tab) => {
            const isTabActive = statusTab === tab.id;
            const isRejectedTab = tab.id === 'REJECTED';
            return (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id as any)}
                className="btn btn-sm"
                style={{
                  background: isTabActive
                    ? isRejectedTab
                      ? '#dc2626'
                      : '#0f172a'
                    : isRejectedTab && tab.count > 0
                    ? '#fef2f2'
                    : '#f1f5f9',
                  color: isTabActive
                    ? '#ffffff'
                    : isRejectedTab && tab.count > 0
                    ? '#991b1b'
                    : '#475569',
                  borderRadius: '99px',
                  fontWeight: isTabActive ? 700 : 500,
                  fontSize: '11.5px',
                  padding: '4px 10px',
                  border: isRejectedTab && !isTabActive && tab.count > 0 ? '1px solid #fecaca' : 'none',
                }}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: 240 }}>
          <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 10 }} />
          <input
            type="text"
            placeholder="Search code, name, batch…"
            className="form-input"
            style={{ paddingLeft: 30, fontSize: '12px', padding: '6px 10px 6px 30px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ whiteSpace: 'nowrap' }}>Code</th>
              <th style={{ minWidth: 160 }}>Sample Name</th>
              <th style={{ whiteSpace: 'nowrap' }}>Batch No.</th>
              <th style={{ minWidth: 120 }}>Company</th>
              <th style={{ whiteSpace: 'nowrap' }}>Nature</th>
              <th style={{ whiteSpace: 'nowrap' }}>Entry Date</th>
              <th style={{ whiteSpace: 'nowrap' }}>Assigned Lab</th>
              <th style={{ whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSamples.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#6b7280' }}>
                  No sample records match this view.
                </td>
              </tr>
            ) : (
              filteredSamples.map((s) => {
                const isMenuOpen = activeMenuId === s._id;
                return (
                  <tr key={s._id}>
                    {/* Code */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="code-tag">{s.sampleCode}</span>
                    </td>

                    {/* Sample Name — truncated */}
                    <td style={{ maxWidth: 170 }}>
                      <strong
                        title={s.sampleName}
                        style={{
                          color: '#111827',
                          fontSize: '13.5px',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 180,
                          cursor: 'pointer',
                        }}
                        onClick={() => onSelectSample(s)}
                      >
                        {s.sampleName}
                      </strong>
                      {s.nafdacNo && (
                        <span style={{ display: 'block', fontSize: '11.5px', color: '#64748b' }}>
                          NAFDAC: {s.nafdacNo}
                        </span>
                      )}
                    </td>

                    {/* Batch No — separate column */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {s.batchNo ? (
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }}>{s.batchNo}</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                      )}
                    </td>

                    {/* Company */}
                    <td
                      style={{
                        fontSize: '13px',
                        color: '#374151',
                        fontWeight: 500,
                        maxWidth: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={s.companyName}
                    >
                      {s.companyName}
                    </td>

                    {/* Nature */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: s.sampleNature?.includes('Food') ? '#dcfce7' : '#e0f2fe',
                          color: s.sampleNature?.includes('Food') ? '#166534' : '#0369a1',
                        }}
                      >
                        {s.sampleNature}
                      </span>
                    </td>

                    {/* Entry Date */}
                    <td style={{ fontSize: '12.5px', color: '#475569', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {new Date(s.dateOfEntry).toLocaleDateString()}
                    </td>

                    {/* Lab */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong
                        style={{
                          fontSize: '12.5px',
                          color: '#111827',
                          display: 'block',
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={s.receivingLabName}
                      >
                        {truncate(s.receivingLabName, 26)}
                      </strong>
                    </td>

                    {/* Workflow Status */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge status={s.workflowStatus} />
                    </td>

                    {/* Three-dot Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <TableActionDropdown
                        isOpen={isMenuOpen}
                        onToggle={() => setActiveMenuId(isMenuOpen ? null : s._id)}
                        onClose={() => setActiveMenuId(null)}
                        width={195}
                        iconSize={15}
                      >
                        {/* Primary: View Details */}
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
                          className="dropdown-item"
                          onClick={() => {
                            setActiveMenuId(null);
                            setTrackingSample(s);
                          }}
                        >
                          <Activity size={14} />
                          <span>Track Workflow</span>
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Live Workflow Tracker Modal */}
      <WorkflowTrackerModal
        sample={trackingSample}
        isOpen={!!trackingSample}
        onClose={() => setTrackingSample(null)}
        onOpenFullDetail={(s) => onSelectSample(s)}
      />
    </div>
  );
};
