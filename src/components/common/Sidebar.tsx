import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Package,
  Award,
  Folder,
  Receipt,
  FileSpreadsheet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Bell,
  PlusCircle,
  Users,
  CreditCard,
  ClipboardList,
  AlertOctagon,
  MessageSquare,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openRegisterModal: () => void;
  unreadAlertsCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  openRegisterModal,
  unreadAlertsCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isLabUser = user?.role === 'LAB_USER';

  // Navigation Items with dedicated Lab workflow menus, Chats/Tickets, Summary Reports, and Users
  const navItems = isLabUser
    ? [
        { id: 'lab-portal', label: 'Lab Workspace', icon: FlaskConical },
        { id: 'lab-intake', label: 'Sample Received', icon: Package },
        { id: 'lab-invoices', label: 'Invoice Sent', icon: Receipt },
        { id: 'lab-payments', label: 'Confirmed Payment', icon: CreditCard },
        { id: 'lab-certificates', label: 'Issue Certificate', icon: Award },
        { id: 'lab-rejected', label: 'Rejected Samples', icon: AlertOctagon },
        { id: 'communications', label: 'Chats & Tickets', icon: MessageSquare },
        { id: 'summary-reports', label: 'Summary Reports', icon: FileSpreadsheet },
      ]
    : user?.role === 'ACCOUNTANT' || user?.role === 'FINANCE'
    ? [
        { id: 'finance', label: 'Invoices Desk', icon: Receipt },
        { id: 'registered-samples', label: 'Registered Samples', icon: ClipboardList },
        { id: 'rejected-samples', label: 'Rejected Samples', icon: AlertOctagon },
        { id: 'communications', label: 'Chats & Tickets', icon: MessageSquare },
        { id: 'summary-reports', label: 'Summary Reports', icon: FileSpreadsheet },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'registered-samples', label: 'Registered Samples', icon: ClipboardList, badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined },
        { id: 'rejected-samples', label: 'Rejected Samples', icon: AlertOctagon },
        { id: 'communications', label: 'Chats & Tickets', icon: MessageSquare },
        { id: 'finance', label: 'Invoices', icon: Receipt },
        { id: 'companies', label: 'Companies', icon: Building2 },
        { id: 'reports', label: 'Certificates', icon: Award },
        { id: 'summary-reports', label: 'Summary Reports', icon: FileSpreadsheet },
        { id: 'users', label: 'Users', icon: Users },
        ...(isSuperAdmin ? [{ id: 'deleted-bin', label: 'Deleted Bin', icon: Trash2 }] : []),
      ];

  // Map click for tabs that route to specific views
  const handleNavClick = (id: string) => {
    if (id === 'applications' || id === 'registry' || id === 'samples') setCurrentTab('registered-samples');
    else if (id === 'certificates') setCurrentTab('reports');
    else setCurrentTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  // Determine active item
  const getIsActive = (id: string) => {
    if (id === 'dashboard' && currentTab === 'dashboard') return true;
    if (id === 'registered-samples' && (currentTab === 'registered-samples' || currentTab === 'registry' || currentTab === 'applications' || currentTab === 'samples')) return true;
    if (id === 'rejected-samples' && (currentTab === 'rejected-samples' || currentTab === 'lab-rejected')) return true;
    if (id === 'lab-rejected' && (currentTab === 'lab-rejected' || currentTab === 'rejected-samples')) return true;
    if (id === 'communications' && currentTab === 'communications') return true;
    if (id === 'summary-reports' && (currentTab === 'summary-reports' || currentTab === 'reports-grid')) return true;
    if (id === 'finance' && currentTab === 'finance') return true;
    if (id === 'users' && currentTab === 'users') return true;
    if (id === 'reports' && (currentTab === 'reports' || currentTab === 'certificates')) return true;
    if (id === 'companies' && currentTab === 'companies') return true;
    if (id === 'deleted-bin' && currentTab === 'deleted-bin') return true;
    if (id === currentTab) return true;
    return false;
  };

  return (
    <aside
      className={`sidebar ${isMobileOpen ? 'sidebar-open' : ''}`}
      style={{
        width: isCollapsed ? 76 : 240,
        transition: 'width 0.2s ease, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top Header */}
      <div>
        <div
          style={{
            padding: isCollapsed ? '16px 10px' : '16px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#ffffff',
                  border: '1px solid #d4e4d8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 2,
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <img
                  src="https://halalcert.com.ng/HDI/image/hcaLogo.png"
                  alt="HDI Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h2
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 800,
                    color: '#111827',
                    margin: 0,
                    letterSpacing: '-0.3px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  HDI Admin
                </h2>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    margin: '1px 0 0 0',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Certification Portal
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #d4e4d8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                padding: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <img
                src="https://halalcert.com.ng/HDI/image/hcaLogo.png"
                alt="HDI Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Mobile close button (shown on mobile/tablet) */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="mobile-nav-close"
                title="Close Navigation Menu"
              >
                <X size={16} />
              </button>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                padding: 0,
                flexShrink: 0,
              }}
              className="desktop-collapse-btn"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
          </div>
        </div>

        {/* Quick Sample Registration CTA (if admin and not collapsed) */}
        {!isLabUser && !isCollapsed && (
          <div style={{ padding: '12px 14px 6px 14px' }}>
            <button
              onClick={() => {
                openRegisterModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px',
                borderRadius: 8,
                background: '#0f172a',
                justifyContent: 'center',
              }}
            >
              <PlusCircle size={15} />
              <span>Register Sample</span>
            </button>
          </div>
        )}

        {/* External Lab Indicator */}
        {isLabUser && !isCollapsed && (
          <div
            style={{
              margin: '12px 14px 6px 14px',
              padding: '8px 10px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
              Partner Laboratory
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.labName || user?.labIdentifier}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav
          style={{
            padding: '10px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = getIsActive(item.id);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  padding: isCollapsed ? '10px 0' : '9px 12px',
                  borderRadius: 8,
                  background: isActive ? '#0f172a' : 'transparent',
                  color: isActive ? '#ffffff' : '#374151',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.color = '#111827';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#374151';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <Icon
                    size={17}
                    color={isActive ? '#ffffff' : '#6b7280'}
                    strokeWidth={isActive ? 2.3 : 1.8}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && item.badge !== undefined && (
                  <span
                    style={{
                      background: isActive ? '#ffffff' : '#e0f2fe',
                      color: isActive ? '#0f172a' : '#0369a1',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 99,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile & Logout (as shown in reference image) */}
      <div
        style={{
          padding: isCollapsed ? '14px 6px' : '14px 16px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          background: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, overflow: 'hidden' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#f1f5f9',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '13px',
              flexShrink: 0,
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>

          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name?.split(' ')[0] || 'Admin'}
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: '#6b7280',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGEMENT' ? 'super admin' : user?.role?.toLowerCase() || 'admin'}
              </div>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
              padding: '4px 6px',
              borderRadius: 6,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
            title="Sign out of portal"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
};
