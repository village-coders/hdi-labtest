import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  AlertTriangle,
  RefreshCw,
  Building2,
  FlaskConical,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Sample } from '../types/index.js';

interface DeletedBinPageProps {
  onRefreshData?: () => void;
}

export const DeletedBinPage: React.FC<DeletedBinPageProps> = ({ onRefreshData }) => {
  const { user } = useAuth();
  const [deletedSamples, setDeletedSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [confirmPermanentId, setConfirmPermanentId] = useState<string | null>(null);

  const fetchDeleted = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getDeletedSamples();
      setDeletedSamples(data);
    } catch (err: any) {
      console.error('Error fetching deleted samples:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (sample: Sample) => {
    if (!confirm(`Are you sure you want to restore sample ${sample.sampleCode} back to the active registry?`)) {
      return;
    }

    setActionInProgress(sample._id);
    try {
      await api.restoreSample(sample._id);
      setDeletedSamples((prev) => prev.filter((s) => s._id !== sample._id));
      if (onRefreshData) onRefreshData();
      alert(`Sample ${sample.sampleCode} restored successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to restore sample');
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePermanentDelete = async (sample: Sample) => {
    setActionInProgress(sample._id);
    try {
      await api.permanentlyDeleteSample(sample._id);
      setDeletedSamples((prev) => prev.filter((s) => s._id !== sample._id));
      setConfirmPermanentId(null);
      if (onRefreshData) onRefreshData();
      alert(`Sample ${sample.sampleCode} permanently purged from database.`);
    } catch (err: any) {
      alert(err.message || 'Failed to permanently delete sample');
    } finally {
      setActionInProgress(null);
    }
  };

  const filtered = deletedSamples.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.sampleCode.toLowerCase().includes(q) ||
      s.sampleName.toLowerCase().includes(q) ||
      s.companyName.toLowerCase().includes(q) ||
      (s.receivingLabName || '').toLowerCase().includes(q) ||
      (s.deletedBy || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
            }}
          >
            <Trash2 size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                Deleted Bin (Recycle Hub)
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: '#f3e8ff',
                  color: '#7c3aed',
                  border: '1px solid #d8b4fe',
                }}
              >
                Super Admin Only
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
              Samples moved to trash. Only Super Administrators can view, restore, or permanently purge records.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fetchDeleted(true)}
          disabled={refreshing}
          style={{ fontSize: '13px', padding: '8px 14px' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'Refreshing…' : 'Refresh Bin'}</span>
        </button>
      </div>

      {/* Warning Notice Banner */}
      <div
        style={{
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: '13px',
          color: '#92400e',
        }}
      >
        <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
        <div>
          <strong>Protected Data Safeguard:</strong> Samples in this bin are excluded from active dashboard statistics, invoices desk, and partner laboratory portals. Restoring a sample returns it to its original workflow stage immediately.
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by code, name, client, lab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 36, fontSize: '13px' }}
          />
        </div>

        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
          Total in Bin: <strong style={{ color: '#0f172a' }}>{deletedSamples.length}</strong> {deletedSamples.length === 1 ? 'sample' : 'samples'}
        </div>
      </div>

      {/* Deleted Samples Table Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: 10 }} />
            <div>Loading Deleted Bin…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <CheckCircle2 size={36} color="#16a34a" style={{ marginBottom: 12 }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Deleted Bin is Empty
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              {searchQuery ? 'No deleted samples matched your search query.' : 'There are currently no deleted samples in the bin.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ fontSize: '12px', fontWeight: 700, color: '#475569', padding: '12px 16px' }}>Sample Code</th>
                  <th style={{ fontSize: '12px', fontWeight: 700, color: '#475569', padding: '12px 16px' }}>Sample Name &amp; Nature</th>
                  <th style={{ fontSize: '12px', fontWeight: 700, color: '#475569', padding: '12px 16px' }}>Client Company</th>
                  <th style={{ fontSize: '12px', fontWeight: 700, color: '#475569', padding: '12px 16px' }}>Assigned Lab</th>
                  <th style={{ fontSize: '12px', fontWeight: 700, color: '#475569', padding: '12px 16px' }}>Deleted On / By</th>
                  <th style={{ fontSize: '12px', fontWeight: 700, color: '#475569', padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const isBusy = actionInProgress === s._id;
                  const isConfirming = confirmPermanentId === s._id;

                  return (
                    <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Code */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {s.pictureUrl ? (
                            <img
                              src={s.pictureUrl}
                              alt={s.sampleName}
                              style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 6,
                                background: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94a3b8',
                                fontSize: '10px',
                                fontWeight: 700,
                              }}
                            >
                              IMG
                            </div>
                          )}
                          <div>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                fontSize: '12.5px',
                                color: '#0f172a',
                                background: '#f1f5f9',
                                padding: '2px 7px',
                                borderRadius: 4,
                                border: '1px solid #cbd5e1',
                              }}
                            >
                              {s.sampleCode}
                            </span>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                              Prev: {s.workflowStatus}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Name & Nature */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13.5px' }}>{s.sampleName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>{s.sampleNature}</div>
                      </td>

                      {/* Company */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                          <Building2 size={13} color="#64748b" />
                          <span>{s.companyName}</span>
                        </div>
                      </td>

                      {/* Lab */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#334155' }}>
                          <FlaskConical size={13} color="#64748b" />
                          <span>{s.receivingLabName}</span>
                        </div>
                        <span
                          style={{
                            fontSize: '10.5px',
                            color: '#64748b',
                            background: '#f1f5f9',
                            padding: '1px 5px',
                            borderRadius: 4,
                          }}
                        >
                          {s.receivingLabId}
                        </span>
                      </td>

                      {/* Deleted info */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '12.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={12} color="#94a3b8" />
                          <span>{s.deletedAt ? new Date(s.deletedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 2 }}>
                          By: <strong style={{ color: '#0f172a' }}>{s.deletedBy || 'Super Admin'}</strong>
                        </div>
                        {s.deletionReason && (
                          <div style={{ fontSize: '11px', color: '#dc2626', fontStyle: 'italic', marginTop: 2 }}>
                            &ldquo;{s.deletionReason}&rdquo;
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        {isConfirming ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>Purge permanently?</span>
                            <button
                              type="button"
                              onClick={() => handlePermanentDelete(s)}
                              disabled={isBusy}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Yes, Purge
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmPermanentId(null)}
                              disabled={isBusy}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleRestore(s)}
                              disabled={isBusy}
                              className="btn btn-sm"
                              title="Restore sample back to active registry"
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: '#f0fdf4',
                                color: '#16a34a',
                                borderColor: '#bbf7d0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <RotateCcw size={13} />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmPermanentId(s._id)}
                              disabled={isBusy}
                              className="btn btn-sm"
                              title="Permanently remove sample from database"
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: '#fef2f2',
                                color: '#dc2626',
                                borderColor: '#fecaca',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Purge</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
