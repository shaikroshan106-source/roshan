import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import aboutHeroImg from '../assets/about-hero.jpg';

const chainNodes = [
  { actor: 'Farmer', price: '₹20', emoji: '👨‍🌾', color: '#4CAF50', desc: 'Grows the crop with hard work' },
  { actor: 'Local Trader', price: '₹24', emoji: '🏪', color: '#F5A623', desc: 'Buys from farmer at depot' },
  { actor: 'Wholesaler', price: '₹29', emoji: '🏭', color: '#FF7043', desc: 'Bundles and stores produce' },
  { actor: 'Distributor', price: '₹34', emoji: '🚛', color: '#E53935', desc: 'Transports to city markets' },
  { actor: 'Retailer', price: '₹40', emoji: '🛒', color: '#C62828', desc: 'Sells to end consumer' },
  { actor: 'Consumer', price: '₹40', emoji: '👤', color: '#6A1B9A', desc: 'Pays premium price' },
];

const problems = [
  { icon: '🕶️', title: 'Price Opacity', desc: 'Farmers have no access to real market prices. Local traders exploit the information gap.' },
  { icon: '⛓️', title: 'Too Many Middlemen', desc: 'Every middleman takes a 20-25% margin. The farmer gets only 40-50% of what the consumer pays.' },
  { icon: '📉', title: 'No Demand Signals', desc: 'Farmers grow crops without knowing what markets need, leading to gluts and price crashes.' },
  { icon: '💸', title: 'Delayed Payments', desc: 'Payments through middlemen can take weeks. Farmers struggle with cash flow for next season.' },
];

