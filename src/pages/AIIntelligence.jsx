import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    id: 'price-prediction',
    icon: '📈',
    title: 'AI Price Prediction',
    subtitle: 'Know the best price before you sell',
    desc: 'Our ML model analyzes historical APMC data, seasonal patterns, weather forecasts, and regional demand to predict crop prices with 92%+ accuracy — up to 7 days ahead.',
    stats: [{ label: 'Accuracy', val: '92%' }, { label: 'Lookahead', val: '7 days' }],
    accent: '#4CAF50',
    ai: true,
  },
  {
    id: 'buyer-matching',
    icon: '🤝',
    title: 'Smart Buyer Matching',
    subtitle: 'Connect with the right buyer, instantly',
    desc: 'Our AI evaluates 50+ parameters — crop quality, buyer history, payment reliability, distance, and price offered — to rank and match the most suitable verified buyers to your lot.',
    stats: [{ label: 'Buyers', val: '380+' }, { label: 'Match Rate', val: '94%' }],
    accent: '#00E5C7',
    ai: true,
  },
  {
    id: 'demand-forecast',
    icon: '📊',
    title: 'Demand Forecasting',
    subtitle: 'Grow what the market needs',
    desc: 'FarmAI processes city-level consumption data, mandi trends, festival calendars, and export demand to forecast which crops will be in high demand next season in your region.',
    stats: [{ label: 'Regions', val: '12' }, { label: 'Crops', val: '40+' }],
    accent: '#F5A623',
    ai: false,
  },
  {
    id: 'profit-optimization',
    icon: '💰',
    title: 'Profit Optimization',
    subtitle: 'Maximize earnings on every lot',
    desc: 'Beyond price — FarmAI considers transport costs, storage time, quality degradation, and competitive bid analysis to recommend the optimal time, buyer, and price for each lot.',
    stats: [{ label: 'Avg Gain', val: '+₹2.4/kg' }, { label: 'ROI', val: '+18%' }],
    accent: '#7C5CFF',
    ai: true,
  },
];

const comparison = [
  { aspect: 'Price Discovery', old: 'Middleman decides', new: 'AI-predicted, transparent' },
  { aspect: 'Buyer Access',    old: 'Local only',        new: 'State-wide verified network' },
  { aspect: 'Payment Time',   old: '2-4 weeks',         new: 'Same-day direct transfer' },
  { aspect: 'Transport Cost', old: 'Fixed, no choice',   new: 'AI-optimized 3 routes' },
  { aspect: 'Market Data',    old: 'No access',          new: 'Real-time + 7-day forecast' },
  { aspect: 'Profit',         old: '40-50% of retail',  new: '70-80% of retail' },
];

