import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getComplaints, updateComplaintStatus, getSuspendedUsers, isUserSuspended, toggleSuspendReportedUser } from '../utils/complaintStore';
import { getStoredListings } from '../utils/marketplaceStore';
import { getAllBids, removeFraudulentBid, removeFraudulentListing } from '../utils/biddingStore';

const platformStats = [
  { icon: '👨‍🌾', label: 'Total Farmers',    value: '1,240',    change: '+34 this week',  color: '#4CAF50' },
  { icon: '🏪', label: 'Total Buyers',     value: '380',      change: '+12 this week',  color: '#F5A623' },
  { icon: '📦', label: 'Active Listings',  value: '892',      change: '+67 today',      color: '#00E5C7' },
  { icon: '💰', label: 'Total Volume',     value: '₹2.4 Cr+', change: '+₹18L this week',color: '#7C5CFF' },
  { icon: '🤖', label: 'AI Predictions',   value: '94%',      change: 'Accuracy rate',  color: '#FF7043' },
  { icon: '🚛', label: 'Logistics Orders', value: '234',      change: '18 pending',     color: '#42A5F5' },
];

const recentUsers = [
  { name: 'Ravi Kumar',    role: 'farmer', location: 'Vizag',    status: 'active',  joined: '01 Sep 2026' },
  { name: 'Srinivas M.',   role: 'buyer',  location: 'Guntur',   status: 'active',  joined: '02 Sep 2026' },
  { name: 'Lakshmi Devi',  role: 'farmer', location: 'Kakinada', status: 'pending', joined: '03 Sep 2026' },
  { name: 'Murthy & Sons', role: 'buyer',  location: 'Vijayawada',status: 'active', joined: '03 Sep 2026' },
  { name: 'Prasad Farms',  role: 'farmer', location: 'Nellore',  status: 'active',  joined: '04 Sep 2026' },
  { name: 'Kiran Traders', role: 'buyer',  location: 'Tirupati', status: 'suspended',joined: '04 Sep 2026' },
];

const recentListings = [
  { crop: '🍅 Tomato',  farmer: 'Ravi Kumar', qty: '500 kg', price: '₹30.5/kg', status: 'live',    bids: 7  },
  { crop: '🌶️ Chilli',  farmer: 'Prasad Farms',qty: '200 kg',price: '₹63/kg',  status: 'live',    bids: 12 },
  { crop: '🌾 Rice',    farmer: 'Ramu Reddy', qty: '2 tons', price: '₹34.2/kg', status: 'closed',  bids: 5  },
  { crop: '🧶 Cotton',  farmer: 'Suresh K.',  qty: '1 ton',  price: '₹72/kg',   status: 'pending', bids: 0  },
  { crop: '🌽 Maize',   farmer: 'Lakshmi Devi',qty: '800 kg',price: '₹22/kg',  status: 'live',    bids: 3  },
];

