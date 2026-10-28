import React from 'react';
import {
  Bell,
  RefreshCw,
  LogOut,
  ShieldAlert,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface NavbarProps {
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  onRefreshData?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab = 'dashboard',
  onOpenNotifications,
  unreadCount = 0,
  onRefreshData,
  onToggleMobileSidebar,
}) => {
  const { user, logout, switchRole, isSuperAdminAsLab } = useAuth();

  const isLabUser = user?.role === 'LAB_USER';
  const isLabPage = currentTab?.startsWith('lab-') || isLabUser;

  // Lab partner names map
  const labInfoMap: Record<string, { name: string; short: string; color: string; email: string }> = {
    LAB_1: {
      name: 'Hydrochrom Analytical Services Limited',
      short: 'Hydrochrom Lab',
      color: '#16a34a',
      email: 'jarvismpock85@gmail.com',
    },
    LAB_2: {
      name: 'SAAG Chemical Nigeria Limited (SNCL)',
      short: 'SAAG Lab',
      color: '#0284c7',
      email: 'info@saagchemical.com.ng',
    },
    LAB_3: {
      name: 'Kazlat Public Analyst Laboratory',
      short: 'Kazlat Lab',
      color: '#7c3aed',
      email: 'info@kazlatpublicanalysts.com',
    },
    LAB_4: {
      name: 'Central Halal Laboratory',
      short: 'Central Halal Lab',
      color: '#b45309',
      email: 'info@halalcert.com.ng',
    },
  };

  const activeLabId = user?.labIdentifier || 'LAB_1';
  const activeLab = labInfoMap[activeLabId] || labInfoMap.LAB_1;

  return (
    <header className="topbar">
      {/* Left: Mobile Menu Toggle + Context Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="mobile-nav-toggle"
            aria-label="Open Navigation Menu"
            title="Open Menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div style={{ minWidth: 0 }}>
          <h2 className="topbar-title" style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
            {isLabPage ? activeLab.name : 'Sample Registration & Dispatch Portal'}
          </h2>
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
        {/* Quick Refresh */}
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            className="btn btn-secondary btn-sm"
            title="Refresh active records"
            style={{ padding: '6px 10px' }}
          >
            <RefreshCw size={13} />
            <span className="topbar-user-name" style={{ fontSize: '12px' }}>Refresh</span>
          </button>
        )}

        {/* Workflow Notifications Button */}
        <button
          onClick={onOpenNotifications}
          className="btn btn-secondary btn-sm"
          style={{ position: 'relative', padding: '6px 10px' }}
          title="View automated workflow notifications"
        >
          <Bell size={14} color="#0f172a" />
          <span className="topbar-user-name" style={{ fontSize: '12px' }}>Notifications</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: 99,
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* Logged in User Pill */}
        <div
          className="topbar-user-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 99,
          }}
          title={`${user?.name || 'User'} (${user?.role || 'Admin'})`}
        >
          <div
            className="user-dot"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: user?.role === 'SUPER_ADMIN' ? '#7c3aed' : '#0f172a',
              flexShrink: 0,
            }}
          />
          <span className="topbar-user-name" style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
            {user?.name?.split(' ')[0] || 'User'}
          </span>
          <span
            className="topbar-badge"
            style={{
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              background:
                user?.role === 'SUPER_ADMIN'
                  ? '#f3e8ff'
                  : user?.role === 'LAB_USER'
                  ? '#eff6ff'
                  : user?.role === 'ACCOUNTANT'
                  ? '#fef3c7'
                  : '#f1f5f9',
              color:
                user?.role === 'SUPER_ADMIN'
                  ? '#7c3aed'
                  : user?.role === 'LAB_USER'
                  ? '#1d4ed8'
                  : user?.role === 'ACCOUNTANT'
                  ? '#b45309'
                  : '#0f172a',
              padding: '2px 6px',
              borderRadius: 99,
              border:
                user?.role === 'SUPER_ADMIN'
                  ? '1px solid #d8b4fe'
                  : '1px solid transparent',
            }}
          >
            {user?.role === 'SUPER_ADMIN' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <ShieldAlert size={10} color="#7c3aed" />
                Super Admin
              </span>
            ) : user?.role === 'LAB_USER' ? (
              activeLab.short
            ) : user?.role === 'ACCOUNTANT' ? (
              'Accountant'
            ) : (
              'Admin'
            )}
          </span>
        </div>

        {/* Quick Switch back to Super Admin ONLY when Super Admin logged in as Lab */}
        {isSuperAdminAsLab && user?.role === 'LAB_USER' && (
          <button
            onClick={() => switchRole('SUPER_ADMIN')}
            className="btn btn-sm"
            title="Switch back to Super Admin account"
            style={{
              borderColor: '#d8b4fe',
              color: '#7c3aed',
              background: '#faf5ff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 8px',
            }}
          >
            <ShieldAlert size={13} color="#7c3aed" />
            <span className="topbar-user-name">Back to Super Admin</span>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Sign out of portal"
          style={{ borderColor: '#fecaca', color: '#dc2626', background: '#fff5f5', padding: '6px 10px' }}
        >
          <LogOut size={13} />
          <span className="topbar-user-name" style={{ fontSize: '12px' }}>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