export default function Problem() {
  const chainRef = useRef(null);

  useEffect(() => {
    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        // Chain nodes animate in one by one on scroll
        gsap.fromTo('.chain-node', {
          opacity: 0, y: 40, scale: 0.9,
        }, {
          opacity: 1, y: 0, scale: 1,
          duration: 0.6, stagger: 0.2, ease: 'back.out(1.3)',
          scrollTrigger: {
            trigger: '.supply-chain',
            start: 'top 70%',
          },
        });

        // Price count-up on scroll
        gsap.fromTo('.chain-price', { innerText: '₹0' }, {
          scrollTrigger: { trigger: '.supply-chain', start: 'top 70%' },
          duration: 1.5, ease: 'power2.out',
          onStart() {
            document.querySelectorAll('.chain-price').forEach((el, i) => {
              const target = chainNodes[i].price.replace('₹', '');
              let start = 0;
              const end = +target;
              const step = (end / 60);
              const timer = setInterval(() => {
                start = Math.min(start + step, end);
                el.textContent = `₹${Math.round(start)}`;
                if (start >= end) clearInterval(timer);
              }, 25);
            });
          },
        });

        // Farmer gain stat
        gsap.fromTo('.farmer-gain-pct', { textContent: '0' }, {
          textContent: '98',
          duration: 2, ease: 'power2.out',
          snap: { textContent: 1 },
          scrollTrigger: { trigger: '.farmer-gain', start: 'top 75%' },
          onUpdate() {
            const el = document.querySelector('.farmer-gain-pct');
            if (el) el.textContent = Math.round(+el.textContent) + '%';
          },
        });

        // Problem cards
        gsap.fromTo('.problem-card', { opacity: 0, y: 50 }, {
          opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: '.problems-grid', start: 'top 75%' },
        });
      });
    });
  }, []);

  return (
    <main style={{ paddingTop: 68 }}>
      {/* ── PAGE HERO ──────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        backgroundImage: `linear-gradient(to bottom, rgba(5, 46, 43, 0.78), rgba(5, 46, 43, 0.9)), url('${aboutHeroImg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '5.5rem 0 4.5rem',
        textAlign: 'center',
      }}>
        <div className="container">
          <span className="section-label" style={{ color: 'var(--color-gold)' }}>The Problem We Solve</span>
          <h1 style={{ color: 'white', marginBottom: '1.25rem' }}>
            Why Are Farmers Earning Less?
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 580, margin: '0 auto', fontSize: '1.1rem' }}>
            The average Indian farmer earns only <strong style={{ color: 'var(--color-gold)' }}>₹20</strong> for
            produce the consumer buys at <strong style={{ color: '#EF5350' }}>₹40</strong>.
            That's a 100% markup absorbed by unnecessary middlemen.
          </p>
        </div>
      </section>

      {/* ── SUPPLY CHAIN VISUALIZATION ───────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header text-center">
            <h2>The Broken Supply Chain</h2>
            <p>Each step adds cost with zero value to the farmer.</p>
          </div>

          <div className="supply-chain" style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              gap: 0, minWidth: 700, padding: '1rem 0',
            }}>
              {chainNodes.map((node, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="chain-node" style={{ opacity: 0, textAlign: 'center', width: 130 }}>
                    {/* Price tag at top */}
                    <div style={{
                      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                      color: i === 0 ? 'var(--color-success)' : i === chainNodes.length - 1 ? '#6A1B9A' : 'var(--color-warning)',
                      marginBottom: 8, textTransform: 'uppercase',
                    }}>
                      {i === 0 ? 'FARMER EARNS' : i === chainNodes.length - 2 ? 'RETAIL PRICE' : `SOLD AT`}
                    </div>
                    <div className="chain-price" style={{
                      fontSize: '1.6rem', fontWeight: 900,
                      color: node.color,
                      fontFamily: 'var(--font-heading)',
                      marginBottom: 12,
                      textShadow: i === 0 ? 'none' : `0 0 20px ${node.color}40`,
                    }}>
                      {node.price}
                    </div>

                    {/* Circle */}
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: `${node.color}15`,
                      border: `2px solid ${node.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto', fontSize: '1.6rem',
                      boxShadow: `0 4px 16px ${node.color}30`,
                    }}>
                      {node.emoji}
                    </div>

                    <div style={{ fontWeight: 700, marginTop: 10, fontSize: '0.9rem', color: 'var(--color-charcoal)' }}>
                      {node.actor}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                      {node.desc}
                    </div>
                  </div>

                  {/* Arrow between nodes */}
                  {i < chainNodes.length - 1 && (
                    <div className="chain-node" style={{ opacity: 0, padding: '0 4px', marginTop: '-40px' }}>
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#E53935' }}>
                          +{chainNodes[i + 1].price.replace('₹', '') - node.price.replace('₹', '')}
                        </span>
                        <span style={{ fontSize: '1.4rem', color: '#EF5350' }}>→</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Farmer loss callout */}
          <div className="farmer-gain" style={{
            marginTop: '2.5rem',
            background: 'linear-gradient(135deg, #1B0000, #3d0000)',
            border: '1px solid rgba(239,83,80,0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            display: 'flex', gap: '3rem', justifyContent: 'center', flexWrap: 'wrap',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#EF5350', fontFamily: 'var(--font-heading)' }}>
                <span className="farmer-gain-pct">0%</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>markup absorbed by middlemen</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#4CAF50', fontFamily: 'var(--font-heading)' }}>
                ₹20
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>farmer gets (consumer pays ₹40)</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-gold)', fontFamily: 'var(--font-heading)' }}>
                4+
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>unnecessary middlemen in the chain</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM CARDS ──────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-cream-alt)' }}>
        <div className="container">
          <div className="section-header text-center">
            <span className="section-label">Root Causes</span>
            <h2>4 Core Problems Agri Direct Solves</h2>
          </div>
          <div className="grid grid-4 problems-grid">
            {problems.map((p, i) => (
              <div key={i} className="problem-card card" style={{ opacity: 0, textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{p.icon}</div>
                <h4 style={{ color: 'var(--color-forest)', marginBottom: '0.75rem' }}>{p.title}</h4>
                <p style={{ fontSize: '0.88rem' }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-forest)', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ color: 'white', marginBottom: '1rem' }}>Agri Direct is the Solution</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', maxWidth: 480, margin: '0 auto 2rem' }}>
            Direct farmer-to-buyer trade with AI-powered pricing and zero unnecessary middlemen.
          </p>
          <Link to="/marketplace" className="btn btn-gold btn-lg" id="explore-marketplace-btn">
            🌾 Explore Marketplace →
          </Link>
        </div>
      </section>
    </main>
  );
}