const statusColor = {
  active:    { bg: 'rgba(76,175,80,0.15)',   color: '#4CAF50'  },
  pending:   { bg: 'rgba(255,152,0,0.15)',   color: '#FF9800'  },
  suspended: { bg: 'rgba(239,83,80,0.15)',   color: '#ef5350'  },
  live:      { bg: 'rgba(0,229,199,0.12)',   color: '#00E5C7'  },
  closed:    { bg: 'rgba(158,158,158,0.15)', color: '#9E9E9E'  },
  resolved:  { bg: 'rgba(16,185,129,0.15)',  color: '#10B981'  },
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [complaints, setComplaints] = useState(getComplaints());
  const [liveListings, setLiveListings] = useState(() => getStoredListings());
  const [liveBids, setLiveBids] = useState(() => getAllBids());
  const [suspendedUsers, setSuspendedUsers] = useState(() => getSuspendedUsers());
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const handleUpdate = () => setComplaints(getComplaints());
    const handleListings = () => setLiveListings(getStoredListings());
    const handleBids = () => setLiveBids(getAllBids());
    const handleSuspended = () => setSuspendedUsers(getSuspendedUsers());

    window.addEventListener('agridirect_complaints_updated', handleUpdate);
    window.addEventListener('farmflow_listings_updated', handleListings);
    window.addEventListener('farmflow_bidding_updated', handleBids);
    window.addEventListener('agridirect_user_suspended', handleSuspended);

    return () => {
      window.removeEventListener('agridirect_complaints_updated', handleUpdate);
      window.removeEventListener('farmflow_listings_updated', handleListings);
      window.removeEventListener('farmflow_bidding_updated', handleBids);
      window.removeEventListener('agridirect_user_suspended', handleSuspended);
    };
  }, []);

  const handleSuspendReportedParty = (complaint) => {
    const partyName = complaint.counterpartyName;
    if (!partyName || partyName === 'Not specified' || partyName === 'N/A') {
      setToastMsg('No valid reported counterparty specified on this complaint ticket.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    const res = toggleSuspendReportedUser(complaint.id, partyName, `Enforced via Admin Complaint Box ticket ${complaint.id}`);
    if (res.success) {
      setSuspendedUsers(getSuspendedUsers());
      setComplaints(getComplaints());
      setToastMsg(res.message);
      setTimeout(() => setToastMsg(''), 4500);
    }
  };

  const handleRemoveListingFraud = (lotId, cropName) => {
    if (!window.confirm(`[Admin Moderation] Permanently remove listing "${cropName}" (ID: ${lotId}) and cancel all associated bids due to fraudulent activity?`)) {
      return;
    }
    const res = removeFraudulentListing(lotId, 'Fraudulent or suspicious activity flagged by Admin');
    if (res.success) {
      setLiveListings(getStoredListings());
      setLiveBids(getAllBids());
      setToastMsg(`🚨 Listing "${cropName}" removed.`);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const handleRemoveBidFraud = (bidId, buyerName, amount) => {
    if (!window.confirm(`[Admin Moderation] Delete fraudulent bid of ₹${amount}/kg from ${buyerName}?`)) {
      return;
    }
    const res = removeFraudulentBid(bidId, 'Suspicious / fraudulent bid removed by Admin');
    if (res.success) {
      setLiveBids(getAllBids());
      setLiveListings(getStoredListings());
      setToastMsg(`🚫 Fraudulent bid from ${buyerName} removed.`);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const pendingCount = complaints.filter(c => c.status === 'Pending').length;

  const navItems = [
    { id: 'overview',    icon: '📊', label: 'Overview' },
    { id: 'complaints',  icon: '⚖️', label: 'Complaint Desk', badge: pendingCount > 0 ? pendingCount : null },
    { id: 'users',       icon: '👥', label: 'Users' },
    { id: 'listings',    icon: '📦', label: 'Listings' },
    { id: 'system',      icon: '⚙️', label: 'System' },
  ];

  const handleUpdateStatus = (id, newStatus, defaultNote = '') => {
    const res = updateComplaintStatus(id, newStatus, defaultNote);
    if (res.success) {
      setComplaints(getComplaints());
      setToastMsg(`Complaint ${id} updated to "${newStatus}"!`);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const roleMatch = filterRole === 'All' || c.reporterRole.toLowerCase() === filterRole.toLowerCase();
    const statusMatch = filterStatus === 'All' || c.status.toLowerCase() === filterStatus.toLowerCase();
    return roleMatch && statusMatch;
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0a14 0%, #0f0f1e 50%, #0a100a 100%)',
      paddingTop: 68,
      display: 'flex',
    }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'rgba(124,92,255,0.06)',
        borderRight: '1px solid rgba(124,92,255,0.15)',
        padding: '2rem 1rem',
        position: 'sticky', top: 68, height: 'calc(100vh - 68px)',
        overflowY: 'auto',
      }}>
        {/* Admin chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.85rem 1rem',
          background: 'rgba(124,92,255,0.12)',
          border: '1px solid rgba(124,92,255,0.25)',
          borderRadius: 12, marginBottom: '2rem',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C5CFF, #00E5C7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>⚙️</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>{user?.name}</div>
            <div style={{ color: 'rgba(124,92,255,0.8)', fontSize: '0.72rem', fontWeight: 600 }}>SUPER ADMIN</div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.7rem 1rem', borderRadius: 10,
                background: activeSection === item.id ? 'rgba(124,92,255,0.2)' : 'transparent',
                border: activeSection === item.id ? '1px solid rgba(124,92,255,0.3)' : '1px solid transparent',
                color: activeSection === item.id ? '#7C5CFF' : 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>{item.icon}</span> {item.label}
              </span>
              {item.badge && (
                <span style={{
                  background: '#EF4444', color: 'white', borderRadius: 12,
                  padding: '1px 7px', fontSize: '0.7rem', fontWeight: 800
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.7rem 1rem', borderRadius: 10, marginTop: '2rem', width: '100%',
            background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.2)',
            color: '#ef5350', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
          }}
        >
          🚪 Sign Out
        </button>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{
              padding: '0.25rem 0.75rem', borderRadius: 20,
              background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)',
              color: '#7C5CFF', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
            }}>⚙️ ADMIN PANEL</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>Restricted Access</span>
          </div>
          <h1 style={{ color: 'white', fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {activeSection === 'overview'   && 'Platform Overview'}
            {activeSection === 'complaints' && 'Complaint Desk'}
            {activeSection === 'users'      && 'User Management'}
            {activeSection === 'listings'   && 'Listing Management'}
            {activeSection === 'system'     && 'System Controls'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
            Agri Direct Admin Dashboard · Grievance arbitration and live platform telemetry
          </p>
        </div>

        {/* ── OVERVIEW ── */}
        {activeSection === 'overview' && (
          <>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {platformStats.map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '1.25rem 1.5rem',
                  display: 'flex', alignItems: 'flex-start', gap: '1rem',
                  transition: 'transform 0.2s ease',
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                    background: `${s.color}18`, border: `1px solid ${s.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                  }}>{s.icon}</div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', marginBottom: '0.25rem' }}>{s.label}</div>
                    <div style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ color: s.color, fontSize: '0.72rem', marginTop: '0.3rem', fontWeight: 600 }}>{s.change}</div>
                  </div>
                </div>
              ))}
              {/* Complaints Stat Card */}
              <div
                onClick={() => setActiveSection('complaints')}
                style={{
                  background: 'rgba(239,68,68,0.08)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(239,68,68,0.25)', borderRadius: 16, padding: '1.25rem 1.5rem',
                  display: 'flex', alignItems: 'flex-start', gap: '1rem',
                  cursor: 'pointer', transition: 'transform 0.2s ease',
                }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                }}>⚖️</div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', marginBottom: '0.25rem' }}>Complaint Desk</div>
                  <div style={{ color: '#F87171', fontWeight: 800, fontSize: '1.5rem', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{complaints.length} Total</div>
                  <div style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.3rem', fontWeight: 600 }}>
                    {pendingCount} Pending Review →
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Complaints Preview */}
            <div style={{ marginBottom: '2rem' }}>
              <SectionCard title="Complaint Desk (Recent Disputes)" badge={`${pendingCount} pending`}>
                <div style={{ padding: '0.5rem 1.5rem 1rem' }}>
                  {complaints.slice(0, 3).map(c => (
                    <div key={c.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                      flexWrap: 'wrap', gap: '0.5rem'
                    }}>
                      <div>
                        <span style={{ color: '#A78BFA', fontWeight: 700, fontSize: '0.8rem', marginRight: 8 }}>{c.id}</span>
                        <strong style={{ color: 'white', fontSize: '0.88rem' }}>{c.reporterName}</strong>
                        <span style={{ color: c.reporterRole === 'Farmer' ? '#4CAF50' : '#F5A623', fontSize: '0.75rem', marginLeft: 6 }}>
                          ({c.reporterRole})
                        </span>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: 2 }}>{c.category}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          background: c.status === 'Resolved' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: c.status === 'Resolved' ? '#10B981' : '#EF4444',
                          padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700
                        }}>
                          {c.status}
                        </span>
                        <button
                          onClick={() => setActiveSection('complaints')}
                          style={{
                            background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)',
                            color: '#A78BFA', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer'
                          }}
                        >
                          View Desk →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Recent Users preview */}
            <SectionCard title="Recent Users" badge={recentUsers.length}>
              <UsersTable users={recentUsers.slice(0, 4)} />
            </SectionCard>
          </>
        )}

        {/* ── COMPLAINT DESK SECTION ── */}
        {activeSection === 'complaints' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top Stat Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {[
                { label: 'Total Complaints', count: complaints.length, color: '#7C5CFF', icon: '📋' },
                { label: 'Pending Review', count: complaints.filter(c => c.status === 'Pending').length, color: '#EF4444', icon: '⏳' },
                { label: 'Under Investigation', count: complaints.filter(c => c.status === 'Under Investigation').length, color: '#F5A623', icon: '🔍' },
                { label: 'Resolved', count: complaints.filter(c => c.status === 'Resolved').length, color: '#10B981', icon: '✅' },
              ].map((st, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem'
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: `${st.color}20`, border: `1px solid ${st.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                    {st.icon}
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600 }}>{st.label}</div>
                    <div style={{ color: 'white', fontWeight: 800, fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>{st.count}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter Tabs */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
            }}>
              {/* Role filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Filer:</span>
                {['All', 'Farmer', 'Buyer'].map(r => (
                  <button
                    key={r}
                    onClick={() => setFilterRole(r)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                      cursor: 'pointer', border: filterRole === r ? '1px solid #7C5CFF' : '1px solid rgba(255,255,255,0.1)',
                      background: filterRole === r ? 'rgba(124,92,255,0.25)' : 'transparent',
                      color: filterRole === r ? '#A78BFA' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {r === 'All' ? 'All Parties' : r === 'Farmer' ? '👨‍🌾 Farmers Only' : '🏪 Buyers Only'}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Status:</span>
                {['All', 'Pending', 'Under Investigation', 'Resolved'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                      cursor: 'pointer', border: filterStatus === s ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                      background: filterStatus === s ? 'rgba(16,185,129,0.2)' : 'transparent',
                      color: filterStatus === s ? '#6EE7B7' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Toast Feedback */}
            {toastMsg && (
              <div style={{
                background: 'rgba(16,185,129,0.18)', border: '1px solid #10B981', color: '#6EE7B7',
                padding: '0.75rem 1.25rem', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600,
              }}>
                ✅ {toastMsg}
              </div>
            )}

            {/* Complaints Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredComplaints.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)',
                  borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)'
                }}>
                  🎉 No complaints found matching the selected filters.
                </div>
              ) : (
                filteredComplaints.map(item => {
                  const isPending = item.status === 'Pending';
                  const isInvestigating = item.status === 'Under Investigation';
                  const isResolved = item.status === 'Resolved';
                  const statusBg = isResolved ? 'rgba(16,185,129,0.15)' : isInvestigating ? 'rgba(245,166,35,0.15)' : 'rgba(239,68,68,0.15)';
                  const statusClr = isResolved ? '#10B981' : isInvestigating ? '#F5A623' : '#EF4444';

                  return (
                    <div key={item.id} style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
                    }}>
                      {/* Top Row: Ref, Role, Category, Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{
                            background: 'rgba(124,92,255,0.2)', color: '#A78BFA', border: '1px solid rgba(124,92,255,0.3)',
                            padding: '3px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 800, fontFamily: 'monospace'
                          }}>
                            {item.id}
                          </span>
                          <span style={{
                            background: item.reporterRole === 'Farmer' ? 'rgba(76,175,80,0.15)' : 'rgba(245,166,35,0.15)',
                            color: item.reporterRole === 'Farmer' ? '#4CAF50' : '#F5A623',
                            padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700
                          }}>
                            {item.reporterRole === 'Farmer' ? '👨‍🌾 Farmer' : '🏪 Buyer'}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                            📅 {item.submittedDate}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            background: item.severity === 'Critical' || item.severity === 'High' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
                            color: item.severity === 'Critical' || item.severity === 'High' ? '#F87171' : 'rgba(255,255,255,0.7)',
                            padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700
                          }}>
                            {item.severity} Priority
                          </span>
                          <span style={{
                            background: statusBg, color: statusClr,
                            padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800
                          }}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Reporter & Counterparty details */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.82rem'
                      }}>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Filing Party</div>
                          <div style={{ color: 'white', fontWeight: 700 }}>{item.reporterName}</div>
                          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>📞 {item.reporterPhone}</div>
                        </div>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Reported Person / Counterparty</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#FCA5A5', fontWeight: 700 }}>{item.counterpartyName}</span>
                            {isUserSuspended(item.counterpartyName) && (
                              <span style={{
                                background: '#DC2626', color: 'white',
                                padding: '1px 7px', borderRadius: 10, fontSize: '0.68rem', fontWeight: 800
                              }}>
                                ⛔ SUSPENDED
                              </span>
                            )}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Lot: {item.lotId}</div>
                        </div>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Dispute Category</div>
                          <div style={{ color: '#E2E8F0', fontWeight: 600 }}>{item.category}</div>
                        </div>
                      </div>

                      {/* Description */}
                      <div style={{
                        background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '0.9rem 1.1rem',
                        color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem', lineHeight: 1.6,
                        borderLeft: `3px solid ${statusClr}`
                      }}>
                        {item.description}
                      </div>

                      {/* Evidence Photo if present */}
                      {item.evidenceUrl && (
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Attached Evidence:</div>
                          <img src={item.evidenceUrl} alt="Evidence" style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
                        </div>
                      )}

                      {/* Admin Resolution Note if present */}
                      {item.adminNote && (
                        <div style={{
                          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                          borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.8rem', color: '#6EE7B7'
                        }}>
                          <strong>Admin Action Note:</strong> {item.adminNote}
                        </div>
                      )}

                      {/* Active Suspension Notice in Card */}
                      {isUserSuspended(item.counterpartyName) && (
                        <div style={{
                          background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.35)',
                          borderRadius: 8, padding: '0.55rem 0.9rem', fontSize: '0.8rem', color: '#FCA5A5',
                          display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                          <span style={{ fontSize: '1.1rem' }}>⛔</span>
                          <span>
                            <strong>Account Suspended:</strong> The reported person <strong>"{item.counterpartyName}"</strong> has been suspended from Agri Direct by Admin.
                          </span>
                        </div>
                      )}

                      {/* Admin Actions Bar (Directly within Admin Complaint Box) */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem',
                        borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', flexWrap: 'wrap'
                      }}>
                        {/* Direct Option to Suspend Reported Person */}
                        <button
                          id={`admin-suspend-btn-${item.id}`}
                          onClick={() => handleSuspendReportedParty(item)}
                          style={{
                            padding: '5px 13px', borderRadius: 8,
                            background: isUserSuspended(item.counterpartyName) ? 'rgba(239,68,68,0.32)' : 'rgba(239,68,68,0.16)',
                            border: isUserSuspended(item.counterpartyName) ? '1.5px solid #EF4444' : '1px solid rgba(239,68,68,0.45)',
                            color: isUserSuspended(item.counterpartyName) ? '#FCA5A5' : '#F87171',
                            fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '5px',
                            boxShadow: '0 2px 8px rgba(239,68,68,0.15)',
                            transition: 'all 0.15s ease',
                          }}
                          title={`Suspend ${item.counterpartyName} directly from Complaint Box`}
                        >
                          <span>⛔</span>
                          <span>
                            {isUserSuspended(item.counterpartyName)
                              ? `Unsuspend (${item.counterpartyName})`
                              : `Suspend Reported (${item.counterpartyName})`}
                          </span>
                        </button>

                        {item.status !== 'Under Investigation' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Under Investigation', 'Assigned arbitration officer to investigate.')}
                            style={{
                              padding: '5px 12px', borderRadius: 8, background: 'rgba(245,166,35,0.15)',
                              border: '1px solid rgba(245,166,35,0.3)', color: '#FBBF24', fontSize: '0.78rem',
                              fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            🔍 Mark Under Investigation
                          </button>
                        )}
                        {item.status !== 'Resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Resolved', 'Dispute arbitrated and resolved between parties.')}
                            style={{
                              padding: '5px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.2)',
                              border: '1px solid rgba(16,185,129,0.4)', color: '#34D399', fontSize: '0.78rem',
                              fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            ✅ Resolve Dispute
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {activeSection === 'users' && (
          <SectionCard title="All Users" badge={recentUsers.length}>
            <UsersTable users={recentUsers} />
          </SectionCard>
        )}

        {/* ── LISTINGS & FRAUD WATCH ── */}
        {activeSection === 'listings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Live Crop Listings Table with Fraud Action */}
            <SectionCard title="Active Marketplace Crop Listings" badge={`${liveListings.length} Active`}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['ID', 'Crop', 'Farmer', 'Quantity', 'Asking Price', 'Grade', 'Admin Action'].map(h => (
                        <th key={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700, padding: '0.6rem 1rem', textAlign: 'left', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {liveListings.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                          No active listings. All fraudulent or expired listings removed.
                        </td>
                      </tr>
                    ) : (
                      liveListings.map((l, i) => (
                        <tr key={l.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#A78BFA' }}>{l.id}</td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: 'white' }}>{l.crop}</td>
                          <td style={tdStyle}>{l.farmer} <small style={{ color: 'rgba(255,255,255,0.4)' }}>({l.location})</small></td>
                          <td style={tdStyle}>{l.quantity} kg</td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#10B981' }}>₹{l.pricePerKg || l.price}/kg</td>
                          <td style={tdStyle}>
                            <span style={{ background: 'rgba(0,229,199,0.12)', color: '#00E5C7', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>
                              Grade {l.grade || 'A'}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <button
                              id={`admin-del-lot-${l.id}`}
                              onClick={() => handleRemoveListingFraud(l.id, l.crop)}
                              style={{
                                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                color: '#EF4444', padding: '4px 10px', borderRadius: 6,
                                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                              title="Remove fraudulent or suspicious listing"
                            >
                              <span>🗑️</span> Remove Listing (Fraud)
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Bidding Fraud Moderation Desk */}
            <SectionCard title="Marketplace Bidding Fraud Moderation Watch" badge={`${liveBids.length} Total Bids`}>
              <div style={{ padding: '0.75rem 1.5rem 0.5rem', background: 'rgba(239,68,68,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
                  🛡️ <strong>Admin Fraud Shield:</strong> Monitor active auction bids. If any buyer engages in fake bidding, shilling, or excessive price manipulation, remove the bid immediately.
                </p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Bid ID', 'Target Lot', 'Bidder Name', 'Contact Phone', 'Offer Amount', 'Status', 'Time', 'Admin Action'].map(h => (
                        <th key={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700, padding: '0.6rem 1rem', textAlign: 'left', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {liveBids.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                          No bids recorded in marketplace auctions.
                        </td>
                      </tr>
                    ) : (
                      liveBids.map((b, i) => (
                        <tr key={b.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#F5A623', fontSize: '0.8rem' }}>{b.id}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: 'white' }}>{b.lotId}</td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: 'white' }}>{b.buyer}</td>
                          <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{b.buyerPhone || 'N/A'}</td>
                          <td style={{ ...tdStyle, fontWeight: 800, color: '#00E5C7', fontSize: '0.95rem' }}>₹{b.amount}/kg</td>
                          <td style={tdStyle}>
                            <span style={{
                              background: b.status === 'highest' ? 'rgba(0,229,199,0.15)' : b.status === 'accepted' ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.08)',
                              color: b.status === 'highest' ? '#00E5C7' : b.status === 'accepted' ? '#4CAF50' : 'rgba(255,255,255,0.6)',
                              padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700
                            }}>
                              {b.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{b.timestamp}</td>
                          <td style={tdStyle}>
                            <button
                              id={`admin-del-bid-${b.id}`}
                              onClick={() => handleRemoveBidFraud(b.id, b.buyer, b.amount)}
                              style={{
                                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
                                color: '#EF4444', padding: '4px 10px', borderRadius: 6,
                                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                              title="Delete fraudulent bid"
                            >
                              <span>🚫</span> Remove Fraudulent Bid
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── SYSTEM ── */}
        {activeSection === 'system' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {[
              { icon: '🤖', title: 'AI Engine', desc: 'FarmAI price prediction model is running. Accuracy: 94%.', color: '#00E5C7', action: 'Retrain Model' },
              { icon: '📧', title: 'Notifications', desc: 'Email & SMS alerts are active. 312 sent today.', color: '#7C5CFF', action: 'View Logs' },
              { icon: '🛡️', title: 'Security', desc: 'All systems secure. Last audit: 2 Sep 2026.', color: '#4CAF50', action: 'Run Audit' },
              { icon: '💾', title: 'Database', desc: 'Storage: 42% used. Backup: 3 hours ago.', color: '#F5A623', action: 'Backup Now' },
            ].map((c, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '1.5rem',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{c.icon}</div>
                <h4 style={{ color: 'white', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>{c.title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>{c.desc}</p>
                <button style={{
                  padding: '0.5rem 1.25rem', borderRadius: 10,
                  background: `${c.color}18`, border: `1px solid ${c.color}40`,
                  color: c.color, fontWeight: 700, fontSize: '0.82rem',
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>{c.action}</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SectionCard({ title, badge, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      <div style={{
        padding: '1.1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <h3 style={{ color: 'white', fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
        <span style={{ background: 'rgba(124,92,255,0.15)', color: '#7C5CFF', padding: '1px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>{badge}</span>
      </div>
      <div style={{ padding: '0.5rem 0' }}>{children}</div>
    </div>
  );
}

function UsersTable({ users }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {['Name', 'Role', 'Location', 'Status', 'Joined'].map(h => (
            <th key={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700, padding: '0.6rem 1.5rem', textAlign: 'left', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {h.toUpperCase()}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {users.map((u, i) => {
          const suspended = isUserSuspended(u.name) || u.status === 'suspended';
          const effectiveStatus = suspended ? 'suspended' : u.status;
          const sc = statusColor[effectiveStatus] || statusColor.pending;
          const roleColor = u.role === 'farmer' ? '#4CAF50' : '#F5A623';
          return (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={tdStyle}><strong style={{ color: 'white' }}>{u.name}</strong></td>
              <td style={tdStyle}>
                <span style={{ color: roleColor, fontWeight: 600, fontSize: '0.8rem' }}>
                  {u.role === 'farmer' ? '👨‍🌾' : '🏪'} {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                </span>
              </td>
              <td style={tdStyle}>{u.location}</td>
              <td style={tdStyle}>
                <span style={{ background: sc.bg, color: sc.color, padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                  {effectiveStatus.toUpperCase()}
                </span>
              </td>
              <td style={tdStyle}>{u.joined}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const tdStyle = {
  padding: '0.75rem 1.5rem',
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.875rem',
};
