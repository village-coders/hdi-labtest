import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FlaskConical,
  RefreshCw,
  Check,
  Clock,
  RotateCcw,
  AlertCircle,
  ShieldCheck,
  Circle,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Communication } from '../types/index.js';

const LABS = [
  { id: 'LAB_1', name: 'Hydrochrom Resources' },
  { id: 'LAB_2', name: 'SAAG Chemical Nigeria' },
  { id: 'LAB_3', name: 'Kazlat Public Analysts' },
  { id: 'LAB_4', name: 'Central Halal Laboratory' },
];

export const CommunicationsPage: React.FC = () => {
  const { user } = useAuth();
  const isLabUser = user?.role === 'LAB_USER';
  const isAdmin =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'REGISTRY' ||
    user?.role === 'MANAGEMENT';

  const [selectedLab, setSelectedLab] = useState<string>(
    isLabUser ? (user?.labIdentifier || 'LAB_1') : 'LAB_1'
  );
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form states
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sampleCode, setSampleCode] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT' | 'HIGH'>('NORMAL');
  const [isSending, setIsSending] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const activeLab = isLabUser ? (user?.labIdentifier || 'LAB_1') : selectedLab;
      const data = await api.getCommunications(activeLab);
      setCommunications(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load communications');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages();
    }, 6000);
    return () => clearInterval(interval);
  }, [selectedLab, user?.labIdentifier]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [communications]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      const activeLab = isLabUser ? (user?.labIdentifier || 'LAB_1') : selectedLab;
      const newComm = await api.createCommunication({
        labIdentifier: activeLab,
        message: message.trim(),
        subject: subject.trim() || 'General Inquiry',
        sampleCode: sampleCode.trim(),
        priority,
      });
      setCommunications((prev) => [...prev, newComm]);
      setMessage('');
      setSubject('');
      setSampleCode('');
      setPriority('NORMAL');
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'OPEN' | 'RESOLVED') => {
    if (!isAdmin) return; // Only admins can change ticket status
    const nextStatus = currentStatus === 'OPEN' ? 'RESOLVED' : 'OPEN';
    setTogglingId(id);
    try {
      const updated = await api.updateCommunicationStatus(id, nextStatus);
      setCommunications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: updated.status } : item))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
    } finally {
      setTogglingId(null);
    }
  };

  // Ticket stats
  const openCount = communications.filter((c) => c.status === 'OPEN').length;
  const resolvedCount = communications.filter((c) => c.status === 'RESOLVED').length;
  const urgentCount = communications.filter(
    (c) => c.status === 'OPEN' && (c.priority === 'URGENT' || c.priority === 'HIGH')
  ).length;

  const filteredCommunications = communications.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    return true;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'LAB_USER':
        return { label: 'External Lab', bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', bg: '#0f172a', text: '#ffffff', border: '#0f172a' };
      case 'ADMIN':
        return { label: 'HDI Admin', bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' };
      case 'ACCOUNTANT':
      case 'FINANCE':
        return { label: 'Finance Desk', bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      default:
        return { label: 'Registry Desk', bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' };
    }
  };

  const activeLabObj = LABS.find((l) => l.id === (isLabUser ? user?.labIdentifier : selectedLab)) || LABS[0];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
      <style>{`
        @keyframes ticketPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.4)} }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
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
              <MessageSquare size={18} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                Tickets &amp; Lab Communications
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                Live messaging channel between HDI Administration and accredited testing laboratories
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchMessages(true)}
            disabled={refreshing}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Updating…' : 'Refresh Feed'}</span>
          </button>
        </div>
      </div>

      {/* ── ADMIN TICKET STATS BAR ── */}
      {isAdmin && !loading && communications.length > 0 && (
        <div
          className="responsive-comm-stats"
          style={{
            marginBottom: 18,
          }}
        >
          {/* Open Tickets */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'OPEN' ? 'ALL' : 'OPEN')}
            style={{ padding: '14px 18px', borderRadius: 12, cursor: 'pointer', background: openCount > 0 ? '#fff7ed' : '#f8fafc', border: `1.5px solid ${statusFilter === 'OPEN' ? '#fb923c' : openCount > 0 ? '#fed7aa' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s', boxShadow: statusFilter === 'OPEN' ? '0 0 0 3px rgba(251,146,60,0.2)' : 'none' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: openCount > 0 ? '#fb923c' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Inbox size={20} color="#ffffff" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: openCount > 0 ? '#c2410c' : '#64748b', lineHeight: 1 }}>{openCount}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: openCount > 0 ? '#9a3412' : '#94a3b8', marginTop: 2 }}>Open Tickets</div>
            </div>
            {openCount > 0 && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', animation: 'ticketPulse 2s infinite', flexShrink: 0 }} />}
          </div>

          {/* Urgent */}
          <div style={{ padding: '14px 18px', borderRadius: 12, background: urgentCount > 0 ? '#fef2f2' : '#f8fafc', border: `1.5px solid ${urgentCount > 0 ? '#fca5a5' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: urgentCount > 0 ? '#dc2626' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><AlertTriangle size={20} color="#ffffff" /></div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: urgentCount > 0 ? '#dc2626' : '#64748b', lineHeight: 1 }}>{urgentCount}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: urgentCount > 0 ? '#991b1b' : '#94a3b8', marginTop: 2 }}>Urgent / High Priority</div>
            </div>
          </div>

          {/* Resolved */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
            style={{ padding: '14px 18px', borderRadius: 12, cursor: 'pointer', background: '#f0fdf4', border: `1.5px solid ${statusFilter === 'RESOLVED' ? '#16a34a' : '#bbf7d0'}`, display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s', boxShadow: statusFilter === 'RESOLVED' ? '0 0 0 3px rgba(22,163,74,0.2)' : 'none' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ShieldCheck size={20} color="#ffffff" /></div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#15803d', lineHeight: 1 }}>{resolvedCount}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#166534', marginTop: 2 }}>Resolved Tickets</div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Selector for Admin */}
      {!isLabUser && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 18,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
            Select Partner Laboratory Channel:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LABS.map((lab) => {
              const active = selectedLab === lab.id;
              return (
                <button
                  key={lab.id}
                  type="button"
                  onClick={() => setSelectedLab(lab.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
                    background: active ? '#0f172a' : '#ffffff',
                    color: active ? '#ffffff' : '#334155',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <FlaskConical size={14} color={active ? '#c9a227' : '#64748b'} />
                  <span>{lab.name}</span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                      color: active ? '#ffffff' : '#64748b',
                    }}
                  >
                    {lab.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Chat & Ticket Window */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'clamp(300px, 60vh, 620px)',
        }}
      >
        {/* Channel Header */}
        <div
          style={{
            padding: '16px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={18} color="#0f172a" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: '#0f172a' }}>
                  {isLabUser ? 'HDI Central Administration & Registry Desk' : activeLabObj.name}
                </h3>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Circle size={7} fill="#16a34a" color="#16a34a" /> Active
                </span>
                {openCount > 0 && isAdmin && (
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={11} /> {openCount} Open Ticket{openCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                {isLabUser
                  ? `Authenticated session as ${user?.name || user?.email} · ${user?.labIdentifier || 'External Lab'}`
                  : `Dedicated communication ticket thread for ${activeLabObj.name} (${activeLabObj.id})`}
              </p>
            </div>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Show:</span>
            {(['ALL', 'OPEN', 'RESOLVED'] as const).map((st) => {
              const count = st === 'ALL' ? communications.length : st === 'OPEN' ? openCount : resolvedCount;
              const isActive = statusFilter === st;
              return (
                <button key={st} type="button" onClick={() => setStatusFilter(st)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, border: `1.5px solid ${isActive ? (st === 'OPEN' ? '#fb923c' : st === 'RESOLVED' ? '#16a34a' : '#0f172a') : '#e2e8f0'}`, background: isActive ? (st === 'OPEN' ? '#fff7ed' : st === 'RESOLVED' ? '#f0fdf4' : '#0f172a') : '#ffffff', color: isActive ? (st === 'OPEN' ? '#c2410c' : st === 'RESOLVED' ? '#15803d' : '#ffffff') : '#475569', transition: 'all 0.15s' }}>
                  {st === 'ALL' ? 'All' : st === 'OPEN' ? 'Open' : 'Resolved'}
                  <span style={{ minWidth: 18, height: 18, borderRadius: 99, fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', background: isActive ? (st === 'OPEN' ? '#fb923c' : st === 'RESOLVED' ? '#16a34a' : 'rgba(255,255,255,0.2)') : '#f1f5f9', color: isActive ? '#ffffff' : '#64748b' }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Thread Body */}
        <div
          style={{
            flex: 1,
            padding: '22px',
            overflowY: 'auto',
            maxHeight: '480px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: '#ffffff',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: 10 }} />
              <div>Loading communication stream…</div>
            </div>
          ) : filteredCommunications.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '50px 20px',
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: 12,
                color: '#64748b',
              }}
            >
              <MessageSquare size={36} color="#94a3b8" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                No communication tickets found
              </div>
              <p style={{ fontSize: '13px', margin: '4px 0 0', color: '#64748b' }}>
                Start a conversation by posting an inquiry, dispatch note, or update below.
              </p>
            </div>
          ) : (
            filteredCommunications.map((comm) => {
              const badge = getRoleBadge(comm.senderRole);
              const isResolved = comm.status === 'RESOLVED';
              const isUrgent = comm.priority === 'URGENT' || comm.priority === 'HIGH';
              const isToggling = togglingId === comm._id;

              return (
                <div key={comm._id} style={{ background: isResolved ? '#f8fafc' : '#ffffff', border: `1px solid ${isResolved ? '#e2e8f0' : isUrgent ? '#fca5a5' : '#e2e8f0'}`, borderLeft: `4px solid ${isResolved ? '#94a3b8' : isUrgent ? '#ef4444' : '#0f172a'}`, borderRadius: 10, padding: '14px 18px', opacity: isResolved ? 0.85 : 1, boxShadow: isResolved ? 'none' : '0 1px 4px rgba(0,0,0,0.04)', transition: 'opacity 0.2s' }}>
                  {/* Top Meta */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                        {comm.senderName}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {badge.label}
                      </span>
                      {comm.subject && (
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: '#f1f5f9',
                            color: '#475569',
                          }}
                        >
                          {comm.subject}
                        </span>
                      )}
                      {comm.sampleCode && (
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                          }}
                        >
                          Sample: {comm.sampleCode}
                        </span>
                      )}
                      {isUrgent && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <AlertTriangle size={11} />
                          {comm.priority}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        {new Date(comm.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {/* Status badge — visible to ALL users */}
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: isResolved ? '#f0fdf4' : '#fff7ed', color: isResolved ? '#16a34a' : '#c2410c', border: `1px solid ${isResolved ? '#bbf7d0' : '#fed7aa'}`, display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: '0.3px' }}>
                        {isResolved
                          ? <><CheckCircle2 size={11} /> RESOLVED</>
                          : <><Circle size={8} fill="#f97316" color="#f97316" /> OPEN</>}
                      </span>

                      {/* Admin-ONLY resolve/reopen button */}
                      {isAdmin && (
                        <button type="button" onClick={() => handleToggleStatus(comm._id, comm.status)} disabled={isToggling} title={isResolved ? 'Reopen this ticket' : 'Mark as resolved'} style={{ background: isResolved ? '#f1f5f9' : '#f0fdf4', border: `1.5px solid ${isResolved ? '#cbd5e1' : '#86efac'}`, color: isResolved ? '#475569' : '#15803d', padding: '4px 10px', borderRadius: 7, fontSize: '11.5px', fontWeight: 700, cursor: isToggling ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'all 0.15s', opacity: isToggling ? 0.6 : 1 }}>
                          {isToggling
                            ? <><RefreshCw size={11} className="spin" /> Working...</>
                            : isResolved
                            ? <><RotateCcw size={11} /> Reopen</>
                            : <><Check size={11} /> Mark Resolved</>}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <p style={{ margin: 0, fontSize: '13.5px', color: isResolved ? '#64748b' : '#1e293b', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                    {comm.message}
                  </p>

                  {/* Resolved footer note */}
                  {isResolved && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #e2e8f0', fontSize: '11.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <ShieldCheck size={12} color="#16a34a" />
                      <span>Ticket resolved{isAdmin ? ' — click "Reopen" to restore' : ''}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <div
          style={{
            padding: '18px 22px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <form onSubmit={handleSendMessage}>
            {/* Quick Helper Fields: Subject, Sample Code, Priority */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <input
                type="text"
                placeholder="Subject / Topic (e.g. Analysis Inquiry)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  borderRadius: 7,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                }}
              />
              <input
                type="text"
                placeholder="Linked Sample Code (optional)"
                value={sampleCode}
                onChange={(e) => setSampleCode(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  borderRadius: 7,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                }}
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  borderRadius: 7,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: priority === 'URGENT' ? '#dc2626' : '#1e293b',
                  fontWeight: priority === 'URGENT' ? 700 : 500,
                }}
              >
                <option value="NORMAL">Priority: Normal</option>
                <option value="HIGH">Priority: High</option>
                <option value="URGENT">Priority: Urgent ⚠️</option>
              </select>
            </div>

            {/* Main Message Input */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', flexWrap: 'wrap' }}>
              <textarea
                rows={3}
                placeholder={
                  isLabUser
                    ? 'Write your message or inquiry to HDI Central Administration…'
                    : `Write a message or instruction to ${activeLabObj.name}…`
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{
                  flex: '1 1 260px',
                  minWidth: 0,
                  padding: '12px 14px',
                  fontSize: '13.5px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  resize: 'none',
                  lineHeight: 1.45,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleSendMessage(e);
                  }
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSending || !message.trim()}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: isSending || !message.trim() ? 'not-allowed' : 'pointer',
                  minHeight: '44px',
                  flex: '0 0 auto',
                }}
              >
                <Send size={16} />
                <span>{isSending ? 'Sending…' : 'Send'}</span>
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '11px', color: '#94a3b8' }}>
              <span>Press Ctrl+Enter or click Send to post</span>
              {isAdmin
                ? <span style={{ color: '#f97316', fontWeight: 600 }}>Admin: Use "Mark Resolved" on each ticket to close it</span>
                : <span>Messages are visible to HDI administration and registry officers</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
