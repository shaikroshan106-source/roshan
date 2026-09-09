import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const publicNavLinks = [
  { to: '/',        label: 'Home'      },
  { to: '/problem', label: 'About Us!' },
];

const protectedNavLinksBase = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/dashboard',   label: 'Dashboard'   },
  { to: '/bidding',     label: 'Bidding'     },
  { to: '/logistics',   label: 'Logistics'   },
];

const languages = [
  { code: 'En', label: 'English', native: 'English' },
  { code: 'Ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'Sin', label: 'Sinhala', native: 'සිංහල' },
  { code: 'Te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'Hi', label: 'Hindi', native: 'हिन्दी' },
];

export default function Navbar() {
  const { isLoggedIn, role, user, roles, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentLang,  setCurrentLang]  = useState('En'); // 'En' | 'Ta' | 'Sin' | 'Te' | 'Hi'
  const userMenuRef = useRef(null);
  const langMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Safe outside-click detection using refs
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  function handleLogout(e) {
    if (e) e.stopPropagation();
    setUserMenuOpen(false);
    logout();
    navigate('/login');
  }

  const roleInfo        = roles[role] || roles.farmer;
  const roleAccentColor = role === 'admin' ? '#7C5CFF' : role === 'buyer' ? '#F5A623' : '#052E2B';

  // Report option appears ONLY when logged in to either farmer or buyer account, and right next to Logistics
  const canReport = isLoggedIn && (role === 'farmer' || role === 'buyer');
  const userProtectedLinks = [
    ...protectedNavLinksBase,
    ...(canReport ? [{ to: '/report', label: '📢 Report' }] : []),
  ];

  // Build visible nav links based on login state
  const rawLinks = [
    ...publicNavLinks,
    ...(isLoggedIn ? userProtectedLinks : []),
    ...(isLoggedIn && role === 'admin' ? [{ to: '/admin', label: '⚙️ Admin Panel' }] : []),
  ];
  const visibleLinks = rawLinks.filter((item, index, self) => index === self.findIndex(t => t.to === item.to));

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.06)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
        padding: '0 2rem',
        height: 68,
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1360, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', height: '100%', gap: '1.5rem' }}>

          {/* Left Brand: Agri direct */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🌾</span>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1.2rem',
              color: '#111827',
              letterSpacing: '-0.01em',
            }}>
              Agri direct
            </span>
          </Link>

          {/* Nav Links: Home, About Us!, Marketplace, Dashboard, Bidding, Logistics */}
          <div style={{ display: 'flex', gap: '1.5rem', flex: 1, justifyContent: 'center' }} className="nav-links-desktop">
            {visibleLinks.map(link => {
              const isAdminLink = link.to === '/admin';
              const isActive    = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isAdminLink
                      ? (isActive ? '#7C5CFF' : 'rgba(124,92,255,0.85)')
                      : (isActive ? '#052E2B' : '#1F2937'),
                    borderBottom: isActive ? '2px solid #052E2B' : '2px solid transparent',
                    padding: '0.4rem 0.2rem',
                    transition: 'all 0.15s ease',
                    fontFamily: 'var(--font-body)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side: Language Selector (En/Ta/Sin), User Login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto', flexShrink: 0 }}>

            {/* Language Selector with Down Arrow Mechanism */}
            <div ref={langMenuRef} style={{ position: 'relative' }}>
              <button
                id="lang-select-btn"
                type="button"
                onClick={() => setLangMenuOpen(o => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: '#1F2937',
                  fontFamily: 'var(--font-body)',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  padding: '0.4rem 0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                }}
              >
                <span style={{ fontSize: '0.95rem' }}>🌐</span>
                <span>{languages.find(l => l.code === currentLang)?.native || currentLang}</span>
                {/* Down arrow mechanism */}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    color: '#64748B',
                    transition: 'transform 0.2s ease',
                    transform: langMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {langMenuOpen && (
                <div
                  id="lang-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08)',
                    padding: '0.4rem',
                    minWidth: 160,
                    zIndex: 1100,
                  }}
                >
                  {languages.map(l => (
                    <button
                      key={l.code}
                      type="button"
                      id={`lang-opt-${l.code.toLowerCase()}`}
                      onClick={() => {
                        setCurrentLang(l.code);
                        setLangMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        border: 'none',
                        borderRadius: 6,
                        background: currentLang === l.code ? '#F0FDF4' : 'transparent',
                        color: currentLang === l.code ? '#052E2B' : '#374151',
                        fontWeight: currentLang === l.code ? 700 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-body)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <span>{l.native} <small style={{ color: '#94A3B8', marginLeft: 4 }}>({l.code})</small></span>
                      {currentLang === l.code && <span style={{ color: '#052E2B', fontWeight: 800 }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Google Voice Assistant Quick Trigger Button (Shown ONLY in Home page top menu) */}
            {location.pathname === '/' && (
              <button
                id="nav-google-assistant-btn"
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open_google_voice_assistant', { detail: { lang: currentLang === 'Hi' ? 'Hi' : currentLang === 'Te' ? 'Te' : 'En' } }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.42rem 0.8rem',
                  borderRadius: '20px',
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(66, 133, 244, 0.4)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#202124',
                  boxShadow: '0 1px 4px rgba(66, 133, 244, 0.12)',
                  transition: 'all 0.2s ease',
                }}
                title="Speak with Google Assistant (Telugu, English, Hindi)"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4285F4' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EA4335' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FBBC05' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34A853' }} />
                </div>
                <span>🎙️ Voice</span>
              </button>
            )}

            {/* "User Login" / User Session */}
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div ref={userMenuRef} style={{ position: 'relative' }}>
                  <button
                    id="user-menu-btn"
                    onClick={() => setUserMenuOpen(o => !o)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 6,
                      background: '#052E2B',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer', fontFamily: 'var(--font-heading)',
                      fontSize: '0.85rem', fontWeight: 600,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{roleInfo.emoji}</span>
                    <span style={{ maxWidth: 85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.name?.split(' ')[0] || roleInfo.label}
                    </span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▾</span>
                  </button>

                  {userMenuOpen && (
                    <div
                      onMouseDown={e => e.stopPropagation()}
                      style={{
                        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                        background: 'white', borderRadius: 8,
                        boxShadow: '0 10px 35px rgba(0,0,0,0.15)', padding: '0.75rem',
                        minWidth: 200, border: '1px solid #E5E7EB', zIndex: 1100,
                      }}
                    >
                      <div style={{ padding: '0.5rem 0.75rem 0.75rem', borderBottom: '1px solid #E5E7EB', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{user?.name}</div>
                        <div style={{ color: '#052E2B', fontSize: '0.78rem', fontWeight: 600, marginTop: 2 }}>
                          {roleInfo.emoji} {roleInfo.label}
                        </div>
                      </div>

                      {role !== 'admin' && (
                        <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} style={dropdownItemStyle}>
                          📊 My Dashboard
                        </Link>
                      )}
                      {role === 'admin' && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} style={dropdownItemStyle}>
                          ⚙️ Admin Panel
                        </Link>
                      )}
                      <Link to="/marketplace" onClick={() => setUserMenuOpen(false)} style={dropdownItemStyle}>
                        🛒 Marketplace
                      </Link>

                      <button
                        id="dropdown-logout-btn"
                        type="button"
                        onClick={handleLogout}
                        onMouseDown={e => e.stopPropagation()}
                        style={{
                          ...dropdownItemStyle,
                          width: '100%', textAlign: 'left',
                          background: 'rgba(239,83,80,0.08)',
                          border: '1px solid rgba(239,83,80,0.2)',
                          color: '#ef5350', marginTop: '0.5rem',
                          fontWeight: 700,
                        }}
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>

                <button
                  id="nav-direct-logout-btn"
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: 6,
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              /* "User Login" Button Matching Reference Image */
              <Link
                to="/login"
                id="nav-user-login-btn"
                style={{
                  padding: '0.48rem 1.15rem',
                  borderRadius: 6,
                  background: '#052E2B',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-heading)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>👤</span>
                <span>User Login</span>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'none', flexDirection: 'column', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem',
            }}
            className="hamburger"
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: 'block', width: 22, height: 2,
                background: '#111827', borderRadius: 2,
                transition: 'all 0.3s ease',
              }} />
            ))}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div style={{
            position: 'absolute', top: 68, left: 0, right: 0,
            background: 'white', padding: '1rem',
            borderTop: '1px solid #E5E7EB',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }}>
            {visibleLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: 'block', padding: '0.75rem 1rem',
                  fontSize: '0.95rem', fontWeight: 500,
                  color: location.pathname === link.to ? '#052E2B' : '#4B5563',
                  borderRadius: 6,
                  background: location.pathname === link.to ? '#F3F4F6' : 'transparent',
                  marginBottom: '0.25rem',
                }}
              >
                {link.label}
              </Link>
            ))}

            {isLoggedIn ? (
              <button
                id="mobile-logout-btn"
                onClick={handleLogout}
                style={{
                  display: 'block', width: '100%', padding: '0.75rem 1rem',
                  marginTop: '0.5rem', textAlign: 'left', cursor: 'pointer',
                  background: '#FEF2F2', border: '1px solid #FECACA',
                  borderRadius: 6, color: '#DC2626',
                  fontWeight: 700, fontFamily: 'var(--font-body)', fontSize: '0.95rem',
                }}
              >
                🚪 Sign Out
              </button>
            ) : (
              <Link to="/login" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.75rem 1rem', marginTop: '0.5rem',
                background: '#052E2B', borderRadius: 6, color: 'white',
                fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none',
              }}>
                <span>👤</span>
                <span>User Login</span>
              </Link>
            )}
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 1040px) {
          .nav-links-desktop { display: none !important; }
          .hamburger { display: flex !important; }
        }
        #nav-user-login-btn:hover { background: #031E1C; }
        #nav-direct-logout-btn:hover { background: #fee2e2; }
      `}</style>
    </>
  );
}

const dropdownItemStyle = {
  display: 'block', padding: '0.5rem 0.75rem',
  borderRadius: 6, fontSize: '0.875rem', fontWeight: 500,
  color: '#1F2937', textDecoration: 'none', cursor: 'pointer',
  background: 'transparent', border: 'none', width: '100%',
  fontFamily: 'var(--font-body)', marginBottom: '0.15rem',
};
