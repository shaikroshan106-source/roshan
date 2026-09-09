import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      background: '#0D1A0D',
      color: 'rgba(255,255,255,0.7)',
      padding: '4rem 0 2rem',
    }}>
      <div className="container">
        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '2.5rem', marginBottom: '3rem' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.6rem' }}>🌾</span>
              <span style={{
                fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem',
                background: 'linear-gradient(135deg, #4CAF50, #81C784)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Agri Direct</span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.5)', maxWidth: 280 }}>
              AI-powered agricultural trading platform connecting farmers directly to verified buyers across India.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              {['🇮🇳', '🤖', '🌾'].map((e, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                }}>
                  {e}
                </div>
              ))}
            </div>
          </div>

          {/* Pages */}
          <div>
            <h4 style={{ color: 'white', fontSize: '0.875rem', marginBottom: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                ['/marketplace', 'Marketplace'],
                ['/dashboard', 'Dashboard'],
                ['/bidding', 'Bidding'],
                ['/logistics', 'Logistics'],
              ].map(([to, label]) => (
                <Link key={to} to={to} style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s ease' }}
                  onMouseEnter={e => e.target.style.color = '#4CAF50'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* AI */}
          <div>
            <h4 style={{ color: 'white', fontSize: '0.875rem', marginBottom: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI Features</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['Price Prediction', 'Buyer Matching', 'Demand Forecast', 'Profit Optimization', 'Route Planner'].map(name => (
                <span key={name} style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>{name}</span>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: 'white', fontSize: '0.875rem', marginBottom: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Support</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
              <span>📞 1800-XXX-XXXX (Toll Free)</span>
              <span>📧 support@farmdirect.ai</span>
              <span>📍 Vizag, Andhra Pradesh</span>
              <span>🕗 Mon–Sat: 8AM–6PM</span>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
            © 2026 Agri Direct · Built for SIH 2026 · Inspired by e-NAM
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[
              { label: '🤖 AI Powered', color: 'rgba(0,229,199,0.8)' },
              { label: '🇮🇳 Made in India', color: 'rgba(255,255,255,0.4)' },
            ].map(({ label, color }) => (
              <span key={label} style={{ fontSize: '0.75rem', color }}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