export default function AIIntelligence() {
  useEffect(() => {
    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        gsap.fromTo('.ai-feature-card', { opacity: 0, y: 60 }, {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.2, ease: 'power3.out',
          scrollTrigger: { trigger: '.ai-features-grid', start: 'top 70%' },
        });

        gsap.fromTo('.comparison-row', { opacity: 0, x: -30 }, {
          opacity: 1, x: 0, duration: 0.5, stagger: 0.1,
          scrollTrigger: { trigger: '.comparison-table', start: 'top 75%' },
        });

        // Hover effect on AI cards
        document.querySelectorAll('.ai-feature-card').forEach(card => {
          card.addEventListener('mouseenter', () => {
            gsap.to(card, { scale: 1.03, duration: 0.3, ease: 'power2.out' });
          });
          card.addEventListener('mouseleave', () => {
            gsap.to(card, { scale: 1, duration: 0.3, ease: 'power2.out' });
          });
        });
      });
    });
  }, []);

  return (
    <main style={{ paddingTop: 68 }}>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(160deg, #060e14, #0d2228, #0f3530)',
        padding: '5rem 0 4rem', textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(0,229,199,0.1)', border: '1px solid rgba(0,229,199,0.3)',
            borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem',
            marginBottom: '1.5rem',
          }}>
            <span style={{ color: 'var(--color-ai-teal)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em' }}>
              🤖 FARMAI ENGINE v2.0
            </span>
          </div>
          <h1 style={{ color: 'white', marginBottom: '1.25rem' }}>
            AI That Helps You Decide<br />
            <span style={{ color: 'var(--color-ai-teal)' }}>Where, When & Whom</span> to Sell
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 580, margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.8 }}>
            Four intelligent modules work together — giving farmers actionable
            insights that were previously available only to large trading corporations.
          </p>
        </div>
      </section>

      {/* ── AI Feature Cards ──────────────────────────────────────────── */}
      <section className="section" style={{ background: '#0d1a0d' }}>
        <div className="container">
          <div className="grid grid-2 ai-features-grid" style={{ gap: '1.75rem' }}>
            {features.map((f, i) => (
              <div key={i} id={f.id} className="ai-feature-card" style={{
                opacity: 0,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${f.accent}30`,
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                cursor: 'default',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                position: 'relative', overflow: 'hidden',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${f.accent}80`;
                  e.currentTarget.style.boxShadow = `0 0 40px ${f.accent}20`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${f.accent}30`;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Top accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${f.accent}, transparent)`,
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 'var(--radius-md)',
                    background: `${f.accent}18`, border: `1px solid ${f.accent}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', flexShrink: 0,
                    transition: 'transform 0.3s ease',
                  }}>
                    {f.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                      <h3 style={{ color: 'white', fontSize: '1.15rem' }}>{f.title}</h3>
                      {f.ai && (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, background: `${f.accent}20`,
                          color: f.accent, border: `1px solid ${f.accent}40`,
                          borderRadius: 20, padding: '2px 8px', letterSpacing: '0.08em',
                        }}>AI</span>
                      )}
                    </div>
                    <p style={{ color: f.accent, fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                      {f.subtitle}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.75 }}>
                      {f.desc}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'flex', gap: '1.5rem', marginTop: '1.5rem',
                  paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.07)',
                }}>
                  {f.stats.map((s, j) => (
                    <div key={j}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: f.accent, fontFamily: 'var(--font-heading)' }}>
                        {s.val}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ──────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div className="section-header text-center">
            <span className="section-label">Before vs After</span>
            <h2>Traditional Market vs Agri Direct</h2>
          </div>

          <div className="comparison-table" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['Aspect', '❌ Traditional Market', '✅ Agri Direct'].map((h, i) => (
                    <th key={i} style={{
                      padding: '1rem 1.25rem',
                      background: i === 2 ? 'var(--color-forest)' : i === 1 ? '#fef2f2' : 'var(--color-cream-alt)',
                      color: i === 2 ? 'white' : i === 1 ? '#B91C1C' : 'var(--color-charcoal)',
                      fontFamily: 'var(--font-heading)', fontWeight: 700,
                      fontSize: '0.9rem', textAlign: i === 0 ? 'left' : 'center',
                      borderBottom: '2px solid rgba(0,0,0,0.08)',
                      borderRadius: i === 1 ? '12px 0 0 0' : i === 2 ? '0 12px 0 0' : '12px 0 0 12px',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={i} className="comparison-row" style={{ opacity: 0 }}>
                    <td style={{
                      padding: '0.85rem 1.25rem',
                      background: i % 2 === 0 ? 'white' : 'var(--color-cream)',
                      fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-charcoal)',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                    }}>{row.aspect}</td>
                    <td style={{
                      padding: '0.85rem 1.25rem', textAlign: 'center',
                      background: i % 2 === 0 ? '#fff5f5' : '#fff0f0',
                      fontSize: '0.875rem', color: '#B91C1C',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                    }}>{row.old}</td>
                    <td style={{
                      padding: '0.85rem 1.25rem', textAlign: 'center',
                      background: i % 2 === 0 ? 'rgba(27,94,32,0.06)' : 'rgba(27,94,32,0.03)',
                      fontSize: '0.875rem', color: 'var(--color-forest)', fontWeight: 600,
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                    }}>{row.new}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/marketplace" className="btn btn-primary btn-lg" id="try-ai-marketplace-btn">
              🌾 Try the AI Marketplace
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
