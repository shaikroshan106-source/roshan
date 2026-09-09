import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import heroTractorImg from '../assets/hero-tractor.jpg';

const stats = [
  { value: '₹2.4Cr+', label: 'Trade Volume' },
  { value: '1,240+', label: 'Farmers' },
  { value: '380+', label: 'Verified Buyers' },
  { value: '94%', label: 'AI Accuracy' },
];

const howItWorks = [
  { step: '01', icon: '📦', title: 'List Your Crop', desc: 'Upload crop details, quality grade, and expected price. Our AI validates the listing.' },
  { step: '02', icon: '🤖', title: 'AI Analysis', desc: 'FarmAI predicts optimal price, matches verified buyers, and forecasts the best selling window.' },
  { step: '03', icon: '🤝', title: 'Connect & Bid', desc: 'Verified buyers place competitive bids. You see all offers transparently — no middlemen.' },
  { step: '04', icon: '🚛', title: 'Logistics & Pay', desc: 'AI-optimized transport is arranged. Payment is direct — 100% to your account, instantly.' },
];

export default function Home() {
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Parallax
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll);

    // GSAP hero animation (runs after GSAP loads)
    if (typeof window !== 'undefined') {
      import('gsap').then(({ gsap }) => {
        import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
          gsap.registerPlugin(ScrollTrigger);
          const tl = gsap.timeline();
          tl.fromTo('.hero-bg-img', { scale: 1.1 }, { scale: 1, duration: 2.5, ease: 'power2.out' })
            .fromTo('.hero-badge', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=1.8')
            .fromTo('.hero-title', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=1.4')
            .fromTo('.hero-subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
            .fromTo('.hero-cta', { opacity: 0, y: 20, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.15, ease: 'back.out(1.5)' }, '-=0.3')
            .fromTo('.hero-farmer-img', { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 1, ease: 'power3.out' }, '-=1.2');
        });
      });
    }
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: '#0B231A',
      }}>
        {/* Background image with Ken Burns */}
        <div className="hero-bg-img" style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('${heroTractorImg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          opacity: 0.95,
          transform: `translateY(${scrollY * 0.25}px)`,
        }} />
        {/* Subtle left-side dark gradient overlay for crystal clear text readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0.05) 100%)',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 100 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3rem', alignItems: 'center' }}>
            {/* Left: Text */}
            <div>
              <h1 className="hero-title" style={{
                opacity: 0,
                color: '#FFFFFF',
                fontSize: 'clamp(2.8rem, 6vw, 4.6rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: '1.25rem',
                textShadow: '0 2px 14px rgba(0,0,0,0.5)',
                letterSpacing: '-0.02em',
              }}>
                Farmer to People
              </h1>

              <p className="hero-subtitle" style={{
                opacity: 0,
                color: 'rgba(255,255,255,0.92)',
                fontSize: '1.12rem',
                lineHeight: 1.75,
                maxWidth: 540,
                marginBottom: '2.25rem',
                textShadow: '0 1px 6px rgba(0,0,0,0.45)',
              }}>
                To make your document look professionally produced, Word provides header, footer, cover
                page, and text box designs that complement each other. For example, you can add a matching
                cover page, header, and sidebar.
              </p>

              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link
                  to="/problem"
                  id="hero-about-btn"
                  className="hero-cta btn"
                  style={{
                    opacity: 0,
                    background: '#FFFFFF',
                    color: '#C0392B',
                    fontWeight: 700,
                    padding: '0.75rem 2rem',
                    borderRadius: 8,
                    fontSize: '1rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  }}
                >
                  About Us!
                </Link>
                <Link to="/marketplace" id="hero-sell-btn" className="hero-cta btn btn-primary" style={{ opacity: 0, borderRadius: 8, padding: '0.75rem 1.6rem' }}>
                  🌾 Sell Your Crop
                </Link>
                <Link to="/marketplace" id="hero-explore-btn" className="hero-cta btn btn-ghost" style={{ opacity: 0, borderRadius: 8, padding: '0.75rem 1.6rem' }}>
                  🛒 Explore Marketplace
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="hero-cta" style={{ opacity: 0, display: 'flex', gap: '1.5rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                {['✓ No middlemen', '✓ Real-time prices', '✓ Instant payment'].map(text => (
                  <span key={text} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Stats + Visual */}
            <div className="hero-farmer-img" style={{ opacity: 0 }}>
              {/* Main visual card */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* AI Glow header */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: 'linear-gradient(90deg, var(--color-ai-teal), var(--color-ai-violet))',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: 4 }}>FarmAI Insight</p>
                    <h4 style={{ color: 'white', fontSize: '1rem' }}>Live Market Intelligence</h4>
                  </div>
                  <span className="badge badge-ai" style={{ animation: 'pulse-ai 2.5s ease-in-out infinite' }}>🤖 AI LIVE</span>
                </div>

                {/* Price rows */}
                {[
                  { crop: '🍅 Tomato', price: '₹30.5/kg', trend: '↑ +8%', color: '#ef5350', recommend: 'WAIT 3 days' },
                  { crop: '🌶️ Chilli', price: '₹63/kg',   trend: '↑ +5%', color: '#ff7043', recommend: 'SELL NOW' },
                  { crop: '🌾 Rice',   price: '₹34.2/kg', trend: '→ 0%',  color: '#ffa726', recommend: 'STABLE' },
                  { crop: '🧶 Cotton', price: '₹72/kg',   trend: '↑ +3%', color: '#78909c', recommend: 'WAIT' },
                ].map(({ crop, price, trend, color, recommend }) => (
                  <div key={crop} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.04)', marginBottom: '0.5rem',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>{crop}</span>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{price}</span>
                    <span style={{ color, fontSize: '0.8rem', fontWeight: 600 }}>{trend}</span>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, color: recommend === 'SELL NOW' ? '#4CAF50' : 'var(--color-ai-teal)',
                      background: recommend === 'SELL NOW' ? 'rgba(76,175,80,0.15)' : 'rgba(0,229,199,0.1)',
                      padding: '2px 8px', borderRadius: 20,
                    }}>{recommend}</span>
                  </div>
                ))}

                <div style={{
                  marginTop: '1.25rem', padding: '0.75rem',
                  background: 'rgba(0,229,199,0.08)',
                  border: '1px solid rgba(0,229,199,0.2)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <p style={{ color: 'var(--color-ai-teal)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                    🤖 AI Recommendation
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    Best time to sell Chilli: <strong style={{ color: 'white' }}>Today</strong> — festival demand
                    is driving prices up in Hyderabad & Guntur.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginTop: '4rem',
            paddingTop: '3rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            {stats.map((s, i) => (
              <div key={i} className="hero-cta" style={{ opacity: 0, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)' }}>
                  {s.value}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          animation: 'float 2.5s ease-in-out infinite',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '0.15em' }}>SCROLL</span>
          <div style={{
            width: 20, height: 32, border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 10, position: 'relative',
          }}>
            <div style={{
              width: 4, height: 8, background: 'var(--color-ai-teal)',
              borderRadius: 2, position: 'absolute', top: 5, left: '50%',
              transform: 'translateX(-50%)',
              animation: 'float 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div className="section-header text-center">
            <span className="section-label">How It Works</span>
            <h2>4 Simple Steps to Fair Trade</h2>
            <p>From listing your crop, arranging AI logistics, to 24/7 support — Agri Direct handles everything.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '1.25rem',
            position: 'relative'
          }}>
            {howItWorks.map((step, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '1.5rem 1rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-forest), var(--color-leaf))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem', fontSize: '1.4rem',
                  boxShadow: '0 4px 20px rgba(76,175,80,0.3)',
                }}>
                  {step.icon}
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
                  color: 'var(--color-leaf)', textTransform: 'uppercase',
                }}>STEP {step.step}</span>
                <h4 style={{ margin: '0.5rem 0 0.75rem', fontSize: '1rem' }}>{step.title}</h4>
                <p style={{ fontSize: '0.84rem', color: '#4B5563' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--color-forest), #2E7D32)',
        padding: 'var(--space-16) 0',
      }}>
        <div className="container text-center">
          <h2 style={{ color: 'white', marginBottom: '1rem' }}>Ready to Get a Fair Price for Your Crop?</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2.5rem', maxWidth: 540, margin: '0 auto 2.5rem' }}>
            Join 1,240+ farmers across Andhra Pradesh who are already earning more with Agri Direct.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/marketplace" id="cta-marketplace-btn" className="btn btn-gold btn-lg">🌾 Start Selling</Link>
            <Link to="/problem" id="cta-learn-btn" className="btn btn-ghost btn-lg">Learn More</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
