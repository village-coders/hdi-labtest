import React from 'react';
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { DashboardStats } from '../../types/index.js';

interface StatCardsProps {
  stats: DashboardStats | null;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  if (!stats) return null;

  const inProcessingCount =
    (stats.statusCounts['In Processing'] || 0) + (stats.statusCounts['Sent to Lab'] || 0);
  const completedCount =
    (stats.statusCounts['Completed'] || 0) +
    (stats.statusCounts['Result Received'] || 0) +
    (stats.statusCounts['Closed'] || 0);
  const rejectedCount = stats.statusCounts['Rejected'] || 0;

  const labLabels: Record<string, string> = {
    LAB_1: 'Hydrochrom Analytical Services Limited',
    LAB_2: 'SAAG Chemical Nigeria Limited (SNCL)',
    LAB_3: 'Kazlat Public Analyst Laboratory',
    LAB_4: 'Central Halal Laboratory',
  };

  return (
    <div>
      {/* 4 Main KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Total Samples */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
                Total Registered Samples
              </p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', margin: '6px 0 0 0' }}>
                {stats.total}
              </h3>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FlaskConical size={24} />
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={14} /> Active registry catalog
          </div>
        </div>

        {/* Active In Labs */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
                Active at External Labs
              </p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', margin: '6px 0 0 0' }}>
                {inProcessingCount}
              </h3>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: '#fffbeb',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={24} />
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: '12px', color: '#64748b' }}>
            En route &amp; in analysis stages
          </div>
        </div>

        {/* Completed Tests */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
                Certificates Received
              </p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', margin: '6px 0 0 0' }}>
                {completedCount}
              </h3>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: '12px', color: '#16a34a' }}>
            {rejectedCount > 0 ? `${rejectedCount} analysis rejected` : '100% compliant acceptance'}
          </div>
        </div>

        {/* Pending Intake / Action */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
                Pending Intake &amp; Dispatch
              </p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#6366f1', margin: '6px 0 0 0' }}>
                {(stats.statusCounts['Registered'] || 0) + (stats.statusCounts['Draft'] || 0)}
              </h3>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: '#f5f3ff',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={24} />
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: '12px', color: '#64748b' }}>
            Awaiting lab courier &amp; intake acceptance
          </div>
        </div>
      </div>

      {/* Partner Laboratories & Volume Breakdown Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Lab TAT Leaderboard */}
        <div className="card" style={{ padding: '22px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-main)' }}>
            Partner Laboratory Workloads
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(stats.tatPerLab).map(([labId, tat]) => {
              const count = stats.labCounts[labId] || 0;
              return (
                <div
                  key={labId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                      {labLabels[labId] || labId}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>
                      {count} sample{count === 1 ? '' : 's'} assigned
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: tat > 10 ? '#ef4444' : '#2563eb' }}>
                      {count}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>assigned</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Clients / Companies Volume */}
        <div className="card" style={{ padding: '22px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-main)' }}>
            Top Companies by Sample Volume
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.topCompanies.map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 700,
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                    {c.name}
                  </span>
                </div>
                <span
                  style={{
                    background: '#e2e8f0',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 99,
                  }}
                >
                  {c.count} samples
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
