import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar } from './components/common/Sidebar.js';
import { Navbar } from './components/common/Navbar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { RegistryDeskPage } from './pages/RegistryDeskPage.js';
import { LabWorkspacePage } from './pages/LabWorkspacePage.js';
import { FinanceDeskPage } from './pages/FinanceDeskPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { DocumentsPage } from './pages/DocumentsPage.js';
import { CommunicationsPage } from './pages/CommunicationsPage.js';
import { DeletedBinPage } from './pages/DeletedBinPage.js';
import { SummarySpreadsheet } from './components/reports/SummarySpreadsheet.js';
import { SampleRegistrationModal } from './components/samples/SampleRegistrationModal.js';
import { SampleDetailModal } from './components/samples/SampleDetailModal.js';
import { NotificationFeedModal } from './components/notifications/NotificationFeedModal.js';
import { api } from './services/api.js';
import { Sample, Company, DashboardStats, NotificationLog } from './types/index.js';
import { Building2, Search, CheckCircle2, Plus } from 'lucide-react';

/* ───────────────── Auth Gate Spinner ───────────────── */
const AuthSpinner: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#94a3b8',
      gap: 16,
      fontSize: 14,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#2563eb',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    Verifying session…
  </div>
);

/* ───────────────── Main Portal (authenticated) ───────────────── */
const MainPortal: React.FC = () => {
  const { user, isSuperAdminAsLab, switchRole } = useAuth();
  const [revertingToSuperAdmin, setRevertingToSuperAdmin] = useState(false);

  const isLabUser = user?.role === 'LAB_USER';
  const isFinance = user?.role === 'ACCOUNTANT' || user?.role === 'FINANCE';

  // Strict initial tab according to role
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (user?.role === 'LAB_USER') return 'lab-portal';
    if (user?.role === 'ACCOUNTANT' || user?.role === 'FINANCE') return 'finance';
    return 'dashboard';
  });

  const [samples, setSamples] = useState<Sample[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [detailInitialTab, setDetailInitialTab] = useState<'details' | 'actions' | 'chat'>('details');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Companies Menu State
  const [showAddCompanyCard, setShowAddCompanyCard] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompContact, setNewCompContact] = useState('');
  const [newCompEmail, setNewCompEmail] = useState('');
  const [newCompPhone, setNewCompPhone] = useState('');
  const [compSearchQuery, setCompSearchQuery] = useState('');
  const [isSavingComp, setIsSavingComp] = useState(false);
  const [companyToast, setCompanyToast] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [samplesData, companiesData, statsData, logsData] = await Promise.all([
        api.getSamples(),
        api.getCompanies(),
        api.getDashboardStats(),
        api.getNotificationsFeed(),
      ]);
      setSamples(samplesData);
      setCompanies(companiesData);
      setStats(statsData);
      setNotificationLogs(logsData);
    } catch (err) {
      console.error('Error fetching portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadData();
    const interval = setInterval(async () => {
      try {
        const logs = await api.getNotificationsFeed();
        setNotificationLogs(logs);
      } catch {
        // quiet poll
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Enforce role-based tab boundaries
  useEffect(() => {
    if (!user) return;
    if (user.role === 'LAB_USER') {
      const labAllowed = ['lab-portal', 'lab-intake', 'lab-invoices', 'lab-payments', 'lab-certificates', 'lab-rejected', 'communications', 'summary-reports'];
      if (!labAllowed.includes(currentTab)) {
        setCurrentTab('lab-portal');
      }
    } else if (user.role === 'ACCOUNTANT' || user.role === 'FINANCE') {
      const finAllowed = ['finance', 'registry', 'registered-samples', 'samples', 'rejected-samples', 'communications', 'summary-reports'];
      if (!finAllowed.includes(currentTab)) {
        setCurrentTab('finance');
      }
    } else if (user.role === 'SUPER_ADMIN') {
      // Super Admin can access deleted-bin — no restriction needed
    }
  }, [user?.role, user?.labIdentifier, currentTab]);

  // Compute safe effective tab
  const effectiveTab = React.useMemo(() => {
    if (isLabUser) {
      const labAllowed = ['lab-portal', 'lab-intake', 'lab-invoices', 'lab-payments', 'lab-certificates', 'lab-rejected', 'communications', 'summary-reports'];
      return labAllowed.includes(currentTab) ? currentTab : 'lab-portal';
    }
    if (isFinance) {
      const finAllowed = ['finance', 'registry', 'registered-samples', 'samples', 'rejected-samples', 'communications', 'summary-reports'];
      return finAllowed.includes(currentTab) ? currentTab : 'finance';
    }
    return currentTab;
  }, [currentTab, isLabUser, isFinance]);

  // Strict sample isolation: Partner Labs ONLY see samples dispatched to their specific lab by admin
  const visibleSamples = React.useMemo(() => {
    if (!isLabUser) return samples;

    const userLabId = (user?.labIdentifier || '').toUpperCase().trim();
    const userLabName = (user?.name || '').toLowerCase().trim();

    return samples.filter((s) => {
      // 1. Must belong to this partner laboratory
      const sampleLabId = (s.receivingLabId || '').toUpperCase().trim();
      const sampleLabName = (s.receivingLabName || '').toLowerCase().trim();

      const idMatch = Boolean(userLabId && sampleLabId && sampleLabId === userLabId);
      const nameMatch = Boolean(
        userLabName &&
          sampleLabName &&
          (sampleLabName.includes(userLabName) || userLabName.includes(sampleLabName))
      );

      if (!idMatch && !nameMatch) return false;

      // 2. Labs should ONLY see samples sent from admin (status != Registered)
      return s.workflowStatus !== 'Registered';
    });
  }, [samples, isLabUser, user?.labIdentifier, user?.name]);

  const handleSampleCreated = (newSample: Sample) => {
    setSamples([newSample, ...samples]);
    loadData();
  };

  const handleSampleUpdated = (updated: Sample) => {
    setSamples(samples.map((s) => (s._id === updated._id ? updated : s)));
    setSelectedSample(updated);
    loadData();
  };

  const handleTriggerReminderCron = async () => {
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    await fetch(`${apiBase}/api/cron/trigger-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('hdi_portal_token') || ''}`,
      },
    });
    await loadData();
  };

  return (
    <div className="app-container">
      {/* Mobile Drawer Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <Sidebar
        currentTab={effectiveTab}
        setCurrentTab={(tab) => {
          setIsMobileSidebarOpen(false);
          if (tab === 'notifications') {
            setIsNotificationsOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        openRegisterModal={() => {
          setIsMobileSidebarOpen(false);
          setIsRegisterOpen(true);
        }}
        unreadAlertsCount={notificationLogs.length}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main View Area */}
      <div className="main-content">
        {/* Super Admin Impersonation Banner */}
        {isSuperAdminAsLab && user?.role === 'LAB_USER' && (
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 999,
              background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
              color: '#ffffff',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 2px 12px rgba(124, 58, 237, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '16px' }}>👁️</span>
              <span>
                You are viewing as <strong>{user?.labName || user?.labIdentifier || 'Lab Partner'}</strong>.
                Actions here reflect the lab's perspective.
              </span>
            </div>
            <button
              onClick={async () => {
                setRevertingToSuperAdmin(true);
                try {
                  await switchRole('SUPER_ADMIN');
                } finally {
                  setRevertingToSuperAdmin(false);
                }
              }}
              disabled={revertingToSuperAdmin}
              style={{
                background: '#ffffff',
                color: '#7c3aed',
                border: 'none',
                borderRadius: 7,
                padding: '6px 14px',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: revertingToSuperAdmin ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
              }}
            >
              {revertingToSuperAdmin ? '⏳ Returning…' : '⬅ Return to Super Admin'}
            </button>
          </div>
        )}
        <Navbar
          currentTab={effectiveTab}
          setCurrentTab={(tab) => setCurrentTab(tab)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadCount={notificationLogs.length}
          onRefreshData={loadData}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="page-body">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  border: '3px solid #cbd5e1',
                  borderTopColor: '#2563eb',
                  borderRadius: '50%',
                  margin: '0 auto 16px auto',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              Loading portal records and connecting to external laboratory databases…
            </div>
          ) : (
            <>
              {effectiveTab === 'dashboard' && !isLabUser && (
                <DashboardPage
                  stats={stats}
                  recentSamples={samples}
                  onSelectSample={(s) => setSelectedSample(s)}
                  openRegisterModal={() => setIsRegisterOpen(true)}
                  onNavigateToTab={(tab) => {
                    if (tab === 'notifications') {
                      setIsNotificationsOpen(true);
                    } else {
                      setCurrentTab(tab);
                    }
                  }}
                  onRefreshData={loadData}
                  unreadCount={notificationLogs.length}
                />
              )}

              {!isLabUser && (
                effectiveTab === 'registry' ||
                effectiveTab === 'applications' ||
                effectiveTab === 'samples' ||
                effectiveTab === 'products' ||
                effectiveTab === 'registered-samples' ||
                effectiveTab === 'rejected-samples'
              ) && (
                <RegistryDeskPage
                  samples={samples}
                  companies={companies}
                  onSelectSample={(s) => setSelectedSample(s)}
                  openRegisterModal={() => setIsRegisterOpen(true)}
                  initialStatusTab={
                    effectiveTab === 'rejected-samples'
                      ? 'REJECTED'
                      : 'ALL'
                  }
                />
              )}

              {effectiveTab === 'companies' && !isLabUser && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Toast Alert */}
                  {companyToast && (
                    <div
                      style={{
                        padding: '10px 16px',
                        background: '#dcfce7',
                        border: '1px solid #86efac',
                        borderRadius: 8,
                        color: '#166534',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{companyToast}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>
                          Certified Client Companies
                        </h2>
                        <span style={{ fontSize: '12px', background: '#e0f2fe', color: '#0369a1', fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>
                          {companies.length} Companies Registered
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                        Enterprise manufacturing and client organizations whose samples are logged in the HDI portal.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setShowAddCompanyCard(!showAddCompanyCard)}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '12.5px' }}
                      >
                        <Plus size={15} /> {showAddCompanyCard ? 'Close Form' : '+ Add New Company'}
                      </button>
                    </div>
                  </div>

                  {/* Inline Add Company Card */}
                  {showAddCompanyCard && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newCompName.trim()) return;
                        setIsSavingComp(true);
                        try {
                          const created = await api.createCompany(
                            newCompName.trim(),
                            newCompContact.trim() || undefined,
                            newCompEmail.trim() || undefined,
                            newCompPhone.trim() || undefined
                          );
                          setCompanies((prev) => {
                            if (prev.find((c) => c.name.toLowerCase() === created.name.toLowerCase())) return prev;
                            return [...prev, created];
                          });
                          setNewCompName('');
                          setNewCompContact('');
                          setNewCompEmail('');
                          setNewCompPhone('');
                          setShowAddCompanyCard(false);
                          setCompanyToast(`✓ Company "${created.name}" added successfully to the directory!`);
                          setTimeout(() => setCompanyToast(null), 3500);
                        } catch (err: any) {
                          alert(err.message || 'Failed to add company');
                        } finally {
                          setIsSavingComp(false);
                        }
                      }}
                      className="card"
                      style={{ padding: '20px', borderRadius: 12, border: '1.5px solid #2563eb', background: '#f8fafc' }}
                    >
                      <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 800, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={16} /> Register New Client Company
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '12px', marginBottom: 4 }}>
                            Company Name <span className="required-star">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Dangote Sugar Refinery Plc"
                            value={newCompName}
                            onChange={(e) => setNewCompName(e.target.value)}
                            required
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '12px', marginBottom: 4 }}>
                            Contact Person
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Lead QA / Compliance Officer"
                            value={newCompContact}
                            onChange={(e) => setNewCompContact(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '12px', marginBottom: 4 }}>
                            Email Address
                          </label>
                          <input
                            type="email"
                            className="form-input"
                            placeholder="corporate@client.com.ng"
                            value={newCompEmail}
                            onChange={(e) => setNewCompEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '12px', marginBottom: 4 }}>
                            Phone Number
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="+234 800 000 0000"
                            value={newCompPhone}
                            onChange={(e) => setNewCompPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                        <button
                          type="button"
                          onClick={() => setShowAddCompanyCard(false)}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingComp || !newCompName.trim()}
                          className="btn btn-primary btn-sm"
                        >
                          {isSavingComp ? 'Saving…' : 'Save Company'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Search Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Search company or contact person..."
                        value={compSearchQuery}
                        onChange={(e) => setCompSearchQuery(e.target.value)}
                        style={{ paddingLeft: 32, fontSize: '12.5px' }}
                      />
                    </div>
                  </div>

                  {/* Companies Grid */}
                  {companies.filter((c) =>
                    c.name.toLowerCase().includes(compSearchQuery.toLowerCase()) ||
                    (c.contactPerson || '').toLowerCase().includes(compSearchQuery.toLowerCase())
                  ).length === 0 ? (
                    <div className="card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                      <Building2 size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>No companies matched your search criteria.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
                      {companies
                        .filter((c) =>
                          c.name.toLowerCase().includes(compSearchQuery.toLowerCase()) ||
                          (c.contactPerson || '').toLowerCase().includes(compSearchQuery.toLowerCase())
                        )
                        .map((c) => {
                          const count = samples.filter((s) => s.companyName === c.name).length;
                          return (
                            <div key={c._id || c.name} className="card" style={{ padding: '16px 18px', borderRadius: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>
                                  {c.name}
                                </h4>
                                <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#0f172a', fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: '1px solid #cbd5e1' }}>
                                  {count} Samples
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <div>Contact: <strong>{c.contactPerson || 'Lead QA Officer'}</strong></div>
                                <div>Email: {c.email || `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@client.ng`}</div>
                                <div>Phone: {c.phone || '+234 800 000 0000'}</div>
                              </div>
                              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => setCurrentTab('registered-samples')}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '11px' }}
                                >
                                  View Samples →
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {(effectiveTab === 'lab-portal' ||
                effectiveTab === 'lab-intake' ||
                effectiveTab === 'lab-invoices' ||
                effectiveTab === 'lab-payments' ||
                effectiveTab === 'lab-certificates' ||
                effectiveTab === 'lab-rejected') && (
                <LabWorkspacePage
                  samples={isLabUser ? visibleSamples : samples}
                  currentSection={effectiveTab}
                  onNavigateSection={(tab) => setCurrentTab(tab)}
                  onRefreshData={loadData}
                  onSelectSample={(s, initialTab) => {
                    setDetailInitialTab(initialTab || 'details');
                    setSelectedSample(s);
                  }}
                />
              )}

              {effectiveTab === 'finance' && !isLabUser && (
                <FinanceDeskPage
                  samples={samples}
                  onSelectSample={(s) => {
                    setDetailInitialTab('details');
                    setSelectedSample(s);
                  }}
                />
              )}

              {effectiveTab === 'communications' && <CommunicationsPage />}

              {effectiveTab === 'users' && !isLabUser && <UsersPage />}

              {/* Deleted Bin — Super Admin ONLY */}
              {effectiveTab === 'deleted-bin' && user?.role === 'SUPER_ADMIN' && (
                <DeletedBinPage onRefreshData={loadData} />
              )}

              {effectiveTab === 'documents' && (
                <DocumentsPage
                  samples={isLabUser ? visibleSamples : samples}
                  companies={companies}
                  onSelectSample={(s) => {
                    setDetailInitialTab('details');
                    setSelectedSample(s);
                  }}
                />
              )}

              {(effectiveTab === 'summary-reports' || effectiveTab === 'reports' || effectiveTab === 'certificates') && (
                <SummarySpreadsheet
                  samples={isLabUser ? visibleSamples : samples}
                  companies={companies}
                  onSelectSample={(s) => {
                    setDetailInitialTab('details');
                    setSelectedSample(s);
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Sample Registration Modal (Sections A-D) */}
      <SampleRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleSampleCreated}
        companies={companies}
        onCompanyCreated={(newC) => setCompanies([...companies, newC])}
      />

      {/* Sample Detail & Actions Modal */}
      <SampleDetailModal
        sample={selectedSample}
        isOpen={Boolean(selectedSample)}
        onClose={() => setSelectedSample(null)}
        onSampleUpdated={handleSampleUpdated}
        initialTab={detailInitialTab}
      />

      {/* Live Workflow Notification Feed Modal */}
      <NotificationFeedModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        logs={notificationLogs}
        onTriggerCronReminder={handleTriggerReminderCron}
      />
    </div>
  );
};

/* ───────────────── App Root (auth-gated) ───────────────── */
const PortalRoot: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthSpinner />;
  if (!user) return <LoginPage />;
  return <MainPortal />;
};

export default function App() {
  return (
    <AuthProvider>
      <PortalRoot />
    </AuthProvider>
  );
}
