import React, { useState, useEffect } from 'react';
import { Sample, DashboardStats } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { WorkflowTrackerModal } from '../components/samples/WorkflowTrackerModal.js';
import { TableActionDropdown } from '../components/common/TableActionDropdown.js';
import { useAuth } from '../context/AuthContext.js';
import {
  FileText,
  CheckCircle2,
  RefreshCw,
  Bell,
  MoreHorizontal,
  TrendingUp,
  Award,
  Building2,
  Clock,
  ChevronRight,
  ClipboardList,
  RotateCw,
  PlusCircle,
  DollarSign,
  FlaskConical,
  Receipt,
} from 'lucide-react';

interface DashboardPageProps {
  stats: DashboardStats | null;
  recentSamples: Sample[];
  onSelectSample: (sample: Sample) => void;
  openRegisterModal: () => void;
  onNavigateToTab: (tab: string) => void;
  onRefreshData?: () => void;
  unreadCount?: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  recentSamples,
  onSelectSample,
  openRegisterModal,
  onNavigateToTab,
  onRefreshData,
  unreadCount = 2,
}) => {
  const { user } = useAuth();
  const [activeMenuSampleId, setActiveMenuSampleId] = useState<string | null>(null);
  const [trackingSample, setTrackingSample] = useState<Sample | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'REGISTRY' || user?.role === 'MANAGEMENT';
  const isLabUser = user?.role === 'LAB_USER';
  const isAccountant = user?.role === 'ACCOUNTANT' || user?.role === 'FINANCE';


  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close action dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.action-menu-container') && !target.closest('.table-action-dropdown-portal')) {
        setActiveMenuSampleId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live metrics from real data — no dummy fallbacks
  const totalApps = stats?.total ?? recentSamples.length;
  const newApps = (stats?.statusCounts?.['Registered'] ?? 0) + (stats?.statusCounts?.['Received'] ?? 0);
  const activeCerts = (stats?.statusCounts?.['Closed'] ?? 0) + (stats?.statusCounts?.['Completed'] ?? 0);
  const renewalApps = (stats?.statusCounts?.['In Processing'] ?? 0) + (stats?.statusCounts?.['Sent to Lab'] ?? 0);

  const approvedCount = activeCerts;
  const pendingCount = newApps;
  const rejectedCount = stats?.statusCounts?.['Rejected'] ?? 0;
  const totalDistribution = Math.max(approvedCount + pendingCount + rejectedCount, 1); // avoid division by zero

  // Partner labs breakdown — all from real data, no dummy fallbacks
  const partnerLabs = [
    {
      id: 'LAB_1',
      name: 'Hydrochrom Analytical Services Limited',
      samplesCount: stats?.labCounts?.['LAB_1'] ?? recentSamples.filter(s => s.receivingLabId === 'LAB_1').length,
      tat: stats?.tatPerLab?.['LAB_1'] ?? 0,
      status: 'Active Accreditation',
    },
    {
      id: 'LAB_2',
      name: 'SAAG Chemical Nigeria Limited (SNCL)',
      samplesCount: stats?.labCounts?.['LAB_2'] ?? recentSamples.filter(s => s.receivingLabId === 'LAB_2').length,
      tat: stats?.tatPerLab?.['LAB_2'] ?? 0,
      status: 'Active Accreditation',
    },
    {
      id: 'LAB_3',
      name: 'Kazlat Public Analyst Laboratory',
      samplesCount: stats?.labCounts?.['LAB_3'] ?? recentSamples.filter(s => s.receivingLabId === 'LAB_3').length,
      tat: stats?.tatPerLab?.['LAB_3'] ?? 0,
      status: 'Active Accreditation',
    },
    {
      id: 'LAB_4',
      name: 'Central Halal Laboratory',
      samplesCount: stats?.labCounts?.['LAB_4'] ?? recentSamples.filter(s => s.receivingLabId === 'LAB_4').length,
      tat: stats?.tatPerLab?.['LAB_4'] ?? 0,
      status: 'Active Accreditation',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Top Header Bar ── */}
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
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#111827',
              margin: '0 0 2px 0',
              letterSpacing: '-0.3px',
            }}
          >
            {isAdmin ? 'Dashboard Overview' : isLabUser ? `Lab Dashboard — ${user?.labName || user?.labIdentifier}` : 'Finance Dashboard'}
          </h1>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
            {isAdmin
              ? 'Real-time overview of sample registrations, lab dispatches, and certificates'
              : isLabUser
              ? 'Your assigned sample batches, invoices, and certificates'
              : 'Invoice settlement tracking and payment records'}
            {' '}
            <span style={{ color: '#9ca3af', marginLeft: 6 }}>
              Last updated: {lastUpdatedTime || '—'}
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Notification Bell */}
          <button
            onClick={() => onNavigateToTab('notifications')}
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '50%',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              color: '#374151',
            }}
            title="Notifications & Alerts"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  width: 17,
                  height: 17,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Admin: Register Sample CTA */}
          {isAdmin && (
            <button
              onClick={openRegisterModal}
              className="btn btn-primary"
              style={{
                background: '#0f172a',
                padding: '8px 16px',
                fontSize: '12.5px',
                borderRadius: 8,
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
              }}
            >
              <PlusCircle size={14} />
              <span>Register Sample</span>
            </button>
          )}

          {/* Lab: Go to workspace */}
          {isLabUser && (
            <button
              onClick={() => onNavigateToTab('lab-portal')}
              className="btn btn-primary"
              style={{
                background: '#2563eb',
                padding: '8px 16px',
                fontSize: '12.5px',
                borderRadius: 8,
              }}
            >
              <FlaskConical size={14} />
              <span>Open Lab Workspace</span>
            </button>
          )}

          {/* Accountant: Go to Invoices */}
          {isAccountant && (
            <button
              onClick={() => onNavigateToTab('finance')}
              className="btn btn-primary"
              style={{
                background: '#b45309',
                padding: '8px 16px',
                fontSize: '12.5px',
                borderRadius: 8,
              }}
            >
              <DollarSign size={14} />
              <span>Open Invoices Desk</span>
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={onRefreshData}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              padding: '8px 12px',
              fontSize: '12px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#475569',
              fontWeight: 600,
            }}
          >
            <RotateCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards Row (as in reference image) ── */}
      <div className="responsive-stat-cards">
        {/* Card 1: Registered Samples */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', margin: '0 0 6px 0' }}>
                Registered Samples
              </p>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>
                {totalApps}
              </h2>
              <div style={{ marginTop: 6, fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <TrendingUp size={12} />
                <span>Active sample batch registry</span>
              </div>
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ClipboardList size={20} />
            </div>
          </div>
        </div>

        {/* Card 2: Under Lab Analysis */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', margin: '0 0 6px 0' }}>
                Under Lab Analysis
              </p>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>
                {renewalApps}
              </h2>
              <div style={{ marginTop: 6, fontSize: '11px', color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={12} />
                <span>Testing protocols active</span>
              </div>
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#d97706',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FlaskConical size={20} />
            </div>
          </div>
        </div>

        {/* Card 3: Invoices & Finance */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', margin: '0 0 6px 0' }}>
                Invoices & Finance
              </p>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>
                {recentSamples.filter(s => s.invoiceNo).length}
              </h2>
              <div style={{ marginTop: 6, fontSize: '11px', color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Receipt size={12} />
                <span>Lab billing & settlements</span>
              </div>
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#7c3aed',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Receipt size={20} />
            </div>
          </div>
        </div>

        {/* Card 4: Certificates Issued */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', margin: '0 0 6px 0' }}>
                Certificates Issued
              </p>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>
                {activeCerts}
              </h2>
              <div style={{ marginTop: 6, fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <TrendingUp size={12} />
                <span>Halal analysis completed</span>
              </div>
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#16a34a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Award size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Content Area ── */}
      <div
        className="responsive-dashboard-grid"
      >
        {/* ── Left Column: Recent Activities Table ── */}
        <div className="card" style={{ padding: '20px 22px', borderRadius: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
                Recent Activities
              </h3>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {recentSamples.length} items
              </span>
              <span
                style={{
                  background: '#e0e7ff',
                  color: '#3730a3',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 99,
                }}
              >
                Applications &amp; Certificates
              </span>
            </div>

            <button
              onClick={() => onNavigateToTab('registered-samples')}
              style={{
                background: 'none',
                border: 'none',
                color: '#0f172a',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span>View All</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="table-responsive" style={{ border: 'none', borderRadius: 8 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '42%' }}>COMPANY / APPLICANT</th>
                  <th style={{ width: '15%' }}>TYPE</th>
                  <th style={{ width: '20%' }}>STATUS</th>
                  <th style={{ width: '15%' }}>DATE</th>
                  <th style={{ width: '8%', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {recentSamples.slice(0, 6).map((s) => {
                  const isMenuOpen = activeMenuSampleId === s._id;
                  const formattedDate = new Date(s.dateOfEntry).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={s._id} style={{ position: 'relative' }}>
                      {/* COMPANY / APPLICANT */}
                      <td style={{ maxWidth: 220 }}>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '13.5px' }}>
                          {s.sampleCode}
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: '#475569',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 210,
                          }}
                          title={s.sampleName}
                        >
                          {s.sampleName}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#64748b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 210,
                          }}
                          title={s.companyName}
                        >
                          {s.companyName}
                        </div>
                      </td>

                      {/* TYPE */}
                      <td>
                        <span
                          style={{
                            background: '#e0f2fe',
                            color: '#0369a1',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 99,
                            display: 'inline-block',
                          }}
                        >
                          {s.sampleNature?.includes('Food') ? 'Food (FD)' : 'Non-Food (NF)'}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td>
                        <StatusBadge status={s.workflowStatus} />
                      </td>

                      {/* DATE */}
                      <td style={{ color: '#475569', fontSize: '12.5px', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {formattedDate}
                      </td>

                      {/* THREE DOTS ACTION BUTTON WITH TRACK PROCESS */}
                      <td style={{ textAlign: 'right' }}>
                        <TableActionDropdown
                          isOpen={isMenuOpen}
                          onToggle={() => setActiveMenuSampleId(isMenuOpen ? null : s._id)}
                          onClose={() => setActiveMenuSampleId(null)}
                          width={205}
                          iconSize={15}
                        >
                          <button
                            className="dropdown-item primary-track"
                            onClick={() => {
                              setActiveMenuSampleId(null);
                              setTrackingSample(s);
                            }}
                          >
                            <TrendingUp size={14} color="#0f172a" />
                            <span>Track Process</span>
                          </button>

                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setActiveMenuSampleId(null);
                              onSelectSample(s);
                            }}
                          >
                            <FileText size={14} />
                            <span>View Sample Details</span>
                          </button>

                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setActiveMenuSampleId(null);
                              navigator.clipboard.writeText(s.sampleCode);
                              alert(`Copied code: ${s.sampleCode}`);
                            }}
                          >
                            <ClipboardList size={14} />
                            <span>Copy Sample Code</span>
                          </button>
                        </TableActionDropdown>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right Column: Application Statistics Card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '20px 22px', borderRadius: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Application Statistics
                </h3>
                <p style={{ fontSize: '11.5px', color: '#6b7280', margin: '2px 0 0 0' }}>
                  Status distribution of applications
                </p>
              </div>
              <span style={{ fontSize: '11.5px', color: '#6b7280', fontWeight: 600 }}>
                Total: {totalApps}
              </span>
            </div>

            {/* All Applications Progress Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                <span>All Applications</span>
                <span style={{ color: '#6b7280' }}>Total: {totalApps}</span>
              </div>

              {/* Multi-segment Progress Bar */}
              <div
                style={{
                  height: 10,
                  width: '100%',
                  background: '#f1f5f9',
                  borderRadius: 99,
                  overflow: 'hidden',
                  display: 'flex',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: `${Math.max(10, Math.min(88, (approvedCount / totalDistribution) * 100))}%`,
                    background: '#16a34a',
                    height: '100%',
                  }}
                  title={`Approved: ${approvedCount}`}
                />
                <div
                  style={{
                    width: '6%',
                    background: '#eab308',
                    height: '100%',
                  }}
                  title={`Pending: ${pendingCount}`}
                />
                <div
                  style={{
                    width: '6%',
                    background: '#dc2626',
                    height: '100%',
                  }}
                  title={`Rejected: ${rejectedCount}`}
                />
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                  <span style={{ color: '#374151', fontWeight: 600 }}>Approved: {approvedCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }} />
                  <span style={{ color: '#374151', fontWeight: 600 }}>Pending: {pendingCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
                  <span style={{ color: '#374151', fontWeight: 600 }}>Rejected: {rejectedCount}</span>
                </div>
              </div>
            </div>

            {/* Certificates Breakdown Strip — driven by real data */}
            <div style={{ paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: 12 }}>
                <span>Workflow Breakdown</span>
                <span style={{ color: '#6b7280' }}>Total: {totalApps}</span>
              </div>

              {/* 3 Metric Boxes driven by live status counts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 75px), 1fr))', gap: 10 }}>
                {/* Box 1: Closed / Completed */}
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 10,
                    padding: '12px 10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>
                    {activeCerts}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#166534', marginTop: 4, fontWeight: 600 }}>
                    Closed
                  </div>
                </div>

                {/* Box 2: In Processing / Sent to Lab */}
                <div
                  style={{
                    background: '#fefce8',
                    border: '1px solid #fef08a',
                    borderRadius: 10,
                    padding: '12px 10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#ca8a04', lineHeight: 1 }}>
                    {renewalApps}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#854d0e', marginTop: 4, fontWeight: 600 }}>
                    In Lab
                  </div>
                </div>

                {/* Box 3: Rejected */}
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 10,
                    padding: '12px 10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>
                    {rejectedCount}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#991b1b', marginTop: 4, fontWeight: 600 }}>
                    Rejected
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Partner Laboratories Card ── */}
          <div className="card" style={{ padding: '18px 20px', borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Building2 size={15} color="#0f172a" />
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Partner External Laboratories
                </h4>
              </div>
              <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#0f172a', fontWeight: 700, padding: '2px 7px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                {partnerLabs.filter(l => l.samplesCount > 0).length || partnerLabs.length} Accredited Labs
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {partnerLabs.map((lab, i) => (
                <div
                  key={lab.id}
                  style={{
                    padding: '10px 12px',
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
                      {i + 1}. {lab.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: 2 }}>
                      {lab.samplesCount} active sample batches • {lab.status}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                      {lab.tat > 0 ? `${lab.tat}d` : '—'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>avg TAT</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Workflow Tracker Modal (Triggered by Three Dots -> Track Process) ── */}
      <WorkflowTrackerModal
        sample={trackingSample}
        isOpen={!!trackingSample}
        onClose={() => setTrackingSample(null)}
        onOpenFullDetail={(s) => onSelectSample(s)}
      />
    </div>
  );
};
