import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, demoLogin, isLoggedIn, user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from?.pathname || '/marketplace';

  // Section tabs: 'portal' (Farmer & Buyer merged) | 'admin' (Admin exclusive)
  const [activeSection, setActiveSection] = useState('portal');
  // Inside the merged portal: 'farmer' | 'buyer'
  const [portalRole, setPortalRole] = useState('farmer');

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [error, setError] = useState('');
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
    await new Promise(r => setTimeout(r, 250));
    const result = demoLogin(targetRole);
    setLoading(false);
    if (result.success) {
      navigate(targetRole === 'admin' ? '/admin' : destination, { replace: true });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 350));

    const selectedRole = activeSection === 'admin' ? 'admin' : portalRole;
    const result = login({
      roleId: selectedRole,
      name: form.name,
      phone: form.phone,
      email: form.email,
      password: form.password,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.message);
    } else {
      navigate(selectedRole === 'admin' ? '/admin' : destination, { replace: true });
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
            onClick={() => { setActiveSection('admin'); setError(''); }}
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

        {/* If in Farmer & Buyer section, show role toggle */}
        {!isAdminSection && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            padding: '0.4rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>I am logging in as:</span>
            <button
              type="button"
              onClick={() => { setPortalRole('farmer'); setError(''); }}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: portalRole === 'farmer' ? '#4CAF50' : 'transparent',
                color: portalRole === 'farmer' ? 'white' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              👨‍🌾 Farmer
            </button>
            <button
              type="button"
              onClick={() => { setPortalRole('buyer'); setError(''); }}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: portalRole === 'buyer' ? '#F5A623' : 'transparent',
                color: portalRole === 'buyer' ? 'white' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              🏪 Buyer
            </button>
          </div>
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
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>OR ENTER CREDENTIALS</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Farmer & Buyer fields */}
          {!isAdminSection ? (
            <>
              <div>
                <label style={labelStyle}>Your Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder={portalRole === 'farmer' ? 'e.g. Ravi Kumar' : 'e.g. Srinivas M.'}
                  value={form.name}
                  onChange={handleChange}
                  style={inputStyle(accentColor)}
                  autoComplete="name"
                />
              </div>
              <div>
                <label style={labelStyle}>Phone Number (Optional)</label>
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
            </>
          ) : (
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
          )}

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder={isAdminSection ? 'admin@123' : `${portalRole}123`}
                value={form.password}
                onChange={handleChange}
                style={{ ...inputStyle(accentColor), paddingRight: '3rem' }}
                autoComplete="current-password"
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

          {/* Submit */}
          <button
            type="submit"
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
              <span>⟳ Signing in...</span>
            ) : (
              <span>
                {isAdminSection
                  ? 'Sign In as System Admin'
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
