import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { mockListings, matchBuyers, predictPrice, optimizeProfit, forecastDemand } from '../data/mockAI';
import dashboardHeroImg from '../assets/dashboard-hero.jpg';

// ─── Price Chart Component ────────────────────────────────────────────────────
function PriceChart({ crop }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const data = predictPrice(crop, 'Vizag');
    import('chart.js/auto').then(({ default: Chart }) => {
      if (chartInstance.current) chartInstance.current.destroy();
      const ctx = chartRef.current?.getContext('2d');
      if (!ctx) return;
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.weeklyForecast.map(d => d.day),
          datasets: [{
            label: `${crop} Price (₹/kg)`,
            data: data.weeklyForecast.map(d => d.price),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76,175,80,0.08)',
            pointBackgroundColor: '#4CAF50',
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.4, fill: true,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: ctx => `₹${ctx.parsed.y}/kg` },
            },
          },
          scales: {
            y: {
              grid: { color: 'rgba(0,0,0,0.04)' },
              ticks: { callback: v => `₹${v}` },
            },
            x: { grid: { display: false } },
          },
          animation: { duration: 1200, easing: 'easeInOutQuart' },
        },
      });
    });
    return () => chartInstance.current?.destroy();
  }, [crop]);

  return <canvas ref={chartRef} />;
}

// ─── Demand Chart Component ───────────────────────────────────────────────────
function DemandChart({ crop }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const data = forecastDemand(crop, 'Guntur');
    import('chart.js/auto').then(({ default: Chart }) => {
      if (chartInstance.current) chartInstance.current.destroy();
      const ctx = chartRef.current?.getContext('2d');
      if (!ctx) return;
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Demand (Qtl)',
              data: data.demand,
              backgroundColor: 'rgba(76,175,80,0.7)',
              borderRadius: 6,
            },
            {
              label: 'Supply (Qtl)',
              data: data.supply,
              backgroundColor: 'rgba(245,166,35,0.6)',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { font: { family: 'Inter', size: 11 } } },
          },
          scales: {
            y: { grid: { color: 'rgba(0,0,0,0.04)' } },
            x: { grid: { display: false } },
          },
          animation: { duration: 1000 },
        },
      });
    });
    return () => chartInstance.current?.destroy();
  }, [crop]);

  return <canvas ref={chartRef} />;
}

