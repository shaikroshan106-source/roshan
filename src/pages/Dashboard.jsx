import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { getStoredListings, updateProduceListing, removeCustomListing } from '../utils/marketplaceStore';
import { getAllBids, acceptBidForLot, rejectBidForLot, editBidOnLot, cancelBidOnLot } from '../utils/biddingStore';
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
  const [farmerData, setFarmerData] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || 'Vizag',
    totalAcreage: '5.0',
    cropsCultivated: 'Tomato, Chilli, Cotton',
    nearestMandi: 'Vizag Central Rythu Mandi',
  });

  const [myLots, setMyLots] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [editLotModalOpen, setEditLotModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [editLotQuantity, setEditLotQuantity] = useState('');
  const [editLotPrice, setEditLotPrice] = useState('');
  const [editLotLocation, setEditLotLocation] = useState('');
  const [editLotGrade, setEditLotGrade] = useState('A');

  const [toastMsg, setToastMsg] = useState('');

  // Initial load and sync
  useEffect(() => {
    loadDashboardData();

    const handleUpdate = () => loadDashboardData();
    window.addEventListener('farmflow_listings_updated', handleUpdate);
    window.addEventListener('farmflow_bids_updated', handleUpdate);
    return () => {
      window.removeEventListener('farmflow_listings_updated', handleUpdate);
      window.removeEventListener('farmflow_bids_updated', handleUpdate);
    };
  }, []);

  async function loadDashboardData() {
    try {
      // 1. Farmer Profile
      const profRes = await api.get('/farmers/me');
      if (profRes.ok && profRes.data?.data) {
        const d = profRes.data.data;
        setFarmerData(d);
        setProfileForm({
          name: d.user?.name || user?.name || '',
          phone: d.user?.phone || user?.phone || '',
          location: d.user?.location || user?.location || 'Vizag',
          totalAcreage: String(d.totalAcreage || '5.0'),
          cropsCultivated: Array.isArray(d.cropsCultivated) ? d.cropsCultivated.join(', ') : 'Tomato, Chilli',
          nearestMandi: d.nearestMandi || `${user?.location || 'Vizag'} Rythu Mandi`,
        });
      }

      // 2. Farmer Lots
      const allLots = getStoredListings();
      const ownedLots = allLots.filter(l =>
        (l.farmerId && user?.uid && l.farmerId === user.uid) ||
        (l.farmer && user?.name && l.farmer.toLowerCase().includes(user.name.toLowerCase())) ||
        Boolean(l.isNewlyPublished)
      );
      setMyLots(ownedLots.length > 0 ? ownedLots : allLots.slice(0, 3));

      // 3. Farmer Bids Received
      const allBids = getAllBids();
      const myLotIds = (ownedLots.length > 0 ? ownedLots : allLots.slice(0, 3)).map(l => l.id);
      const incomingBids = allBids.filter(b => myLotIds.includes(b.lotId) || myLotIds.includes(b.productId));
      setMyBids(incomingBids);

      // 4. Orders
      const ordRes = await api.get('/orders');
      if (ordRes.ok && Array.isArray(ordRes.data?.data)) {
        setMyOrders(ordRes.data.data);
      }

      // 5. Notifications
      const notifRes = await api.get('/notifications');
      if (notifRes.ok && Array.isArray(notifRes.data?.data)) {
        setNotifications(notifRes.data.data.slice(0, 5));
      }
    } catch (e) {
      console.warn('Farmer dashboard data load note:', e);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.patch('/farmers/me', {
        name: profileForm.name,
        phone: profileForm.phone,
        location: profileForm.location,
        totalAcreage: Number(profileForm.totalAcreage) || 5.0,
        cropsCultivated: profileForm.cropsCultivated.split(',').map(c => c.trim()).filter(Boolean),
        nearestMandi: profileForm.nearestMandi,
      });

      if (res.ok && res.data?.success) {
        setToastMsg('✓ Farm profile updated in Cloud Firestore!');
        setProfileModalOpen(false);
        loadDashboardData();
        setTimeout(() => setToastMsg(''), 4000);
      } else {
        alert(res.data?.message || 'Could not update profile');
      }
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    }
  }

  function handleOpenEditLot(lot) {
    setEditingLot(lot);
    setEditLotQuantity(String(lot.quantity || ''));
    setEditLotPrice(String(lot.pricePerKg || lot.basePrice || ''));
    setEditLotLocation(lot.location || profileForm.location || 'Vizag');
    setEditLotGrade(lot.grade || 'A');
    setEditLotModalOpen(true);
  }

  function handleSaveLotEdit(e) {
    e.preventDefault();
    if (!editingLot) return;
    const numQ = Number(editLotQuantity);
    const numP = Number(editLotPrice);
    if (!numQ || numQ <= 0 || !numP || numP <= 0) {
      alert('Please enter valid positive numbers for quantity and price.');
      return;
    }

    updateProduceListing(editingLot.id, {
      quantity: numQ,
      pricePerKg: numP,
      basePrice: numP,
      expectedPrice: numP,
      location: editLotLocation.trim(),
      grade: editLotGrade,
    });

    setEditLotModalOpen(false);
    setToastMsg(`✓ Produce lot ${editingLot.crop} updated!`);
    loadDashboardData();
    setTimeout(() => setToastMsg(''), 4000);
  }

  function handleDeleteLot(lot) {
    if (window.confirm(`Delete ${lot.crop} lot (${lot.quantity}kg)? This action is permanent.`)) {
      removeCustomListing(lot.id);
      setToastMsg(`Produce lot ${lot.crop} was removed.`);
      loadDashboardData();
      setTimeout(() => setToastMsg(''), 4000);
    }
  }

  function handleAcceptBid(bid) {
    const res = acceptBidForLot(bid.lotId || bid.productId, bid.id);
    if (res.success) {
      setToastMsg(res.message);
      loadDashboardData();
      setTimeout(() => setToastMsg(''), 5000);
    } else {
      alert(res.message || 'Could not accept bid');
    }
  }

  function handleDeclineBid(bid) {
    if (window.confirm(`Decline offer of ₹${bid.amount}/kg from ${bid.buyer || bid.buyerName}?`)) {
      const res = rejectBidForLot(bid.lotId || bid.productId, bid.id);
      if (res.success) {
        setToastMsg(res.message);
        loadDashboardData();
        setTimeout(() => setToastMsg(''), 4000);
      }
    }
  }

  const selectedLot = myLots[0] || mockListings[0];
  const price = predictPrice(selectedLot?.crop || 'Tomato', selectedLot?.location || 'Vizag');
  const buyers = matchBuyers(selectedLot || mockListings[0]);
  const profit = optimizeProfit(selectedLot || mockListings[0], buyers);

  const farmerStats = [
    { label: "Today's Mandi Price", value: `₹${price.predictedPrice}/kg`, icon: '💰', change: `${price.trend === 'rising' ? '+' : ''}${price.trend}`, up: price.trend === 'rising' },
    { label: 'My Active Produce Lots', value: `${myLots.length}`, icon: '📦', change: `${myBids.length} active bids received`, up: true },
    { label: 'Bids Received', value: `${myBids.length}`, icon: '🏷️', change: 'Buyer offers pending', up: true },
    { label: 'Sales Contracts', value: `${myOrders.length}`, icon: '🤝', change: 'Confirmed sales deals', up: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Toast message */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1300,
          background: '#052E2B', color: '#FFFFFF',
          padding: '0.85rem 1.4rem', borderRadius: 10,
          fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          border: '1.5px solid #10B981',
        }}>
          {toastMsg}
        </div>
      )}

      {/* ─── FARMER PROFILE BANNER ─────────────────────────────────────────── */}
      <div className="card" style={{
        padding: '1.5rem 1.75rem',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)',
        border: '1.5px solid #BBF7D0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: '#052E2B', color: 'white', fontSize: '1.6rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(5,46,43,0.25)',
          }}>
            👨‍🌾
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ margin: 0, color: '#052E2B', fontSize: '1.3rem' }}>
                {user?.name || 'Farmer Ravi'}
              </h3>
              <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>✓ Verified Farmer</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: 3 }}>
              📍 <strong>{profileForm.location}</strong> · 📱 {profileForm.phone} · 🌾 <strong>{profileForm.totalAcreage} Acres</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#065F46', marginTop: 2 }}>
              🏛️ Mandi: <strong>{profileForm.nearestMandi}</strong> · Crops: <strong>{profileForm.cropsCultivated}</strong>
            </div>
          </div>
        </div>

        <button
          id="edit-farmer-profile-btn"
          type="button"
          onClick={() => setProfileModalOpen(true)}
          style={{
            background: '#052E2B', color: '#FFFFFF',
            border: 'none', borderRadius: 8,
            padding: '0.6rem 1.15rem', fontWeight: 700, fontSize: '0.85rem',
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 4px 12px rgba(5,46,43,0.2)',
          }}
        >
          <span>✏️</span>
          <span>Edit Farm Profile</span>
        </button>
      </div>

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

      {/* ─── MY ACTIVE PRODUCE LOTS SECTION ─────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#052E2B', fontSize: '1.25rem' }}>🌾 My Agricultural Produce Lots</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280' }}>
              Your crops currently listed on the AgriDirect live marketplace with direct edit &amp; delete controls.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/marketplace?publish=true'}
            className="btn btn-primary btn-sm"
            style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}
          >
            + Add New Produce
          </button>
        </div>

        {myLots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#6B7280' }}>
            <p>You have no produce listed currently.</p>
            <button
              onClick={() => window.location.href = '/marketplace?publish=true'}
              className="btn btn-primary"
            >
              Publish Produce Now
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Produce / Variety</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Available Qty</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Expected Price</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Grade</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myLots.map(lot => (
                  <tr key={lot.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0F172A' }}>
                      {lot.crop} <span style={{ fontWeight: 400, color: '#64748B', fontSize: '0.8rem' }}>({lot.variety || 'Fresh'})</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{lot.quantity} {lot.unit || 'kg'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#052E2B' }}>
                      ₹{lot.pricePerKg || lot.basePrice}/kg
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>📍 {lot.location}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>Grade {lot.grade}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${lot.status === 'accepted' ? 'badge-green' : 'badge-ai'}`} style={{ fontSize: '0.72rem' }}>
                        {lot.status === 'accepted' ? 'Deal Closed' : 'Live on Market'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditLot(lot)}
                          style={{
                            padding: '0.35rem 0.65rem', background: '#ECFDF5',
                            border: '1px solid #10B981', borderRadius: 6,
                            color: '#065F46', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLot(lot)}
                          style={{
                            padding: '0.35rem 0.55rem', background: '#FEF2F2',
                            border: '1px solid #F87171', borderRadius: 6,
                            color: '#DC2626', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── BIDS RECEIVED SECTION ─────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#052E2B', fontSize: '1.25rem' }}>🏷️ Buyer Bids &amp; Offers Received</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280' }}>
              Live offers from verified buyers across all your produce lots. Accept the best bid to generate an order.
            </p>
          </div>
          <Link to="/bidding" style={{ fontSize: '0.82rem', color: '#052E2B', fontWeight: 700 }}>
            Full Auction Desk →
          </Link>
        </div>

        {myBids.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
            No buyer bids received yet. Bids placed by buyers will appear here in real-time.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Buyer Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Produce Lot</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Offer / kg</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Offer Value</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myBids.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{b.buyer || b.buyerName || 'Verified Buyer'}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>{b.crop || b.lotDetails?.crop || b.lotId}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#052E2B' }}>₹{b.amount}/kg</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                      ₹{(b.totalOfferValue || (Number(b.amount) * 500)).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${b.status === 'accepted' ? 'badge-green' : b.status === 'rejected' ? 'badge-red' : 'badge-gold'}`} style={{ fontSize: '0.72rem' }}>
                        {b.status === 'accepted' ? '✅ Accepted Deal' : b.status === 'rejected' ? '✕ Declined' : '🟢 Active Offer'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {b.status !== 'accepted' && b.status !== 'rejected' ? (
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => handleAcceptBid(b)}
                            style={{
                              padding: '0.35rem 0.75rem', background: '#10B981', color: 'white',
                              border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                            }}
                          >
                            ✓ Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineBid(b)}
                            style={{
                              padding: '0.35rem 0.65rem', background: '#FEF2F2', color: '#DC2626',
                              border: '1px solid #F87171', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ORDERS & SALES CONTRACTS ──────────────────────────────────────── */}
      {myOrders.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#052E2B', fontSize: '1.25rem', marginBottom: '0.35rem' }}>
            📦 Confirmed Orders &amp; Escrow Contracts
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280', marginBottom: '1.25rem' }}>
            Orders generated automatically from your accepted bids, secured via AgriDirect escrow.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Order ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Produce Crop</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Quantity</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Buyer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Contract Value</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Order Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Escrow Status</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#052E2B' }}>{o.id}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{o.crop}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{o.quantity} {o.unit || 'kg'}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{o.buyerName || 'Verified Buyer'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#052E2B' }}>
                      ₹{(Number(o.totalAmount) || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>{o.orderStatus || 'Confirmed'}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-ai" style={{ fontSize: '0.72rem' }}>{o.escrowStatus || 'Awaiting Deposit'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── LIVE NOTIFICATIONS FEED ────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: '#052E2B' }}>🔔 Recent Notifications &amp; Alerts</h4>
            <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>Updated in real-time</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map(n => (
              <div key={n.id} style={{
                padding: '0.75rem 1rem', borderRadius: 8, background: '#F8FAFC',
                border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{n.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>{n.message}</div>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{new Date(n.createdAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts & AI Panels */}
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
              <div style={{ fontWeight: 700, color: 'var(--color-charcoal)', marginTop: 2 }}>Lot: {selectedLot?.crop || 'Tomato'} · {selectedLot?.quantity || 500}kg · {selectedLot?.location || 'Vizag'}</div>
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
        </div>

        {/* Price Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h4>{selectedLot?.crop || 'Tomato'} Price Trend</h4>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>7-day AI forecast</p>
            </div>
            <span className="badge badge-green">↑ {price.trend}</span>
          </div>
          <PriceChart crop={selectedLot?.crop || 'Tomato'} />
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
          <DemandChart crop={selectedLot?.crop || 'Tomato'} />
        </div>
      </div>

      {/* ─── MODAL: EDIT FARM PROFILE ──────────────────────────────────────── */}
      {profileModalOpen && (
        <div
          id="profile-modal-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 1400,
            background: 'rgba(5, 46, 43, 0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={e => { if (e.target.id === 'profile-modal-backdrop') setProfileModalOpen(false); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16,
            maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)', padding: '2rem', position: 'relative',
          }}>
            <button
              onClick={() => setProfileModalOpen(false)}
              style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                background: '#F3F4F6', border: 'none', borderRadius: '50%',
                width: 32, height: 32, cursor: 'pointer',
              }}
            >✕</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👨‍🌾</span>
              <h3 style={{ margin: 0, color: '#052E2B' }}>Edit Farm Profile</h3>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Update your registered farming details saved in Cloud Firestore.
            </p>

            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Farm Location / District</label>
                  <input
                    type="text"
                    required
                    value={profileForm.location}
                    onChange={e => setProfileForm(f => ({ ...f, location: e.target.value }))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Total Land Acreage</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={profileForm.totalAcreage}
                    onChange={e => setProfileForm(f => ({ ...f, totalAcreage: e.target.value }))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Nearest Rythu Mandi</label>
                  <input
                    type="text"
                    value={profileForm.nearestMandi}
                    onChange={e => setProfileForm(f => ({ ...f, nearestMandi: e.target.value }))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Crops Cultivated (comma-separated)</label>
                <input
                  type="text"
                  value={profileForm.cropsCultivated}
                  onChange={e => setProfileForm(f => ({ ...f, cropsCultivated: e.target.value }))}
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="Tomato, Chilli, Cotton, Rice"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: '#F3F4F6', border: '1px solid #E5E7EB', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  id="save-farmer-profile-btn"
                  type="submit"
                  style={{ flex: 2, padding: '0.75rem', borderRadius: 8, background: '#052E2B', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT PRODUCE LOT ────────────────────────────────────────── */}
      {editLotModalOpen && editingLot && (
        <div
          id="dashboard-edit-lot-modal"
          style={{
            position: 'fixed', inset: 0, zIndex: 1400,
            background: 'rgba(5, 46, 43, 0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={e => { if (e.target.id === 'dashboard-edit-lot-modal') setEditLotModalOpen(false); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16,
            maxWidth: 500, width: '100%', padding: '2rem', position: 'relative',
          }}>
            <button
              onClick={() => setEditLotModalOpen(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}
            >✕</button>

            <h3 style={{ margin: 0, color: '#052E2B', marginBottom: '0.25rem' }}>Edit Produce: {editingLot.crop}</h3>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Update available quantity or expected price per kg.
            </p>

            <form onSubmit={handleSaveLotEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Quantity (kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editLotQuantity}
                    onChange={e => setEditLotQuantity(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Price per kg (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={editLotPrice}
                    onChange={e => setEditLotPrice(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Location</label>
                  <input
                    type="text"
                    required
                    value={editLotLocation}
                    onChange={e => setEditLotLocation(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Grade</label>
                  <select
                    value={editLotGrade}
                    onChange={e => setEditLotGrade(e.target.value)}
                    className="input select"
                    style={{ width: '100%' }}
                  >
                    <option value="A+">Grade A+</option>
                    <option value="A">Grade A</option>
                    <option value="B+">Grade B+</option>
                    <option value="B">Grade B</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditLotModalOpen(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: '#F3F4F6', border: '1px solid #E5E7EB', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: '0.75rem', borderRadius: 8, background: '#052E2B', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Buyer Dashboard ──────────────────────────────────────────────────────────
function BuyerDashboard({ user }) {
  const [buyerData, setBuyerData] = useState(null);
  const [myBids, setMyBids] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || 'Vijayawada',
    companyName: 'Srinivas Agro Wholesale',
    businessType: 'Wholesaler',
    gstin: '37AAAAA0000A1Z5',
    maxBudget: '1500000',
    preferredCrops: 'Chilli, Tomato, Rice, Cotton',
  });

  // Edit bid modal
  const [editBidModalOpen, setEditBidModalOpen] = useState(false);
  const [editingBid, setEditingBid] = useState(null);
  const [editBidAmount, setEditBidAmount] = useState('');

  const topLot = mockListings[2]; // Chilli lot
  const buyers = matchBuyers(topLot);
  const myMatch = buyers[0];

  const loadBuyerData = async () => {
    try {
      const [profileRes, bidsRes, ordersRes, notifsRes] = await Promise.all([
        api.get('/buyers/me'),
        api.get('/buyers/me/bids'),
        api.get('/orders'),
        api.get('/notifications'),
      ]);

      if (profileRes.ok && profileRes.data?.success) {
        setBuyerData(profileRes.data.data);
        const b = profileRes.data.data;
        setProfileForm({
          name: b.user?.name || user?.name || '',
          phone: b.user?.phone || user?.phone || '',
          location: b.user?.location || user?.location || 'Vijayawada',
          companyName: b.companyName || 'Srinivas Agro Wholesale',
          businessType: b.businessType || 'Wholesaler',
          gstin: b.gstin || '37AAAAA0000A1Z5',
          maxBudget: String(b.maxBudget || '1500000'),
          preferredCrops: Array.isArray(b.preferredCrops) ? b.preferredCrops.join(', ') : 'Chilli, Tomato, Rice',
        });
      }

      if (bidsRes.ok && bidsRes.data?.success && Array.isArray(bidsRes.data.data)) {
        setMyBids(bidsRes.data.data);
      }

      if (ordersRes.ok && ordersRes.data?.success && Array.isArray(ordersRes.data.data)) {
        setMyOrders(ordersRes.data.data);
      }

      if (notifsRes.ok && notifsRes.data?.success && Array.isArray(notifsRes.data.data)) {
        setNotifications(notifsRes.data.data.slice(0, 5));
      }
    } catch (err) {
      console.warn('Could not load buyer data from backend:', err);
    }
  };

  useEffect(() => {
    loadBuyerData();
    window.addEventListener('farmflow_bidding_updated', loadBuyerData);
    return () => window.removeEventListener('farmflow_bidding_updated', loadBuyerData);
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch('/buyers/me', {
        name: profileForm.name,
        phone: profileForm.phone,
        location: profileForm.location,
        companyName: profileForm.companyName,
        businessType: profileForm.businessType,
        gstin: profileForm.gstin,
        maxBudget: Number(profileForm.maxBudget) || 1000000,
        preferredCrops: profileForm.preferredCrops.split(',').map(c => c.trim()).filter(Boolean),
      });
      if (res.ok && res.data?.success) {
        setProfileModalOpen(false);
        loadBuyerData();
      } else {
        alert(res.data?.message || 'Could not update profile.');
      }
    } catch (err) {
      alert('Network error while saving profile.');
    }
  };

  const handleOpenEditBid = (b) => {
    setEditingBid(b);
    setEditBidAmount(String(b.amount));
    setEditBidModalOpen(true);
  };

  const handleSaveBidEdit = (e) => {
    e.preventDefault();
    if (!editingBid) return;
    const res = editBidOnLot(editingBid.lotId || editingBid.productId, editingBid.id, editBidAmount);
    if (res.success) {
      setEditBidModalOpen(false);
      setEditingBid(null);
      loadBuyerData();
    } else {
      alert(res.message);
    }
  };

  const handleCancelBid = (b) => {
    if (window.confirm(`Withdraw your offer of ₹${b.amount}/kg for ${b.lotCrop || 'this lot'}?`)) {
      const res = cancelBidOnLot(b.lotId || b.productId, b.id);
      if (res.success) {
        loadBuyerData();
      } else {
        alert(res.message);
      }
    }
  };

  const stats = buyerData?.stats || {
    totalBidsSubmitted: myBids.length || 0,
    activeBidsCount: myBids.filter(b => b.status === 'highest' || b.status === 'outbid').length || 0,
    acceptedBidsCount: myBids.filter(b => b.status === 'accepted').length || 0,
    totalPurchases: myOrders.length || 0,
    totalSpent: myOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0) || 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ─── BUYER IDENTITY & PROFILE BANNER ─────────────────────────────────── */}
      <div className="card" style={{
        padding: '1.5rem 2rem',
        background: 'linear-gradient(135deg, #052E2B 0%, #0F4A44 100%)',
        color: 'white', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 58, height: 58, borderRadius: '50%',
            background: 'rgba(245,166,35,0.2)', border: '2px solid #F5A623',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem',
          }}>
            🛒
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
                {buyerData?.companyName || user?.name || 'Verified Buyer'}
              </h2>
              <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                ⭐ {buyerData?.buyerRating || '5.0'} Verified Buyer
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>
              🏢 {buyerData?.businessType || 'Wholesaler'} · 📍 {buyerData?.user?.location || user?.location || 'Vijayawada Hub'} · GSTIN: {buyerData?.gstin || '37AAAAA0000A1Z5'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            id="edit-buyer-profile-btn"
            onClick={() => setProfileModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)' }}
          >
            ✏️ Edit Buyer Profile
          </button>
          <Link to="/marketplace" className="btn btn-gold btn-sm">
            🌾 Browse Marketplace
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4">
        {[
          { label: 'Total Bids Placed', value: `${stats.totalBidsSubmitted}`, icon: '🏷️', up: true },
          { label: 'Active Live Bids', value: `${stats.activeBidsCount}`, icon: '⚡', up: true },
          { label: 'Accepted Contracts', value: `${stats.acceptedBidsCount}`, icon: '🤝', up: true },
          { label: 'Total Volume Purchased', value: `₹${(stats.totalSpent || 0).toLocaleString('en-IN')}`, icon: '💸', up: false },
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

      {/* ─── MY SUBMITTED BIDS & LIVE OFFERS TABLE ───────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#052E2B', fontSize: '1.25rem' }}>
              🏷️ My Submitted Bids &amp; Live Offers
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#6B7280' }}>
              Track your active offers, revise pricing, or cancel bids before farmer acceptance.
            </p>
          </div>
          <Link to="/bidding" className="btn btn-primary btn-sm">
            Go to Live Auction Stream
          </Link>
        </div>

        {myBids.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280', background: '#F8FAFC', borderRadius: 8 }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏷️</div>
            <div style={{ fontWeight: 600 }}>No bids submitted yet.</div>
            <p style={{ fontSize: '0.82rem', margin: '4px 0 1rem' }}>Browse the marketplace to find high-grade produce and place your offer.</p>
            <Link to="/marketplace" className="btn btn-primary btn-sm">Browse Marketplace</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Crop Produce</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Supplier Farmer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Your Bid (₹/kg)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Offer Value</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Bid Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myBids.map(b => {
                  const isWinning = b.status === 'accepted';
                  const isLeading = b.status === 'highest';
                  const isOutbid = b.status === 'outbid';
                  const isDeclined = b.status === 'rejected';
                  const isCancelled = b.status === 'cancelled';

                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0F172A' }}>
                        <div>{b.lotCrop || b.crop || 'Produce Lot'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 400 }}>{b.lotQuantity || 100} {b.lotUnit || 'kg'} · {b.lotLocation || 'AP'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {b.lotFarmer || 'Verified Farmer'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#052E2B', fontSize: '1.05rem' }}>
                        ₹{b.amount}/kg
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0F172A' }}>
                        ₹{((Number(b.amount) || 0) * (Number(b.lotQuantity) || 100)).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isWinning ? (
                          <span style={{ background: '#10B981', color: 'white', padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700 }}>
                            🎉 Accepted Deal
                          </span>
                        ) : isLeading ? (
                          <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                            👑 Leading Bid
                          </span>
                        ) : isOutbid ? (
                          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700 }}>
                            ⚠️ Outbid
                          </span>
                        ) : isDeclined ? (
                          <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700 }}>
                            ✕ Declined
                          </span>
                        ) : isCancelled ? (
                          <span style={{ background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600 }}>
                            🚫 Cancelled
                          </span>
                        ) : (
                          <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>{b.status}</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {!isWinning && !isDeclined && !isCancelled ? (
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              id={`edit-bid-row-${b.id}`}
                              onClick={() => handleOpenEditBid(b)}
                              style={{
                                padding: '0.35rem 0.65rem', background: '#F0FDF4', color: '#166534',
                                border: '1px solid #BBF7D0', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              id={`cancel-bid-row-${b.id}`}
                              onClick={() => handleCancelBid(b)}
                              style={{
                                padding: '0.35rem 0.65rem', background: '#FEF2F2', color: '#DC2626',
                                border: '1px solid #FECACA', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                              }}
                            >
                              ✕ Withdraw
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── CONFIRMED PURCHASE ORDERS & ESCROW CONTRACTS ───────────────────── */}
      {myOrders.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#052E2B', fontSize: '1.25rem', marginBottom: '0.35rem' }}>
            📦 Confirmed Purchase Orders &amp; Escrow Contracts
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280', marginBottom: '1.25rem' }}>
            Contracts generated upon farmer acceptance of your bids, protected under AgriDirect escrow.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Order ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Crop Produce</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Quantity</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Supplier Farmer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Escrow Value</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Order Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Escrow Status</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#052E2B' }}>{o.id}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{o.crop}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{o.quantity} {o.unit || 'kg'}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{o.farmerName || 'Verified Farmer'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#052E2B' }}>
                      ₹{(Number(o.totalAmount) || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>{o.orderStatus || 'Confirmed'}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-ai" style={{ fontSize: '0.72rem' }}>{o.escrowStatus || 'Awaiting Deposit'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── LIVE NOTIFICATIONS FEED ────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: '#052E2B' }}>🔔 Recent Buyer Alerts &amp; Notifications</h4>
            <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>Real-time updates</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map(n => (
              <div key={n.id} style={{
                padding: '0.75rem 1rem', borderRadius: 8, background: '#F8FAFC',
                border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{n.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>{n.message}</div>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{new Date(n.createdAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <Link to="/bidding" id="make-offer-btn" className="btn btn-gold">🤝 Bid on Auction</Link>
              <Link to="/marketplace" id="view-lot-buyer-btn" className="btn btn-ghost btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>Explore Lots</Link>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: 0 }}>Available Lots for Purchase</h4>
          <Link to="/marketplace" style={{ fontSize: '0.85rem', color: 'var(--color-forest)', fontWeight: 600 }}>View All in Marketplace →</Link>
        </div>
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
              <Link to={`/bidding?lotId=${lot.id}`} id={`offer-${lot.id}`} className="btn btn-primary btn-sm">Place Bid</Link>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MODAL: EDIT BUYER PROFILE ───────────────────────────────────────── */}
      {profileModalOpen && (
        <div
          id="buyer-profile-modal-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 1400,
            background: 'rgba(5, 46, 43, 0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={e => { if (e.target.id === 'buyer-profile-modal-backdrop') setProfileModalOpen(false); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16,
            maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)', padding: '2rem', position: 'relative',
          }}>
            <button
              onClick={() => setProfileModalOpen(false)}
              style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                background: '#F3F4F6', border: 'none', borderRadius: '50%',
                width: 32, height: 32, cursor: 'pointer',
              }}
            >✕</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🏢</span>
              <h3 style={{ margin: 0, color: '#052E2B' }}>Edit Buyer Profile</h3>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Update your corporate purchasing details in Cloud Firestore.
            </p>

            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Company / Organization Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.companyName}
                  onChange={e => setProfileForm(f => ({ ...f, companyName: e.target.value }))}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Authorized Representative</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Contact Mobile</label>
                  <input
                    type="tel"
                    required
                    value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Business Type</label>
                  <select
                    value={profileForm.businessType}
                    onChange={e => setProfileForm(f => ({ ...f, businessType: e.target.value }))}
                    className="input select"
                    style={{ width: '100%' }}
                  >
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Food Processing Mill">Food Processing Mill</option>
                    <option value="Retail Supermarket Chain">Retail Supermarket Chain</option>
                    <option value="Agro Exporter">Agro Exporter</option>
                    <option value="Commission Agent">Commission Agent</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>GSTIN / Tax Registration</label>
                  <input
                    type="text"
                    value={profileForm.gstin}
                    onChange={e => setProfileForm(f => ({ ...f, gstin: e.target.value }))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Operating City / Hub</label>
                  <input
                    type="text"
                    required
                    value={profileForm.location}
                    onChange={e => setProfileForm(f => ({ ...f, location: e.target.value }))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Max Monthly Budget (₹)</label>
                  <input
                    type="number"
                    min="10000"
                    step="50000"
                    required
                    value={profileForm.maxBudget}
                    onChange={e => setProfileForm(f => ({ ...f, maxBudget: e.target.value }))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Preferred Commodities (comma-separated)</label>
                <input
                  type="text"
                  value={profileForm.preferredCrops}
                  onChange={e => setProfileForm(f => ({ ...f, preferredCrops: e.target.value }))}
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="Chilli, Tomato, Rice, Cotton"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: '#F3F4F6', border: '1px solid #E5E7EB', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  id="save-buyer-profile-btn"
                  type="submit"
                  style={{ flex: 2, padding: '0.75rem', borderRadius: 8, background: '#052E2B', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Save Buyer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT BID MODAL IN DASHBOARD ─────────────────────────────── */}
      {editBidModalOpen && editingBid && (
        <div
          id="dashboard-edit-bid-modal"
          style={{
            position: 'fixed', inset: 0, zIndex: 1400,
            background: 'rgba(5, 46, 43, 0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={e => { if (e.target.id === 'dashboard-edit-bid-modal') setEditBidModalOpen(false); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16,
            maxWidth: 440, width: '100%', padding: '2rem', position: 'relative',
          }}>
            <button
              onClick={() => setEditBidModalOpen(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}
            >✕</button>

            <h3 style={{ margin: 0, color: '#052E2B', marginBottom: '0.25rem' }}>Revise Offer: {editingBid.lotCrop || 'Produce'}</h3>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Update your offer amount per kg.
            </p>

            <form onSubmit={handleSaveBidEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Offer Rate (₹/kg)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={editBidAmount}
                  onChange={e => setEditBidAmount(e.target.value)}
                  className="input"
                  style={{ width: '100%', fontWeight: 700, fontSize: '1.1rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditBidModalOpen(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: '#F3F4F6', border: '1px solid #E5E7EB', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: '0.75rem', borderRadius: 8, background: '#052E2B', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Save Revised Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  const location = useLocation();
  const accessDenied = location.state?.accessDenied;

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
          {accessDenied && (
            <div style={{
              background: 'rgba(239, 83, 80, 0.2)',
              border: '1px solid rgba(239, 83, 80, 0.5)',
              color: '#ffcdd2',
              borderRadius: 10,
              padding: '0.75rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.9rem',
            }}>
              <span style={{ fontSize: '1.2rem' }}>🔒</span>
              <div>
                <strong>Access Restricted:</strong> You do not have permission to access that area. You have been redirected to your personal {role} dashboard.
              </div>
            </div>
          )}
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
