import React, { useState, useEffect } from 'react';
import { LogIn, Eye, EyeOff, ShieldCheck, Building2, Users, Sparkles, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'reset'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Reset form state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // Clear inputs on page load / refresh to prevent automatic credential pre-fill
  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
    const t = setTimeout(() => {
      setEmail('');
      setPassword('');
    }, 100);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email/username and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!resetIdentifier.trim()) {
      setResetError('Please enter your registered email address or username.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      const res = await api.resetPassword(resetIdentifier.trim(), newPassword);
      setSuccessMessage(res.message || 'Password reset successfully! You can now log in with your new password.');
      setEmail(res.email || resetIdentifier.trim());
      setPassword('');
      setResetIdentifier('');
      setNewPassword('');
      setConfirmPassword('');
      setMode('login');
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password. Please check your email or username.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .login-card {
          width: 100%;
          max-width: 960px;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(15, 23, 42, 0.12), 0 2px 12px rgba(15, 23, 42, 0.08);
          border: 1px solid #e2e8f0;
          background: #ffffff;
        }
        @media (max-width: 860px) {
          .login-card {
            grid-template-columns: 1fr !important;
            max-width: 480px !important;
          }
          .login-brand-panel {
            padding: 32px 24px !important;
          }
          .login-form-panel {
            padding: 36px 24px !important;
          }
        }
      `}</style>

      <div className="login-card">
        {/* ── Left: HDI Branding Panel in verifying session dark slate ── */}
        <div
          className="login-brand-panel"
          style={{
            background: 'linear-gradient(175deg, #0f172a 0%, #1e293b 70%, #0f172a 100%)',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle pattern overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.04,
              backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
              backgroundSize: '20px 20px',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* HDI Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: '10px 14px',
                  display: 'inline-flex',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                }}
              >
                <img
                  src="https://halalcert.com.ng/HDI/image/hcaLogo.png"
                  alt="HDI Logo"
                  style={{ width: 88, height: 88, objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* Org Name */}
            <div style={{ textAlign: 'center', marginBottom: 26 }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#c9a227',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Halal &amp; Haram Distinction
              </div>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  lineHeight: 1.25,
                  letterSpacing: '-0.3px',
                  margin: '0 0 4px',
                }}
              >
                Development Initiative
              </h1>
              <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                Formerly Halal Certification Authority (HCA)
              </p>
            </div>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.4), transparent)',
                margin: '0 0 24px',
              }}
            />

            {/* Portal Title */}
            <div
              style={{
                textAlign: 'center',
                padding: '14px 20px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: 26,
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 4,
                }}
              >
                Internal System
              </p>
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.35 }}>
                Sample Registration &amp;
                <br />
                External Lab Dispatch Portal
              </p>
            </div>

            {/* Feature bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: <ShieldCheck size={14} />, text: 'Role-based access — Registry, QA, Finance & Management' },
                { icon: <Building2 size={14} />, text: 'Isolated lab portals for partner testing laboratories' },
                { icon: <Users size={14} />, text: 'Threaded admin-lab communication on every sample' },
                { icon: <Sparkles size={14} />, text: 'Automated email notifications at every workflow stage' },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: '12.5px',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  <span style={{ color: '#c9a227', marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom tag */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              textAlign: 'center',
              marginTop: 28,
            }}
          >
            © 2026 HDI Nigeria · Safeguarding lives through Halal
          </div>
        </div>

        {/* ── Right: Login / Reset Password Panel ── */}
        <div
          className="login-form-panel"
          style={{
            background: '#ffffff',
            padding: '52px 42px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'stretch',
            minHeight: '520px',
          }}
        >
          <div style={{ maxWidth: '380px', width: '100%', margin: '0 auto' }}>
            {mode === 'login' ? (
              <>
                {/* Form Header */}
                <div style={{ marginBottom: 26, textAlign: 'left' }}>
                  <h2
                    style={{
                      fontSize: '25px',
                      fontWeight: 900,
                      color: '#0f172a',
                      margin: '0 0 6px',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    Welcome Back
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                    Sign in with your portal credentials to continue
                  </p>
                </div>

                {/* Success Banner (e.g. after password reset) */}
                {successMessage && (
                  <div
                    style={{
                      padding: '12px 14px',
                      marginBottom: 18,
                      background: '#f0fdf4',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 9,
                      lineHeight: 1.45,
                    }}
                  >
                    <CheckCircle2 size={16} style={{ color: '#16a34a', marginTop: 1, flexShrink: 0 }} />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div
                    style={{
                      padding: '11px 14px',
                      marginBottom: 20,
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: 8,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} autoComplete="off">
                  {/* Hidden dummy fields to neutralize browser aggressive autofill */}
                  <input type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />
                  <input type="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />

                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                      Email Address or Username
                    </label>
                    <input
                      type="text"
                      id="hdi_portal_auth_user"
                      name="hdi_portal_auth_user"
                      className="form-input"
                      placeholder="Enter your email address or username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      style={{
                        padding: '12px 14px',
                        fontSize: '14px',
                        borderColor: '#cbd5e1',
                        borderRadius: 8,
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px', marginBottom: 6 }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="hdi_portal_auth_pass"
                        name="hdi_portal_auth_pass"
                        className="form-input"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        style={{
                          padding: '12px 44px 12px 14px',
                          fontSize: '14px',
                          borderColor: '#cbd5e1',
                          borderRadius: 8,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          padding: 0,
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>

                    {/* Forgot password placed BELOW the input field */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setResetIdentifier(email);
                          setResetError('');
                          setError('');
                          setMode('reset');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0f172a',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px',
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '13px',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      borderRadius: 9,
                      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                      boxShadow: '0 4px 16px rgba(15, 23, 42, 0.35)',
                      cursor: isSubmitting ? 'wait' : 'pointer',
                      justifyContent: 'center',
                    }}
                  >
                    <LogIn size={16} />
                    <span>{isSubmitting ? 'Signing In…' : 'Sign In to Portal'}</span>
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* Reset Password Form Header */}
                <div style={{ marginBottom: 24, textAlign: 'left' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setResetError('');
                      setMode('login');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '0 0 14px 0',
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Sign In</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <KeyRound size={18} style={{ color: '#0f172a' }} />
                    </div>
                    <h2
                      style={{
                        fontSize: '23px',
                        fontWeight: 900,
                        color: '#0f172a',
                        margin: 0,
                        letterSpacing: '-0.3px',
                      }}
                    >
                      Forgot Password
                    </h2>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                    Enter your registered email address or username to reset your password.
                  </p>
                </div>

                {/* Reset Error Banner */}
                {resetError && (
                  <div
                    style={{
                      padding: '11px 14px',
                      marginBottom: 18,
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: 8,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    <span>⚠️</span>
                    <span>{resetError}</span>
                  </div>
                )}

                {/* Reset Password Form */}
                <form onSubmit={handleResetPassword} autoComplete="off">
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                      Registered Email or Username
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter your registered email address or username"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      required
                      autoComplete="off"
                      style={{
                        padding: '12px 14px',
                        fontSize: '14px',
                        borderColor: '#cbd5e1',
                        borderRadius: 8,
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ position: 'relative', marginBottom: 16 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                      New Password (min. 6 characters)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        style={{
                          padding: '12px 44px 12px 14px',
                          fontSize: '14px',
                          borderColor: '#cbd5e1',
                          borderRadius: 8,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          padding: 0,
                        }}
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ position: 'relative', marginBottom: 22 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                      Confirm New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        style={{
                          padding: '12px 44px 12px 14px',
                          fontSize: '14px',
                          borderColor: '#cbd5e1',
                          borderRadius: 8,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          padding: 0,
                        }}
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isResetSubmitting}
                    style={{
                      width: '100%',
                      padding: '13px',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      borderRadius: 9,
                      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                      boxShadow: '0 4px 16px rgba(15, 23, 42, 0.35)',
                      cursor: isResetSubmitting ? 'wait' : 'pointer',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <KeyRound size={16} />
                    <span>{isResetSubmitting ? 'Updating Password…' : 'Reset & Save Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResetError('');
                      setMode('login');
                    }}
                    style={{
                      width: '100%',
                      padding: '11px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      borderRadius: 8,
                      background: '#f8fafc',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    Cancel
                  </button>
                </form>
              </>
            )}

            {/* Subtle Footer Note */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                Halal &amp; Haram Distinction Development Initiative
              </p>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Secure Central Laboratory Registry &amp; Dispatch
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
