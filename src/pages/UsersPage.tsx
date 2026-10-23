import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Receipt,
  FlaskConical,
  Key,
  Copy,
  Check,
  Building2,
  Mail,
  Phone,
  Lock,
  Plus,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { User, UserRole } from '../types/index.js';

export const UsersPage: React.FC = () => {
  const { user: currentUser, switchRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [switchingLabId, setSwitchingLabId] = useState<string | null>(null);

  // Modal State for adding new user (Super Admin only)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('password123');
  const [formRole, setFormRole] = useState<UserRole>('ADMIN');
  const [formLabId, setFormLabId] = useState<string>('LAB_1');
  const [formPhone, setFormPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const displayedUsers = isSuperAdmin ? users : users.filter((u) => u.role !== 'SUPER_ADMIN');

  const handleLoginAsLab = async (labId: string, labName?: string) => {
    try {
      setSwitchingLabId(labId);
      await switchRole('LAB_USER', labId);
      setSuccessToast(`✓ Logged in as ${labName || labDirectory[labId]?.name || labId}! Navigating to Lab Workspace.`);
    } catch (err: any) {
      console.error('Failed to log in as lab:', err);
      setFormError(err.message || 'Failed to switch session to laboratory.');
    } finally {
      setSwitchingLabId(null);
    }
  };

  const labDirectory: Record<string, { name: string; email: string; short: string }> = {
    LAB_1: {
      name: 'Hydrochrom Analytical Services Limited',
      email: 'jarvismpock85@gmail.com',
      short: 'Hydrochrom Lab',
    },
    LAB_2: {
      name: 'SAAG Chemical Nigeria Limited (SNCL)',
      email: 'info@saagchemical.com.ng',
      short: 'SAAG Lab',
    },
    LAB_3: {
      name: 'Kazlat Public Analyst Laboratory',
      email: 'info@kazlatpublicanalysts.com',
      short: 'Kazlat Lab',
    },
    LAB_4: {
      name: 'Central Halal Laboratory',
      email: 'info@halalcert.com.ng',
      short: 'Central Halal Lab',
    },
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(res);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      setFormError('Name, email, and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const labName = formRole === 'LAB_USER' ? labDirectory[formLabId]?.name : undefined;

      await api.createUser({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword.trim(),
        role: formRole,
        labIdentifier: formRole === 'LAB_USER' ? formLabId : undefined,
        labName,
        phone: formPhone.trim(),
      });

      setSuccessToast(`User [${formEmail}] successfully created!`);
      setTimeout(() => setSuccessToast(null), 5000);
      setIsAddModalOpen(false);
      setFormName('');
      setFormEmail('');
      setFormPassword('password123');
      setFormPhone('');
      await loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for role styling
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: 'Super Admin',
          color: '#7c3aed',
          bg: '#f3e8ff',
          border: '#d8b4fe',
          icon: ShieldAlert,
        };
      case 'ADMIN':
        return {
          label: 'Admin',
          color: '#0f172a',
          bg: '#f1f5f9',
          border: '#cbd5e1',
          icon: ShieldCheck,
        };
      case 'ACCOUNTANT':
      case 'FINANCE':
        return {
          label: 'Accountant',
          color: '#b45309',
          bg: '#fef3c7',
          border: '#fde68a',
          icon: Receipt,
        };
      case 'LAB_USER':
        return {
          label: 'Testing Partner',
          color: '#1d4ed8',
          bg: '#eff6ff',
          border: '#bfdbfe',
          icon: FlaskConical,
        };
      default:
        return {
          label: role,
          color: '#475569',
          bg: '#f1f5f9',
          border: '#cbd5e1',
          icon: Users,
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: 10,
            padding: '12px 18px',
            color: '#065f46',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isSuperAdmin ? '#f3e8ff' : '#f1f5f9',
                color: isSuperAdmin ? '#7c3aed' : '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={18} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
              User Directory &amp; Role Management
            </h2>
          </div>
          <p style={{ fontSize: '12.5px', color: '#6b7280', margin: '4px 0 0 0' }}>
            {isSuperAdmin
              ? 'Portal access control. User account provisioning is restricted exclusively to the Super Administrator.'
              : 'Portal access control and staff role directory.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              background: '#f8fafc',
              color: '#475569',
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            {displayedUsers.length} Registered Accounts
          </span>

          {/* Conditional Add User Button: SUPER_ADMIN Only */}
          {isSuperAdmin && (
            <button
              onClick={() => {
                setFormError(null);
                setIsAddModalOpen(true);
              }}
              className="btn btn-primary btn-sm"
              style={{
                background: '#7c3aed',
                borderColor: '#6d28d9',
                boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
              }}
            >
              <Plus size={15} />
              <span>Add New User</span>
            </button>
          )}
        </div>
      </div>

      {/* Users Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
        {displayedUsers.map((acc, idx) => {
          const roleBadge = getRoleBadge(acc.role);
          const Icon = roleBadge.icon;
          const isUserSuperAdmin = acc.role === 'SUPER_ADMIN';

          return (
            <div
              key={acc.id || (acc as any)._id || idx}
              className="card"
              style={{
                padding: '20px',
                borderRadius: 14,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
                boxShadow: isUserSuperAdmin ? '0 4px 16px rgba(124, 58, 237, 0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                border: isUserSuperAdmin ? '1.5px solid #d8b4fe' : '1px solid #e5e7eb',
                background: isUserSuperAdmin
                  ? 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)'
                  : '#ffffff',
              }}
            >
              <div>
                {/* Header with role badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: roleBadge.bg,
                        color: roleBadge.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: `1px solid ${roleBadge.border}`,
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: 0 }}>
                        {acc.name}
                      </h4>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {acc.labName || (acc.role === 'LAB_USER' && acc.labIdentifier ? labDirectory[acc.labIdentifier]?.name : 'Internal HDI Staff')}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      background: roleBadge.bg,
                      color: roleBadge.color,
                      padding: '3px 9px',
                      borderRadius: 99,
                      whiteSpace: 'nowrap',
                      border: `1px solid ${roleBadge.border}`,
                      textTransform: 'uppercase',
                    }}
                  >
                    {roleBadge.label}
                  </span>
                </div>

                {/* Contact details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '11.5px', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={13} color="#94a3b8" />
                    <span style={{ color: '#111827', fontWeight: 600 }}>{acc.email}</span>
                  </div>
                  {acc.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} color="#94a3b8" />
                      <span>{acc.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Super Admin 1-Click Access for Lab Partners */}
              {isSuperAdmin && acc.role === 'LAB_USER' && (
                <button
                  type="button"
                  onClick={() => handleLoginAsLab(acc.labIdentifier || 'LAB_1', acc.name)}
                  disabled={Boolean(switchingLabId)}
                  className="btn btn-sm"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    fontSize: '12px',
                    padding: '8px 12px',
                    background: '#0f172a',
                    color: '#ffffff',
                    borderColor: '#1e293b',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 8,
                    boxShadow: '0 2px 4px rgba(0, 104, 55, 0.15)',
                  }}
                >
                  <LogIn size={14} />
                  <span>Log in as {acc.name.split(' ')[0] || 'Lab'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Super Admin Modal: Add New User ── */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => !isSubmitting && setIsAddModalOpen(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 520,
              padding: '24px 28px',
              borderRadius: 16,
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#f3e8ff',
                      color: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldAlert size={18} />
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: 0 }}>
                    Create New Portal Account
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Super Admin exclusive privilege. Newly created users can sign in immediately.
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: 5 }}>
                  Full Name / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Aminu Garba"
                  className="form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: 5 }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. aminugarba@hdi.com.ng"
                  className="form-input"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              {/* Role Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: 5 }}>
                  Portal Role *
                </label>
                <select
                  className="form-input"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="ADMIN">Portal Administrator (Registry &amp; Dispatch)</option>
                  <option value="ACCOUNTANT">Accountant (Invoices &amp; Finance)</option>
                  <option value="LAB_USER">External Partner Laboratory (Testing &amp; CoA)</option>
                  <option value="QA">Quality Assurance Officer (QA Review)</option>
                  <option value="MANAGEMENT">Executive / Management (Metrics &amp; TAT)</option>
                  <option value="SUPER_ADMIN">Super Administrator (Full System Authority)</option>
                </select>
              </div>

              {/* If LAB_USER: Lab Partner selection */}
              {formRole === 'LAB_USER' && (
                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e40af', marginBottom: 5 }}>
                    Assign Partner Laboratory *
                  </label>
                  <select
                    className="form-input"
                    value={formLabId}
                    onChange={(e) => setFormLabId(e.target.value)}
                  >
                    <option value="LAB_1">Hydrochrom Analytical Services Limited (jarvismpock85@gmail.com)</option>
                    <option value="LAB_2">SAAG Chemical Nigeria Limited (info@saagchemical.com.ng)</option>
                    <option value="LAB_3">Kazlat Public Analyst Laboratory (info@kazlatpublicanalysts.com)</option>
                    <option value="LAB_4">Central Halal Laboratory (info@halalcert.com.ng)</option>
                  </select>
                </div>
              )}

              {/* Temporary Password */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                    Initial Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#7c3aed',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Generate Random</span>
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-input"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: 9,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: 5 }}>
                  Contact Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +234 803 123 4567"
                  className="form-input"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    background: '#7c3aed',
                    borderColor: '#6d28d9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                  }}
                >
                  {isSubmitting ? 'Creating User…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
