import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, register, demoLogin, isLoggedIn, user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from?.pathname || '/marketplace';

  // Section tabs: 'portal' (Farmer & Buyer) | 'admin' (Admin exclusive)
  const [activeSection, setActiveSection] = useState('portal');
  // Inside the portal: 'farmer' | 'buyer'
  const [portalRole, setPortalRole] = useState('farmer');
  // Auth mode for portal: 'signin' | 'register'
  const [authMode, setAuthMode] = useState('signin');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    companyName: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState('');

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  function handleLogout() {
    logout();
    setLogoutNotice('Logged out successfully. You can sign in with another account below.');
    setTimeout(() => setLogoutNotice(''), 4000);
  }

  async function handleDemoLogin(targetRole) {
    setLoading(true);
    setError('');
    const result = await demoLogin(targetRole);
    setLoading(false);
    if (result.success) {
      navigate(targetRole === 'admin' ? '/admin' : destination, { replace: true });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    const selectedRole = activeSection === 'admin' ? 'admin' : portalRole;

    if (activeSection !== 'admin' && authMode === 'register') {
      // ── Client-side validation for Registration ──
      if (!form.name.trim()) {
        setLoading(false);
        setError('Please enter your full name.');
        return;
      }
      if (!form.email.trim()) {
        setLoading(false);
        setError('Please enter your email address.');
        return;
      }
      if (!form.password || form.password.length < 6) {
        setLoading(false);
        setError('Password must be at least 6 characters.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setLoading(false);
        setError('Passwords do not match. Please re-enter.');
        return;
      }

      const result = await register({
        role: selectedRole,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location.trim() || (selectedRole === 'farmer' ? 'Vizag' : 'Guntur'),
        companyName: form.companyName.trim() || form.name.trim(),
        password: form.password,
      });

      setLoading(false);
      if (!result.success) {
        setError(result.message || 'Registration failed.');
      } else {
        setSuccessMsg(result.message || `Welcome to AgriDirect, ${form.name}!`);
        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 600);
      }
    } else {
      // ── Sign In ──
      if (!form.email.trim() && !form.phone.trim() && activeSection !== 'admin') {
        setLoading(false);
        setError('Please enter your email address or mobile phone.');
        return;
      }
      if (activeSection === 'admin' && !form.email.trim()) {
        setLoading(false);
        setError('Please enter your admin email address.');
        return;
      }
      if (!form.password) {
        setLoading(false);
        setError('Please enter your password.');
        return;
      }

      const result = await login({
        roleId: selectedRole,
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
      });

      setLoading(false);
      if (!result.success) {
        setError(result.message || 'Login failed. Please check your credentials.');
      } else {
        navigate(selectedRole === 'admin' ? '/admin' : destination, { replace: true });
      }
    }
  }

  const isAdminSection = activeSection === 'admin';
  const accentColor = isAdminSection
    ? '#7C5CFF'
    : portalRole === 'buyer'
      ? '#F5A623'
      : '#4CAF50';

  const accentGlow = isAdminSection
    ? 'rgba(124,92,255,0.28)'
    : portalRole === 'buyer'
      ? 'rgba(245,166,35,0.22)'
      : 'rgba(76,175,80,0.22)';

  return (
    <div style={containerStyle}>
      {/* Dynamic background glow */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`,
        top: '-15%', left: '-10%',
        transition: 'background 0.5s ease',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,199,0.08) 0%, transparent 70%)',
        bottom: '-10%', right: '-5%',
        pointerEvents: 'none',
      }} />

      {/* Grid dot pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        pointerEvents: 'none',
      }} />

      {/* Main Card */}
      <div style={cardStyle(accentColor)}>
        {/* Top accent border */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${accentColor}, #00E5C7)`,
          borderRadius: '24px 24px 0 0',
          transition: 'background 0.4s ease',
        }} />

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1.25rem', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.8rem' }}>🌾</span>
          <span style={{
            fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem',
            background: 'linear-gradient(135deg, #4CAF50, #81C784)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Agri<span style={{ color: 'var(--color-ai-teal)', WebkitTextFillColor: 'var(--color-ai-teal)' }}> Direct</span>
          </span>
        </Link>

        {/* Status banner if currently logged in */}
        {isLoggedIn && (
          <div style={{
            background: 'rgba(76,175,80,0.12)',
            border: '1px solid rgba(76,175,80,0.28)',
            borderRadius: 14,
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Current Active Session:</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'white' }}>
                {role === 'admin' ? '⚙️' : role === 'buyer' ? '🏪' : '👨‍🌾'} {user?.name} ({role.toUpperCase()})
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                id="portal-dashboard-btn"
                onClick={() => navigate(role === 'admin' ? '/admin' : destination)}
                style={{
                  padding: '0.35rem 0.75rem',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Go to App →
              </button>
              <button
                type="button"
                id="portal-logout-btn"
                onClick={handleLogout}
                style={{
                  padding: '0.35rem 0.75rem',
                  background: 'rgba(239,83,80,0.2)',
                  border: '1px solid rgba(239,83,80,0.4)',
                  borderRadius: 8,
                  color: '#ff7675',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                🚪 Log Out
              </button>
            </div>
          </div>
        )}

        {/* Logout success notification */}
        {logoutNotice && (
          <div style={{
            background: 'rgba(33,150,243,0.15)',
            border: '1px solid rgba(33,150,243,0.3)',
            borderRadius: 10,
            padding: '0.65rem 1rem',
            color: '#64b5f6',
            fontSize: '0.83rem',
            marginBottom: '1rem',
            textAlign: 'center',
          }}>
            ✓ {logoutNotice}
          </div>
        )}

        <h2 style={{ color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.3rem', textAlign: 'center' }}>
          {isAdminSection ? '⚙️ Admin Portal' : '🌾 Farmer & Buyer Portal'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          {isAdminSection
            ? 'Full website administration & control access'
            : 'Unified direct trading portal for agriculture'}
        </p>

        {/* Top-Level Section Tabs: Merged Farmer & Buyer vs Admin */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 14,
          padding: '0.3rem',
          marginBottom: '1.25rem',
          gap: '0.3rem',
        }}>
          <button
            type="button"
            onClick={() => { setActiveSection('portal'); setError(''); }}
            style={{
              flex: 1.2,
              padding: '0.6rem 0.5rem',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.25s ease',
              background: activeSection === 'portal' ? 'linear-gradient(135deg, #2E7D32, #4CAF50)' : 'transparent',
              color: activeSection === 'portal' ? 'white' : 'rgba(255,255,255,0.55)',
              boxShadow: activeSection === 'portal' ? '0 4px 14px rgba(76,175,80,0.35)' : 'none',
            }}
          >
            🌾 Farmer &amp; Buyer
          </button>

          <button
            type="button"
            onClick={() => { setActiveSection('admin'); setAuthMode('signin'); setError(''); }}
            style={{
              flex: 0.8,
              padding: '0.6rem 0.5rem',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.25s ease',
              background: activeSection === 'admin' ? 'linear-gradient(135deg, #5E35B1, #7C5CFF)' : 'transparent',
              color: activeSection === 'admin' ? 'white' : 'rgba(255,255,255,0.55)',
              boxShadow: activeSection === 'admin' ? '0 4px 14px rgba(124,92,255,0.35)' : 'none',
            }}
          >
            ⚙️ Admin
          </button>
        </div>

        {/* If in Farmer & Buyer section, show Role Toggle & Mode Toggle */}
        {!isAdminSection && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '0.85rem',
              padding: '0.4rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>I am:</span>
              <button
                type="button"
                onClick={() => { setPortalRole('farmer'); setError(''); }}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: portalRole === 'farmer' ? '#4CAF50' : 'transparent',
                  color: portalRole === 'farmer' ? 'white' : 'rgba(255,255,255,0.5)',
                  boxShadow: portalRole === 'farmer' ? '0 2px 8px rgba(76,175,80,0.4)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                👨‍🌾 Farmer
              </button>
              <button
                type="button"
                onClick={() => { setPortalRole('buyer'); setError(''); }}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: portalRole === 'buyer' ? '#F5A623' : 'transparent',
                  color: portalRole === 'buyer' ? 'white' : 'rgba(255,255,255,0.5)',
                  boxShadow: portalRole === 'buyer' ? '0 2px 8px rgba(245,166,35,0.4)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                🏪 Buyer
              </button>
            </div>

            {/* Auth Mode Toggle (Sign In vs Create Account) */}
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 10,
              padding: '0.25rem',
              marginBottom: '1.25rem',
              gap: '0.25rem',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <button
                type="button"
                id="portal-tab-signin"
                onClick={() => { setAuthMode('signin'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: authMode === 'signin' ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: authMode === 'signin' ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.2s ease',
                }}
              >
                🔑 Sign In
              </button>
              <button
                type="button"
                id="portal-tab-register"
                onClick={() => { setAuthMode('register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: authMode === 'register' ? accentColor : 'transparent',
                  color: authMode === 'register' ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  boxShadow: authMode === 'register' ? `0 2px 10px ${accentColor}55` : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                ✨ Create Account
              </button>
            </div>
          </>
        )}

        {/* 1-Click Fast Demo Buttons */}
        <div style={{
          marginBottom: '1.5rem',
          padding: '0.85rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
        }}>
          <div style={{
            fontSize: '0.74rem',
            color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
            fontWeight: 700,
          }}>
            ⚡ 1-Click Instant Demo Access
          </div>

          {!isAdminSection ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                id="demo-farmer-btn"
                onClick={() => handleDemoLogin('farmer')}
                style={demoBtnStyle('#4CAF50')}
              >
                👨‍🌾 Demo Farmer
              </button>
              <button
                type="button"
                id="demo-buyer-btn"
                onClick={() => handleDemoLogin('buyer')}
                style={demoBtnStyle('#F5A623')}
              >
                🏪 Demo Buyer
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="demo-admin-btn"
              onClick={() => handleDemoLogin('admin')}
              style={{ ...demoBtnStyle('#7C5CFF'), width: '100%' }}
            >
              ⚙️ Full Admin Access (1-Click)
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
            {authMode === 'register' && !isAdminSection ? 'ENTER REGISTRATION DETAILS' : 'OR ENTER CREDENTIALS'}
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Admin Mode Form */}
          {isAdminSection ? (
            <div>
              <label style={labelStyle}>Admin Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="admin@agridirect.com"
                value={form.email}
                onChange={handleChange}
                required
                style={inputStyle(accentColor)}
                autoComplete="email"
              />
            </div>
          ) : authMode === 'register' ? (
            /* ── Registration Form (Farmer / Buyer) ── */
            <>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  name="name"
                  type="text"
                  placeholder={portalRole === 'farmer' ? 'e.g. Ramesh Reddy' : 'e.g. Anand Sharma'}
                  value={form.name}
                  onChange={handleChange}
                  required
                  style={inputStyle(accentColor)}
                  autoComplete="name"
                />
              </div>

              <div>
                <label style={labelStyle}>Email Address *</label>
                <input
                  name="email"
                  type="email"
                  placeholder={portalRole === 'farmer' ? 'farmer@agridirect.com' : 'buyer@agrimart.com'}
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={inputStyle(accentColor)}
                  autoComplete="email"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Mobile Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={handleChange}
                    style={inputStyle(accentColor)}
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label style={labelStyle}>City / Mandi Location</label>
                  <input
                    name="location"
                    type="text"
                    placeholder={portalRole === 'farmer' ? 'e.g. Vizag, AP' : 'e.g. Guntur, AP'}
                    value={form.location}
                    onChange={handleChange}
                    style={inputStyle(accentColor)}
                  />
                </div>
              </div>

              {portalRole === 'buyer' && (
                <div>
                  <label style={labelStyle}>Company / Firm Name</label>
                  <input
                    name="companyName"
                    type="text"
                    placeholder="e.g. Balaji Agro Trading Co."
                    value={form.companyName}
                    onChange={handleChange}
                    style={inputStyle(accentColor)}
                  />
                </div>
              )}
            </>
          ) : (
            /* ── Sign In Form (Farmer / Buyer) ── */
            <div>
              <label style={labelStyle}>Email Address or Phone Number</label>
              <input
                name="email"
                type="text"
                placeholder={portalRole === 'farmer' ? 'ravi.kumar@apfarms.in or 9876543210' : 'procurement@srinivasagro.com or 8765432109'}
                value={form.email}
                onChange={handleChange}
                required
                style={inputStyle(accentColor)}
                autoComplete="username"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label style={labelStyle}>
              {authMode === 'register' && !isAdminSection ? 'Create Password (min 6 chars) *' : 'Password'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder={isAdminSection ? 'admin@123' : `${portalRole}123`}
                value={form.password}
                onChange={handleChange}
                style={{ ...inputStyle(accentColor), paddingRight: '3rem' }}
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)', fontSize: '1rem',
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password (only in registration mode) */}
          {authMode === 'register' && !isAdminSection && (
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <input
                name="confirmPassword"
                type={showPass ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                style={inputStyle(accentColor)}
                autoComplete="new-password"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239,83,80,0.12)', border: '1px solid rgba(239,83,80,0.3)',
              borderRadius: 10, padding: '0.65rem 1rem',
              color: '#ef5350', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div style={{
              background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.35)',
              borderRadius: 10, padding: '0.65rem 1rem',
              color: '#81c784', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              ✓ {successMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={loading}
            style={{
              padding: '0.85rem',
              background: loading
                ? 'rgba(255,255,255,0.1)'
                : `linear-gradient(135deg, ${accentColor}, ${isAdminSection ? '#00E5C7' : accentColor}dd)`,
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : `0 8px 24px ${accentColor}44`,
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {loading ? (
              <span>⟳ {authMode === 'register' && !isAdminSection ? 'Creating Account...' : 'Signing in...'}</span>
            ) : (
              <span>
                {isAdminSection
                  ? 'Sign In as System Admin'
                  : authMode === 'register'
                    ? `Create ${portalRole === 'farmer' ? 'Farmer' : 'Buyer'} Account ✨`
                    : `Sign In as ${portalRole === 'farmer' ? 'Farmer 🌾' : 'Buyer 🏪'}`}
              </span>
            )}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>
          By signing in you agree to Agri Direct terms &amp; conditions.
        </p>
      </div>
    </div>
  );
}

const containerStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #0a0f0a 0%, #111b11 45%, #0f1520 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2.5rem 1rem',
  position: 'relative',
  overflow: 'hidden',
};

function cardStyle(accentColor) {
  return {
    width: '100%',
    maxWidth: 470,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: '2.2rem 2rem',
    position: 'relative',
    boxShadow: `0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px ${accentColor}15`,
    transition: 'box-shadow 0.4s ease',
    zIndex: 1,
  };
}

const labelStyle = {
  display: 'block',
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.8rem',
  fontWeight: 600,
  marginBottom: '0.35rem',
  letterSpacing: '0.04em',
};

function inputStyle(accent) {
  return {
    width: '100%',
    padding: '0.72rem 1rem',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    color: 'white',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };
}

function demoBtnStyle(color) {
  return {
    padding: '0.55rem 0.6rem',
    borderRadius: 9,
    background: `${color}18`,
    border: `1px solid ${color}44`,
    color: 'white',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  };
}