// ─── Farmer Dashboard ─────────────────────────────────────────────────────────
function FarmerDashboard({ user }) {
  const selectedLot = mockListings[0];
  const price = predictPrice(selectedLot.crop, selectedLot.location);
  const buyers = matchBuyers(selectedLot);
  const profit = optimizeProfit(selectedLot, buyers);

  const farmerStats = [
    { label: "Today's Market Price", value: `₹${price.predictedPrice}/kg`, icon: '💰', change: `${price.trend === 'rising' ? '+' : ''}${price.trend}`, up: price.trend === 'rising' },
    { label: 'My Active Lots', value: '3', icon: '📦', change: '2 new bids today', up: true },
    { label: 'Available Buyers', value: `${buyers.length}`, icon: '🤝', change: 'Verified &amp; nearby', up: true },
    { label: 'Estimated Earnings', value: `₹${(profit.optimizedRevenue / 100).toFixed(0)}K`, icon: '📊', change: `+₹${profit.estimatedGain.toFixed(0)} vs listed`, up: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Stats */}
      <div className="grid grid-4">
        {farmerStats.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
              <span className={`badge ${s.up ? 'badge-green' : 'badge-red'}`}>
                {s.up ? '↑' : '↓'}
              </span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-change up" dangerouslySetInnerHTML={{ __html: s.change }} />
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        {/* AI Recommendation Panel */}
        <div className="ai-panel animate-pulse-ai" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,229,199,0.15)', border: '1px solid rgba(0,229,199,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
            }}>🤖</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>FarmAI Recommendation</div>
              <div style={{ fontWeight: 700, color: 'var(--color-charcoal)', marginTop: 2 }}>Lot: {selectedLot.crop} · {selectedLot.quantity}kg · {selectedLot.location}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className="badge badge-ai" style={{ fontSize: '0.7rem' }}>LIVE · {price.confidence}% confidence</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(0,229,199,0.06)', border: '1px solid rgba(0,229,199,0.15)',
            borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '1.8rem' }}>{price.trend === 'rising' ? '⏰' : '💰'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: 'var(--color-ai-teal)', fontSize: '1rem', marginBottom: 4 }}>
                {price.trend === 'rising' ? 'WAIT & SELL' : 'SELL NOW'}
              </div>
              <div style={{ color: 'var(--color-charcoal)', fontSize: '0.9rem' }}>{price.recommendation}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, color: 'var(--color-forest)', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
                ₹{price.predictedPrice}/kg
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>AI predicted price</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Current Price', val: `₹${selectedLot.pricePerKg}/kg` },
              { label: 'AI Optimal Price', val: `₹${profit.optimizedRevenue / selectedLot.quantity}/kg` },
              { label: 'Potential Gain', val: `+₹${profit.estimatedGain.toFixed(0)}` },
              { label: 'Top Buyer', val: buyers[0]?.name },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontWeight: 700, color: 'var(--color-charcoal)', fontSize: '0.9rem' }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h4>{selectedLot.crop} Price Trend</h4>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>7-day AI forecast</p>
            </div>
            <span className="badge badge-green">↑ {price.trend}</span>
          </div>
          <PriceChart crop={selectedLot.crop} />
        </div>

        {/* Demand Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h4>Market Demand Forecast</h4>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>12-month demand vs supply</p>
            </div>
            <span className="badge badge-ai">AI Forecast</span>
          </div>
          <DemandChart crop={selectedLot.crop} />
        </div>
      </div>
    </div>
  );
}

// ─── Buyer Dashboard ──────────────────────────────────────────────────────────
function BuyerDashboard({ user }) {
  const topLot = mockListings[2]; // Chilli lot
  const buyers = matchBuyers(topLot);
  const myMatch = buyers[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Stats */}
      <div className="grid grid-4">
        {[
          { label: 'Available Lots', value: `${mockListings.length}`, icon: '📦', up: true },
          { label: 'My Active Bids', value: '4', icon: '🏷️', up: true },
          { label: 'Purchases This Month', value: '₹3.2L', icon: '💸', up: false },
          { label: 'Active Suppliers', value: '18', icon: '🤝', up: true },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
              <span className={`badge ${s.up ? 'badge-ai' : 'badge-gold'}`}>{s.up ? '↑' : '→'}</span>
            </div>
            <div className="stat-value" style={{ color: 'var(--color-forest)' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Featured Lot Card */}
      <div className="card" style={{ padding: '2rem', background: '#052E2B', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🌟</span>
              <div>
                <h4 style={{ color: 'white', margin: 0 }}>Featured Produce Lot</h4>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Recommended for your purchasing profile</p>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'white' }}>{topLot.crop} · {topLot.quantity} kg · Grade {topLot.grade}</h3>
              <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.75)' }}>by {topLot.farmer} · {topLot.location}</p>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#A7F3D0', fontFamily: 'var(--font-heading)', marginTop: '0.5rem' }}>
                ₹{topLot.pricePerKg}/kg
              </div>
            </div>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0, paddingLeft: '1.2rem' }}>
              {myMatch.reasons.map((r, i) => (
                <li key={i} style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.85)',
                }}>
                  {r.replace(/^✓\s*/, '')}
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button id="make-offer-btn" className="btn btn-gold">🤝 Make Offer</button>
              <button id="view-lot-buyer-btn" className="btn btn-ghost btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>View Details</button>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            padding: '1.5rem',
            textAlign: 'center',
            minWidth: 180,
          }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>🌶️</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Grade {topLot.grade} Verified</div>
            <div style={{ fontSize: '0.8rem', color: '#A7F3D0', marginTop: '0.25rem' }}>{topLot.quality} Quality</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>📍 {topLot.location} Farm Depot</div>
          </div>
        </div>
      </div>

      {/* Available Lots List */}
      <div className="card">
        <h4 style={{ marginBottom: '1.25rem' }}>Available Lots for Purchase</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {mockListings.map((lot, i) => (
            <div key={lot.id} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-cream)', border: '1px solid rgba(27,94,32,0.07)',
              transition: 'all 0.2s ease',
            }}>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', width: 32 }}>
                {['🍅','🌾','🌶️','🧶'][i % 4]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{lot.crop}</span>
                  <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Grade {lot.grade}</span>
                  {lot.aiConfidence >= 90 && <span className="badge badge-ai" style={{ fontSize: '0.65rem' }}>🤖 {lot.aiConfidence}%</span>}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>{lot.quantity} kg · {lot.location} · by {lot.farmer}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: 'var(--color-forest)', fontSize: '1rem' }}>₹{lot.pricePerKg}/kg</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>₹{(lot.pricePerKg * lot.quantity).toLocaleString()} total</div>
              </div>
              <button id={`offer-${lot.id}`} className="btn btn-primary btn-sm">Make Offer</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ user }) {
  return (
    <div className="grid grid-2">
      <div className="card">
        <h4>Platform Overview</h4>
        <div className="grid grid-2" style={{ gap: '1rem', marginTop: '1rem' }}>
          {[
            { l: 'Total Farmers', v: '1,240' },
            { l: 'Total Buyers', v: '380' },
            { l: 'Active Lots', v: '47' },
            { l: 'Trade Volume', v: '₹2.4Cr' },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ padding: '1rem' }}>
              <div className="stat-value" style={{ fontSize: '1.4rem' }}>{s.v}</div>
              <div className="stat-label">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card--ai card">
        <h4 style={{ color: 'white' }}>AI Engine Status</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          {['Price Prediction', 'Buyer Matching', 'Route Optimization', 'Demand Forecast'].map(name => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem' }}>{name}</span>
              <span className="badge badge-ai" style={{ fontSize: '0.7rem' }}>✓ Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export default function Dashboard() {
  const { role, user } = useAuth();
  const navigate = useNavigate();

  return (
    <main style={{ paddingTop: 68, minHeight: '100vh', background: 'var(--color-cream)' }}>
      {/* Header */}
      <section style={{
        position: 'relative',
        backgroundImage: `linear-gradient(to bottom, rgba(5, 46, 43, 0.78), rgba(5, 46, 43, 0.92)), url('${dashboardHeroImg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '3rem 0',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-label" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {role === 'farmer' ? '👨‍🌾 Farmer Dashboard' : role === 'buyer' ? '🏪 Buyer Dashboard' : '⚙️ Admin Dashboard'}
              </span>
              <h2 style={{ color: 'white', marginBottom: '0.25rem' }}>
                Welcome back, {user.name}!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                {user.location} · {user.phone}
                {user.verified && <span className="badge badge-green" style={{ marginLeft: '0.75rem', fontSize: '0.72rem' }}>✓ Verified</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {role === 'farmer' && (
                <button
                  id="dashboard-new-lot-btn"
                  className="btn btn-gold"
                  onClick={() => navigate('/marketplace?publish=true')}
                >
                  🌾 + Publish New Lot
                </button>
              )}
              {role === 'buyer' && (
                <button
                  id="dashboard-browse-btn"
                  className="btn btn-primary"
                  onClick={() => navigate('/marketplace')}
                >
                  🛒 Browse Lots
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '2rem' }}>
        <div className="container">
          {role === 'farmer' && <FarmerDashboard user={user} />}
          {role === 'buyer'  && <BuyerDashboard  user={user} />}
          {role === 'admin'  && <AdminDashboard   user={user} />}
        </div>
      </section>
    </main>
  );
}
