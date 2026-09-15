import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getBiddingLots,
  getAllBids,
  getBidsForLot,
  publishBiddingLot,
  placeBidOnLot,
  acceptBidForLot,
  rejectBidForLot,
  editBidOnLot,
  cancelBidOnLot,
  removeFraudulentBid,
  removeFraudulentListing,
  syncBiddingFromBackend,
} from '../utils/biddingStore';
import { resolveProduceImage } from '../utils/produceImageResolver';
import biddingHeroImg from '../assets/bidding-hero.jpg';

const trackStages = [
  { label: 'Lot Created',        icon: '📦', done: true },
  { label: 'Quality Verified',   icon: '✅', done: true },
  { label: 'Listed for Auction', icon: '🏪', done: true },
  { label: 'Bidding Open',       icon: '🏷️', done: true, active: true },
  { label: 'Buyer Selected',     icon: '🤝', done: false },
  { label: 'Payment & Escrow',   icon: '💳', done: false },
  { label: 'Logistics',          icon: '🚛', done: false },
];

function StatusTracker({ stages, isAccepted }) {
  const adjustedStages = stages.map((s, idx) => {
    if (idx <= 3) {
      return { ...s, done: true, active: !isAccepted && idx === 3 };
    }
    if (idx === 4) {
      return { ...s, done: isAccepted, active: isAccepted };
    }
    return { ...s, done: false, active: false };
  });

  const completedCount = adjustedStages.filter(s => s.done).length;
  const progressPct = ((completedCount - 1) / (adjustedStages.length - 1)) * 100;

  return (
    <div style={{ padding: '1rem 0' }}>
      {/* Progress line */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0,
          height: 4, background: 'rgba(0,0,0,0.08)', transform: 'translateY(-50%)',
          borderRadius: 4,
        }} />
        <div className="tracker-progress-fill" style={{
          position: 'absolute', top: '50%', left: 0,
          height: 4, background: 'linear-gradient(90deg, var(--color-forest), #10B981)',
          transform: 'translateY(-50%)', borderRadius: 4,
          width: `${progressPct}%`,
          transition: 'width 1s cubic-bezier(0.25, 1, 0.5, 1)',
        }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
          {adjustedStages.map((stage, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: stage.done
                  ? (stage.active ? '#F5A623' : '#10B981')
                  : 'white',
                border: `3px solid ${stage.done ? (stage.active ? '#F5A623' : '#10B981') : 'rgba(0,0,0,0.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', color: stage.done ? 'white' : 'var(--color-charcoal)',
                boxShadow: stage.active ? '0 0 0 6px rgba(245,166,35,0.2)' : 'var(--shadow-sm)',
                zIndex: 1, position: 'relative',
                transition: 'all 0.4s ease',
              }}>
                {stage.done && !stage.active ? '✓' : stage.icon}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {adjustedStages.map((stage, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center', fontSize: '0.68rem',
            color: stage.done ? (stage.active ? '#F5A623' : '#052E2B') : 'var(--color-text-muted)',
            fontWeight: stage.done ? 700 : 400, padding: '0 3px',
            lineHeight: 1.25,
          }}>
            {stage.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const cropPresetOptions = [
  { name: 'Chilli',  emoji: '🌶️', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75', defaultPrice: 60 },
  { name: 'Tomato',  emoji: '🍅', img: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=75', defaultPrice: 28 },
  { name: 'Rice',    emoji: '🌾', img: 'https://images.unsplash.com/photo-1586201375761-83865001e8c7?w=400&q=75', defaultPrice: 32 },
  { name: 'Cotton',  emoji: '🧶', img: 'https://images.unsplash.com/photo-1605000797498-6f2145b1d820?w=400&q=75', defaultPrice: 70 },
  { name: 'Garlic',  emoji: '🧄', img: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&q=75', defaultPrice: 75 },
  { name: 'Onion',   emoji: '🧅', img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=75', defaultPrice: 35 },
  { name: 'Potato',  emoji: '🥔', img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=75', defaultPrice: 26 },
  { name: 'Ginger',  emoji: '🫚', img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=75', defaultPrice: 90 },
];

export default function Bidding() {
  const { role, user, isLoggedIn } = useAuth();
  const locationHook = useLocation();

  const isFarmer = isLoggedIn && role === 'farmer';
  const isBuyer  = isLoggedIn && role === 'buyer';
  const isAdmin  = isLoggedIn && role === 'admin';

  // Lots and Bids from persistent store
  const [lots, setLots] = useState(getBiddingLots);
  const [allBids, setAllBids] = useState(getAllBids);
  const [activeLotId, setActiveLotId] = useState('L001');
  const [lotBids, setLotBids] = useState([]);

  // Filter tabs for Farmer & Buyer: 'all' | 'yours'
  const [biddingFilter, setBiddingFilter] = useState('all');

  // Buyer bid form state
  const [bidAmount, setBidAmount] = useState('');
  const [buyerName, setBuyerName] = useState(user?.name || '');
  const [placedMsg, setPlacedMsg] = useState('');

  // Farmer publish modal state
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [formCrop, setFormCrop] = useState('Chilli');
  const [formCustomCrop, setFormCustomCrop] = useState('');
  const [formQuantity, setFormQuantity] = useState('600');
  const [formBasePrice, setFormBasePrice] = useState('60');
  const [formGrade, setFormGrade] = useState('A+');
  const [formMoisture, setFormMoisture] = useState('10');
  const [formDescription, setFormDescription] = useState('');

  // Farmer accept bid dialog state
  const [acceptDialogBid, setAcceptDialogBid] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  // Buyer edit bid dialog state
  const [editBidModalOpen, setEditBidModalOpen] = useState(false);
  const [editingBid, setEditingBid] = useState(null);
  const [editBidAmount, setEditBidAmount] = useState('');

  // ── Functional Bidding Countdown Timer State ─────────────────────────────
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
    formatted: '--:--:--',
  });

  // Sync state on load and on custom events
  function refreshBiddingData() {
    const updatedLots = getBiddingLots();
    const updatedAllBids = getAllBids();
    setLots(updatedLots);
    setAllBids(updatedAllBids);
    if (activeLotId) {
      setLotBids(getBidsForLot(activeLotId));
    }
  }

  useEffect(() => {
    refreshBiddingData();
    window.addEventListener('farmflow_bidding_updated', refreshBiddingData);
    return () => window.removeEventListener('farmflow_bidding_updated', refreshBiddingData);
  }, [activeLotId]);

  // ── Live Stream Polling from Backend (Near Real-Time Updates) ─────────────
  useEffect(() => {
    syncBiddingFromBackend();
    const livePollInterval = setInterval(() => {
      syncBiddingFromBackend();
    }, 3000);
    return () => clearInterval(livePollInterval);
  }, []);

  // Check URL query parameters (e.g. ?lotId=L002)
  useEffect(() => {
    const params = new URLSearchParams(locationHook.search);
    const paramLotId = params.get('lotId');
    if (paramLotId) {
      const exists = lots.find(l => l.id === paramLotId);
      if (exists) {
        setActiveLotId(paramLotId);
      }
    }
  }, [locationHook.search, lots]);

  // AI Bid Recommendation state
  const [aiBidRecommendation, setAiBidRecommendation] = useState(null);

  // Update lot bids when active lot changes
  useEffect(() => {
    const bids = getBidsForLot(activeLotId);
    setLotBids(bids);
    const lot = lots.find(l => l.id === activeLotId);
    const highest = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : (lot?.basePrice || 25);
    setBidAmount(String(+(highest + 1).toFixed(1)));
    setPlacedMsg('');

    // Fetch AI Bid & Fair Market Recommendation
    if (lot) {
      fetch('/api/ai/recommend-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lot, currentBids: bids })
      }).then(r => r.json()).then(res => {
        if (res.success && res.data) {
          setAiBidRecommendation(res.data);
        }
      }).catch(() => {});
    }
  }, [activeLotId, lots]);

  // ── Role Ownership Helpers ────────────────────────────────────────────────
  const isLotOwnedByFarmer = (lot) => {
    if (!isFarmer || !user?.name) return false;
    const cleanUser = user.name.trim().toLowerCase();
    const cleanFarmer = (lot.farmer || '').trim().toLowerCase();
    const cleanPhone = (user?.phone || '').replace(/\D/g, '');
    const lotPhone = (lot.farmerPhone || '').replace(/\D/g, '');
    const phoneMatch = cleanPhone && lotPhone && cleanPhone.slice(-10) === lotPhone.slice(-10);
    return cleanFarmer === cleanUser || cleanFarmer.includes(cleanUser) || phoneMatch || (lot.id && lot.id.startsWith('AUCTION_')) || Boolean(lot.isNewlyPublished);
  };

  const farmerYoursLots = lots.filter(isLotOwnedByFarmer);

  const isBidOwnedByBuyer = (b) => {
    if (!isBuyer || !user?.name) return false;
    const cleanBuyer = (user.name || '').trim().toLowerCase();
    const bBuyer = (b.buyer || '').trim().toLowerCase();
    const nameMatch = bBuyer === cleanBuyer || bBuyer.includes(cleanBuyer) || cleanBuyer.includes(bBuyer);
    const cleanPhone = (user?.phone || '').replace(/\D/g, '');
    const bPhone = (b.buyerPhone || '').replace(/\D/g, '');
    const phoneMatch = cleanPhone && bPhone && (cleanPhone.slice(-10) === bPhone.slice(-10));
    return Boolean(nameMatch || phoneMatch);
  };

  const buyerYoursBids = allBids.filter(isBidOwnedByBuyer);
  const buyerBidLotIds = Array.from(new Set(buyerYoursBids.map(b => b.lotId)));
  const buyerYoursLots = lots.filter(l => buyerBidLotIds.includes(l.id));

  const displayedLots = (isFarmer && biddingFilter === 'yours')
    ? farmerYoursLots
    : (isBuyer && biddingFilter === 'yours')
    ? buyerYoursLots
    : lots;

  // Auto-select valid lot when filter switches
  useEffect(() => {
    if (biddingFilter === 'yours') {
      const targetLots = isFarmer ? farmerYoursLots : buyerYoursLots;
      if (targetLots.length > 0 && !targetLots.some(l => l.id === activeLotId)) {
        setActiveLotId(targetLots[0].id);
      }
    }
  }, [biddingFilter, lots.length]);

  const activeLot = lots.find(l => l.id === activeLotId) || displayedLots[0] || lots[0] || {};
  const highestBid = lotBids.length > 0
    ? Math.max(...lotBids.map(b => b.amount))
    : (activeLot.basePrice || activeLot.pricePerKg || 25);

  const isLotAccepted = activeLot.status === 'accepted';
  const winningBid = activeLot.acceptedBid || lotBids.find(b => b.status === 'accepted');

  // ── Authentic Countdown Timer Effect ──────────────────────────────────────
  useEffect(() => {
    if (!activeLot?.endTime) {
      setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, expired: false, formatted: '--:--:--' });
      return;
    }

    const calculateCountdown = () => {
      const targetTime = new Date(activeLot.endTime).getTime();
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeRemaining({
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
          formatted: '00h 00m 00s (Auction Ended)',
        });
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      const pad = (num) => String(num).padStart(2, '0');

      setTimeRemaining({
        hours: h,
        minutes: m,
        seconds: s,
        expired: false,
        formatted: `${pad(h)}h ${pad(m)}m ${pad(s)}s`,
      });
    };

    calculateCountdown();
    const timerInterval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(timerInterval);
  }, [activeLot?.endTime, activeLot?.id]);

  const isAuctionExpired = timeRemaining.expired || activeLot.status === 'closed';

  // ── BUYER: Handle Place Bid ───────────────────────────────────────────────
  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (isFarmer) {
      setPlacedMsg('❌ Farmers cannot place bids on lots. You can publish crops and accept buyer bids.');
      return;
    }
    if (isLotAccepted) {
      setPlacedMsg('❌ This auction is closed. The farmer has already accepted a winning bid.');
      return;
    }
    if (isAuctionExpired) {
      setPlacedMsg('⏱️ This auction has ended and is now closed for bidding.');
      return;
    }
    const numAmount = Number(bidAmount);
    if (!numAmount || numAmount <= 0) {
      setPlacedMsg('❌ Please enter a valid positive bid amount.');
      return;
    }
    if (numAmount <= highestBid) {
      setPlacedMsg(`❌ Your bid (₹${numAmount}/kg) must be strictly higher than current highest: ₹${highestBid}/kg`);
      return;
    }

    setPlacedMsg('⏳ Submitting your bid to live auction...');

    const res = await placeBidOnLot(activeLotId, {
      buyerName: (buyerName || user?.name || 'Verified Buyer').trim(),
      buyerPhone: user?.phone || '+91 87654 32109',
      amount: numAmount,
    });

    if (res.success) {
      setPlacedMsg(res.message || `🎉 Offer of ₹${numAmount}/kg placed successfully! You are the highest bidder.`);
      refreshBiddingData();
      setTimeout(() => setPlacedMsg(''), 6000);
    } else {
      setPlacedMsg(`❌ ${res.message}`);
    }
  };

  // ── FARMER: Handle Publish New Lot for Bidding ────────────────────────────
  const handlePublishBiddingSubmit = async (e) => {
    e.preventDefault();
    const cropName = formCrop === 'Custom' ? (formCustomCrop.trim() || 'Produce') : formCrop;
    const selectedPreset = cropPresetOptions.find(c => c.name === cropName);

    const newLot = {
      crop: cropName,
      quantity: Number(formQuantity) || 100,
      basePrice: Number(formBasePrice) || 30,
      grade: formGrade,
      quality: formGrade.startsWith('A') ? 'Export Premium' : 'Wholesale Grade',
      moisture: Number(formMoisture) || 12,
      farmer: user?.name || 'Farmer Ravi',
      farmerPhone: user?.phone || '+91 98765 43210',
      location: user?.location || 'Vizag',
      description: formDescription || `Fresh ${cropName} harvested directly in ${user?.location || 'Vizag'}. Available for live verified auction.`,
      imageUrl: resolveProduceImage(cropName, selectedPreset?.img),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    };

    const updated = await publishBiddingLot(newLot);
    setLots(updated);
    setActiveLotId(updated[0].id);
    setPublishModalOpen(false);
    setActionNotice(`🎉 ${newLot.crop} (${newLot.quantity} kg) published for live bidding! Buyers can now place offers.`);
    setTimeout(() => setActionNotice(''), 6000);
  };

  // ── FARMER: Handle Confirm Bid Acceptance ─────────────────────────────────
  const handleConfirmAcceptBid = async () => {
    if (!acceptDialogBid) return;
    setActionNotice('⏳ Finalizing accepted bid...');
    const res = await acceptBidForLot(activeLotId, acceptDialogBid.id);
    if (res.success) {
      setActionNotice(res.message);
      setAcceptDialogBid(null);
      refreshBiddingData();
    } else {
      alert(res.message || 'Could not accept bid.');
    }
  };

  // ── FARMER: Handle Reject Bid ─────────────────────────────────────────────
  const handleRejectBid = async (bid) => {
    if (window.confirm(`Decline offer of ₹${bid.amount}/kg from ${bid.buyer}? The buyer will be notified.`)) {
      const res = await rejectBidForLot(activeLotId, bid.id);
      if (res.success) {
        setActionNotice(res.message);
        refreshBiddingData();
        setTimeout(() => setActionNotice(''), 4500);
      } else {
        alert(res.message || 'Could not reject bid.');
      }
    }
  };

  // ── BUYER: Handle Open Edit Bid Modal ──────────────────────────────────────
  const handleOpenEditBid = (bid) => {
    setEditingBid(bid);
    setEditBidAmount(String(bid.amount));
    setEditBidModalOpen(true);
  };

  // ── BUYER: Handle Confirm Edit Bid ─────────────────────────────────────────
  const handleConfirmEditBid = (e) => {
    e.preventDefault();
    if (!editingBid) return;
    const res = editBidOnLot(activeLotId, editingBid.id, editBidAmount);
    if (res.success) {
      setActionNotice(res.message);
      setEditBidModalOpen(false);
      setEditingBid(null);
      refreshBiddingData();
      setTimeout(() => setActionNotice(''), 5000);
    } else {
      alert(res.message || 'Could not update bid.');
    }
  };

  // ── BUYER: Handle Cancel / Withdraw Bid ───────────────────────────────────
  const handleCancelBid = (bid) => {
    if (window.confirm(`Withdraw your offer of ₹${bid.amount}/kg? The farmer will be notified.`)) {
      const res = cancelBidOnLot(activeLotId, bid.id);
      if (res.success) {
        setActionNotice(res.message);
        refreshBiddingData();
        setTimeout(() => setActionNotice(''), 4500);
      } else {
        alert(res.message || 'Could not cancel bid.');
      }
    }
  };

  // ── SUPER ADMIN: Handle Remove Fraudulent Bid / Lot ─────────────────────
  const handleAdminDeleteBid = (bid) => {
    if (window.confirm(`[Super Admin] Delete fraudulent or wash bid of ₹${bid.amount}/kg from ${bid.buyer}?`)) {
      const res = removeFraudulentBid(bid.id, 'Fraudulent bid removed by Admin');
      if (res.success) {
        setActionNotice(`🚫 Fraudulent bid from ${bid.buyer} was removed.`);
        refreshBiddingData();
        setTimeout(() => setActionNotice(''), 4500);
      }
    }
  };

  const handleAdminDeleteLot = (lot) => {
    if (window.confirm(`[Super Admin] Permanently remove auction lot "${lot.crop}" (ID: ${lot.id}) and all its bids due to policy violation or fraud?`)) {
      const res = removeFraudulentListing(lot.id, 'Auction lot removed by Admin');
      if (res.success) {
        setActionNotice(`🚨 Auction lot "${lot.crop}" was removed.`);
        refreshBiddingData();
        setTimeout(() => setActionNotice(''), 4500);
      }
    }
  };

  return (
    <main style={{ paddingTop: 68, minHeight: '100vh', background: 'var(--color-cream)' }}>
      {/* Toast Notice */}
      {actionNotice && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1300,
          background: '#052E2B', color: '#FFFFFF',
          padding: '1.1rem 1.5rem', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.8rem',
          maxWidth: 500, border: '1px solid #10B981',
          animation: 'fadeIn 0.3s ease-in-out',
        }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <div style={{ fontSize: '0.92rem', lineHeight: 1.45 }}>{actionNotice}</div>
          <button
            onClick={() => setActionNotice('')}
            style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '1.1rem', marginLeft: 'auto' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <section style={{
        position: 'relative',
        backgroundImage: `linear-gradient(to bottom, rgba(5, 46, 43, 0.84), rgba(5, 46, 43, 0.94)), url('${biddingHeroImg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '3rem 0',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <span className="section-label" style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                  {isAdmin ? '🛡️ Super Admin Auction Supervision' : isFarmer ? '👨‍🌾 Farmer Auction Hub' : isBuyer ? '🏪 Buyer Live Bidding Room' : 'Live Agri Auction'}
                </span>
                <span style={{
                  background: isAdmin ? '#7C5CFF' : isFarmer ? 'rgba(76,175,80,0.2)' : '#F5A623',
                  color: isAdmin ? '#FFFFFF' : isFarmer ? '#A7F3D0' : '#1F2937',
                  padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700,
                }}>
                  {isAdmin ? 'Super Admin Mode' : isFarmer ? 'Farmer View: Manage & Accept' : isBuyer ? 'Buyer View: Bid & Compete' : 'Live Trading'}
                </span>
              </div>
              <h1 style={{ color: 'white', fontSize: '2.2rem', marginBottom: '0.5rem' }}>
                {isAdmin ? 'Super Admin Auction & Bidding Oversight' : isFarmer ? 'Manage Your Produce & Accept Bids' : 'Place Bids on Farmer Produce'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 650, margin: 0, fontSize: '0.92rem' }}>
                {isAdmin
                  ? 'Real-time surveillance of all active agricultural auctions, bidder verifications, fair-price compliance, and fraud moderation.'
                  : isFarmer
                  ? 'Publish your crops with base prices, inspect incoming bids from verified buyers, and accept the offer you like to finalize the deal.'
                  : 'Compete in real-time auctions on produce directly harvested by verified farmers across Andhra Pradesh & Telangana.'}
              </p>
            </div>

            {/* Top Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {isFarmer && (
                <button
                  id="farmer-publish-bidding-btn"
                  onClick={() => setPublishModalOpen(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: '#F5A623', color: '#1F2937', fontWeight: 700,
                    padding: '0.65rem 1.25rem', borderRadius: 8, border: 'none',
                    cursor: 'pointer', boxShadow: '0 4px 14px rgba(245,166,35,0.4)',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>🌱</span>
                  <span>+ Publish Bidding Produce</span>
                </button>
              )}
              <Link
                to="/marketplace"
                className="btn btn-secondary"
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)' }}
              >
                🏪 View Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section" style={{ paddingTop: '2rem' }}>
        <div className="container">
          {/* Role-Specific Filter Bar: All vs Yours */}
          {(isFarmer || isBuyer) && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#FFFFFF', padding: '0.85rem 1.25rem', borderRadius: 12,
              marginBottom: '1.5rem', border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>
                  Filter Bidding:
                </span>

                {/* 'All' option */}
                <button
                  id="bidding-filter-all-btn"
                  onClick={() => setBiddingFilter('all')}
                  style={{
                    padding: '0.45rem 1rem', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
                    cursor: 'pointer',
                    border: biddingFilter === 'all' ? '2px solid #052E2B' : '1px solid #D1D5DB',
                    background: biddingFilter === 'all' ? '#052E2B' : '#FFFFFF',
                    color: biddingFilter === 'all' ? '#FFFFFF' : '#374151',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: biddingFilter === 'all' ? '0 2px 8px rgba(5,46,43,0.2)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>🌐 All {isFarmer ? "Farmers' Lots" : "Auctions"}</span>
                  <span style={{
                    background: biddingFilter === 'all' ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                    color: biddingFilter === 'all' ? '#FFFFFF' : '#6B7280',
                    fontSize: '0.7rem', padding: '1px 7px', borderRadius: 10,
                  }}>
                    {lots.length}
                  </span>
                </button>

                {/* 'Yours' option */}
                <button
                  id="bidding-filter-yours-btn"
                  onClick={() => {
                    setBiddingFilter('yours');
                    const targetLots = isFarmer ? farmerYoursLots : buyerYoursLots;
                    if (targetLots.length > 0 && !targetLots.some(l => l.id === activeLotId)) {
                      setActiveLotId(targetLots[0].id);
                    }
                  }}
                  style={{
                    padding: '0.45rem 1rem', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
                    cursor: 'pointer',
                    border: biddingFilter === 'yours' ? '2px solid #052E2B' : '1px solid #D1D5DB',
                    background: biddingFilter === 'yours' ? '#052E2B' : '#FFFFFF',
                    color: biddingFilter === 'yours' ? '#FFFFFF' : '#374151',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: biddingFilter === 'yours' ? '0 2px 8px rgba(5,46,43,0.2)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{isFarmer ? "👨‍🌾 Yours (Your Crops)" : "🏷️ Yours (Your Bids)"}</span>
                  <span style={{
                    background: biddingFilter === 'yours' ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                    color: biddingFilter === 'yours' ? '#FFFFFF' : '#374151',
                    fontSize: '0.7rem', padding: '1px 7px', borderRadius: 10, fontWeight: 800,
                  }}>
                    {isFarmer ? farmerYoursLots.length : buyerYoursBids.length}
                  </span>
                </button>
              </div>

              {/* Filter Notice */}
              <div style={{ fontSize: '0.82rem', color: '#6B7280' }}>
                {biddingFilter === 'yours' ? (
                  isFarmer ? (
                    <span>Showing produce lots listed by you (<strong>{user?.name}</strong>)</span>
                  ) : (
                    <span>Showing bids submitted by you (<strong>{user?.name}</strong>)</span>
                  )
                ) : (
                  <span>Displaying live auction lots and bids from all farmers</span>
                )}
              </div>
            </div>
          )}

          {/* ── BUYER "YOURS" DASHBOARD ─────────────────────────────────────────── */}
          {isBuyer && biddingFilter === 'yours' && (
            <div style={{
              background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12,
              padding: '1.25rem 1.5rem', marginBottom: '1.75rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#052E2B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🏷️</span> Your Submitted Bids &amp; Active Offers
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#6B7280' }}>
                    Track all offers you placed across farmer auctions. Check whether you are the winning bidder or need to raise your offer.
                  </p>
                </div>
                <button
                  onClick={() => setBiddingFilter('all')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                >
                  Browse All Auctions ↗
                </button>
              </div>

              {buyerYoursBids.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#F9FAFB', borderRadius: 8 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏷️</div>
                  <div style={{ fontWeight: 700, color: '#1F2937', marginBottom: '0.25rem' }}>You have not submitted any bids yet</div>
                  <div style={{ fontSize: '0.84rem', color: '#6B7280', maxWidth: 450, margin: '0 auto 1.25rem' }}>
                    Explore the active auction lots from farmers below under <strong>"All Auctions"</strong>, select a crop, and submit your first offer!
                  </div>
                  <button
                    onClick={() => setBiddingFilter('all')}
                    className="btn btn-primary btn-sm"
                  >
                    View All Farmer Auctions
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {buyerYoursBids.map(bid => {
                    const lot = lots.find(l => l.id === bid.lotId) || { crop: 'Produce', quantity: 500, pricePerKg: bid.amount, farmer: 'Farmer' };
                    const thisLotBids = getBidsForLot(bid.lotId);
                    const currentHighest = thisLotBids.length > 0 ? Math.max(...thisLotBids.map(b => b.amount)) : lot.pricePerKg;
                    const isWon = bid.status === 'accepted' || (lot.status === 'accepted' && lot.acceptedBid?.id === bid.id);
                    const isHighest = bid.amount >= currentHighest && !isWon;
                    const isSelected = activeLotId === bid.lotId;

                    return (
                      <div
                        key={bid.id}
                        style={{
                          background: isSelected ? '#F0FDF4' : '#FAFAFA',
                          border: isSelected ? '2px solid #10B981' : '1px solid #E5E7EB',
                          borderRadius: 10, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#052E2B' }}>
                              {lot.crop} ({lot.quantity} kg)
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                              Farmer: <strong>{lot.farmer}</strong> · {lot.location || 'AP'}
                            </div>
                          </div>
                          <div>
                            {isWon ? (
                              <span style={{ background: '#10B981', color: 'white', fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, fontWeight: 800 }}>
                                🎉 Won Deal!
                              </span>
                            ) : isHighest ? (
                              <span style={{ background: '#052E2B', color: '#A7F3D0', fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, fontWeight: 800 }}>
                                👑 Highest Bidder
                              </span>
                            ) : (
                              <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, fontWeight: 800 }}>
                                ⚠️ Outbid (₹{currentHighest})
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{
                          background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8,
                          padding: '0.55rem 0.75rem', display: 'flex', justifyContent: 'space-between',
                          fontSize: '0.78rem',
                        }}>
                          <div>
                            <div style={{ color: '#6B7280' }}>Your Placed Offer</div>
                            <div style={{ fontWeight: 800, color: '#052E2B', fontSize: '0.95rem' }}>₹{bid.amount}/kg</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#6B7280' }}>Total Contract</div>
                            <div style={{ fontWeight: 800, color: '#1F2937' }}>₹{(bid.amount * (lot.quantity || 1)).toLocaleString('en-IN')}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button
                            onClick={() => setActiveLotId(bid.lotId)}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }}
                          >
                            {isSelected ? 'Viewing Below ↓' : 'View Auction ↗'}
                          </button>
                          {!isHighest && !isWon && (
                            <button
                              onClick={() => {
                                setActiveLotId(bid.lotId);
                                setBidAmount(String(currentHighest + 1));
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center', background: '#F5A623', borderColor: '#F5A623', color: '#1F2937' }}
                            >
                              Raise Bid (+₹1)
                            </button>
                          )}
                          {isWon && (
                            <Link
                              to="/logistics"
                              className="btn btn-primary btn-sm"
                              style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center', background: '#10B981', borderColor: '#10B981', color: 'white' }}
                            >
                              Logistics 🚛
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Active Lot Selector Tabs */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                {isFarmer
                  ? (biddingFilter === 'yours' ? 'Your Harvest Lots in Auction:' : 'Select Harvest Lot to Review Bids:')
                  : (biddingFilter === 'yours' ? 'Auctions You Have Bid On:' : 'Active Bidding Produce Lots:')}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Showing {displayedLots.length} lot(s)
              </span>
            </div>

            {displayedLots.length === 0 ? (
              <div style={{
                background: '#FFFFFF', padding: '1.5rem', borderRadius: 10,
                border: '1px solid #E5E7EB', textAlign: 'center', color: '#6B7280'
              }}>
                {isFarmer ? (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🌾</div>
                    <div style={{ fontWeight: 600, color: '#1F2937' }}>You haven't listed any produce for auction yet.</div>
                    <button
                      onClick={() => setPublishModalOpen(true)}
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '0.75rem' }}
                    >
                      + Publish Produce for Bidding
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🏷️</div>
                    <div style={{ fontWeight: 600, color: '#1F2937' }}>No bids placed yet under your account.</div>
                    <button
                      onClick={() => setBiddingFilter('all')}
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '0.75rem' }}
                    >
                      Browse All Auctions
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {displayedLots.map(lot => {
                  const isSelected = activeLotId === lot.id;
                  const isLotSold = lot.status === 'accepted';
                  const lotFarmerIsUser = isFarmer && isLotOwnedByFarmer(lot);
                  const buyerBidOnThis = isBuyer && buyerBidLotIds.includes(lot.id);

                  return (
                    <button
                      key={lot.id}
                      id={`lot-tab-${lot.id}`}
                      onClick={() => setActiveLotId(lot.id)}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: 8,
                        border: isSelected ? '2px solid #052E2B' : '1px solid #D1D5DB',
                        background: isSelected ? '#052E2B' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#1F2937',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.85rem',
                        boxShadow: isSelected ? '0 4px 12px rgba(5,46,43,0.15)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{lot.crop} ({lot.quantity} kg)</span>
                      {lotFarmerIsUser && (
                        <span style={{
                          background: isSelected ? 'rgba(255,255,255,0.2)' : '#ECFDF5',
                          color: isSelected ? '#A7F3D0' : '#065F46',
                          fontSize: '0.65rem', padding: '1px 6px', borderRadius: 10, fontWeight: 700,
                        }}>
                          Yours
                        </span>
                      )}
                      {buyerBidOnThis && (
                        <span style={{
                          background: isSelected ? '#F5A623' : '#FEF3C7',
                          color: isSelected ? '#1F2937' : '#B45309',
                          fontSize: '0.65rem', padding: '1px 6px', borderRadius: 10, fontWeight: 700,
                        }}>
                          Your Bid
                        </span>
                      )}
                      {isLotSold && (
                        <span style={{
                          background: '#10B981', color: 'white',
                          fontSize: '0.65rem', padding: '1px 6px', borderRadius: 10, fontWeight: 700,
                        }}>
                          ✓ Sold
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Deal Finalized Banner if accepted */}
          {isLotAccepted && winningBid && (
            <div style={{
              background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
              border: '2px solid #10B981', borderRadius: 12, padding: '1.25rem 1.5rem',
              marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#10B981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', color: 'white',
                }}>
                  🎉
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#065F46' }}>
                    Auction Finalized — Bid Accepted by Farmer!
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: 2 }}>
                    Winning Buyer: <strong>{winningBid.buyer}</strong> · Accepted Rate: <strong>₹{winningBid.amount}/kg</strong>
                    {' '}· Total Value: <strong>₹{(winningBid.amount * activeLot.quantity).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link
                  to="/logistics"
                  className="btn btn-primary btn-sm"
                  style={{ background: '#052E2B', borderColor: '#052E2B', color: 'white' }}
                >
                  🚛 Arrange Logistics
                </Link>
              </div>
            </div>
          )}

          {/* Grid: Left (Lot Details & Bid Form / Farmer Stats) + Right (Bids List & Acceptance) */}
          <div className="grid" style={{ gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem' }}>
            {/* ── LEFT COLUMN ────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Active Lot Details Card */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span className="badge badge-ai" style={{ fontSize: '0.72rem', marginBottom: '0.35rem' }}>
                      Lot ID: {activeLot.id}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#052E2B' }}>
                      {activeLot.crop} — {activeLot.quantity} kg
                    </h3>
                  </div>
                  <span className={`badge ${isLotAccepted ? 'badge-green' : isAuctionExpired ? 'badge-red' : 'badge-gold'}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                    {isLotAccepted ? '✅ Bid Accepted' : isAuctionExpired ? '🔒 Auction Closed' : '🟢 Live Bidding'}
                  </span>
                </div>

                {/* Live Functional Countdown Timer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.95rem',
                  background: isLotAccepted
                    ? '#ECFDF5'
                    : isAuctionExpired
                    ? '#FEF2F2'
                    : 'rgba(245, 166, 35, 0.08)',
                  border: `1.5px solid ${
                    isLotAccepted
                      ? '#10B981'
                      : isAuctionExpired
                      ? '#F87171'
                      : 'rgba(245, 166, 35, 0.35)'
                  }`,
                  borderRadius: 8,
                  marginBottom: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.1rem' }}>⏱️</span>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: isLotAccepted ? '#065F46' : isAuctionExpired ? '#DC2626' : '#92400E'
                    }}>
                      {isLotAccepted ? 'Auction Status: Deal Closed' : isAuctionExpired ? 'Auction Status: Expired' : 'Bidding Closes In:'}
                    </span>
                  </div>
                  <div id="bidding-timer-display" style={{
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    color: isLotAccepted ? '#065F46' : isAuctionExpired ? '#DC2626' : '#B45309',
                    letterSpacing: '0.04em',
                  }}>
                    {isLotAccepted ? '✓ SOLD' : isAuctionExpired ? '🔒 CLOSED' : timeRemaining.formatted}
                  </div>
                </div>

                {/* Specs List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    ['Farmer Producer', activeLot.farmer],
                    ['Farm Location', activeLot.location],
                    ['Quality Grade', `Grade ${activeLot.grade} (${activeLot.quality || 'Verified'})`],
                    ['Moisture Content', `${activeLot.moisture}%`],
                    ['Base Starting Price', `₹${activeLot.basePrice || activeLot.pricePerKg}/kg`],
                    ['AI Quality Confidence', `${activeLot.aiConfidence}%`],
                  ].map(([k, v]) => (
                    <div key={k} style={{
                      display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem',
                      padding: '0.35rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)',
                    }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                      <span style={{ fontWeight: 600, color: '#1F2937' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Highest Bid Summary Box */}
                <div style={{
                  marginTop: '1.25rem', padding: '1.15rem',
                  background: isLotAccepted
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,46,43,0.05))'
                    : 'linear-gradient(135deg, rgba(27,94,32,0.06), rgba(76,175,80,0.04))',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isLotAccepted ? 'rgba(16,185,129,0.3)' : 'rgba(76,175,80,0.2)'}`,
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                    {isLotAccepted ? 'Accepted Winning Offer' : 'Current Highest Bid'}
                  </div>
                  <div style={{
                    fontSize: '2.2rem', fontWeight: 900,
                    color: isLotAccepted ? '#065F46' : 'var(--color-forest)',
                    fontFamily: 'var(--font-heading)',
                  }}>
                    ₹{highestBid.toFixed(1)}<span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/kg</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: 4 }}>
                    Total Lot Valuation: <strong>₹{(highestBid * activeLot.quantity).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* ── CONDITIONAL: BUYER BID FORM vs FARMER MANAGEMENT CARD ── */}
              {isBuyer ? (
                /* BUYER FORM: Place Live Offer */
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>🏷️</span>
                    <h4 style={{ margin: 0 }}>Place Your Offer</h4>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    As a verified buyer, enter your bid per kg. The farmer can review and choose your bid to finalize.
                  </p>

                  {isLotAccepted || isAuctionExpired ? (
                    <div style={{
                      padding: '1.25rem', borderRadius: 8, background: '#F3F4F6',
                      border: '1px solid #E5E7EB', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.3rem' }}>🔒</div>
                      <div style={{ fontWeight: 800, color: '#374151', fontSize: '0.95rem' }}>
                        {isLotAccepted ? 'Bidding Closed — Offer Accepted by Farmer' : 'Bidding Closed — Auction Timer Ended'}
                      </div>
                      <p style={{ color: '#6B7280', fontSize: '0.82rem', margin: '4px 0 0' }}>
                        {isLotAccepted
                          ? `The farmer accepted the winning offer of ₹${highestBid}/kg. Select another active lot to place bids.`
                          : 'The countdown timer for this lot has reached zero. No further bids can be accepted.'}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handlePlaceBid} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                          Buyer Company / Name
                        </label>
                        <input
                          id="bidder-name-input"
                          type="text"
                          required
                          className="input"
                          style={{ width: '100%' }}
                          placeholder="Your company / name"
                          value={buyerName}
                          onChange={e => setBuyerName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                          Bid Amount per kg (₹) — Must be &gt; ₹{highestBid}/kg
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{
                            position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                            fontWeight: 700, color: 'var(--color-text-muted)',
                          }}>₹</span>
                          <input
                            id="bid-amount-input"
                            type="number"
                            step="0.5"
                            min={(highestBid + 0.5).toFixed(1)}
                            required
                            className="input"
                            style={{ width: '100%', paddingLeft: '1.85rem', fontWeight: 700, fontSize: '1.1rem' }}
                            placeholder={`Min: ${(highestBid + 0.5).toFixed(1)} /kg`}
                            value={bidAmount}
                            onChange={e => setBidAmount(e.target.value)}
                          />
                        </div>

                        {/* Quick increment chips & AI Recommendation */}
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {[1, 2, 5].map(inc => (
                            <button
                              key={inc}
                              type="button"
                              onClick={() => setBidAmount(String(+(highestBid + inc).toFixed(1)))}
                              style={{
                                background: '#F3F4F6', border: '1px solid #D1D5DB',
                                borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem',
                                fontWeight: 600, cursor: 'pointer', color: '#374151',
                              }}
                            >
                              +₹{inc}/kg
                            </button>
                          ))}
                          {aiBidRecommendation?.buyerRecommendation?.suggestedBidAmount && (
                            <button
                              type="button"
                              onClick={() => setBidAmount(String(aiBidRecommendation.buyerRecommendation.suggestedBidAmount))}
                              style={{
                                background: 'rgba(0,229,199,0.1)', border: '1px solid #00E5C7',
                                borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem',
                                fontWeight: 700, cursor: 'pointer', color: '#052E2B',
                                display: 'flex', alignItems: 'center', gap: '3px'
                              }}
                              title={aiBidRecommendation.buyerRecommendation.guidance}
                            >
                              <span>🤖 AI Suggested: ₹{aiBidRecommendation.buyerRecommendation.suggestedBidAmount}/kg</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Total deal estimate */}
                      <div style={{
                        background: '#F9FAFB', border: '1px solid #E5E7EB',
                        borderRadius: 8, padding: '0.65rem 0.85rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>Total Lot Value</span>
                        <span style={{ fontWeight: 800, color: '#052E2B', fontSize: '1.1rem' }}>
                          ₹{((Number(bidAmount) || 0) * activeLot.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <button
                        type="submit"
                        id="place-bid-btn"
                        className="btn btn-gold"
                        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontWeight: 700 }}
                      >
                        🏷️ Place Your Offer
                      </button>

                      {placedMsg && (
                        <div style={{
                          padding: '0.75rem', borderRadius: 'var(--radius-md)',
                          background: placedMsg.startsWith('🎉') || placedMsg.startsWith('✅') ? 'rgba(76,175,80,0.1)' : 'rgba(239,83,80,0.1)',
                          color: placedMsg.startsWith('🎉') || placedMsg.startsWith('✅') ? 'var(--color-success)' : 'var(--color-danger)',
                          fontSize: '0.85rem', fontWeight: 600,
                        }}>
                          {placedMsg}
                        </div>
                      )}
                    </form>
                  )}
                </div>
              ) : isFarmer ? (
                /* FARMER VIEW: Harvest Performance & Actions Card (No Bidding Form) */
                <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>👨‍🌾</span>
                    <h4 style={{ margin: 0 }}>Farmer Control Center</h4>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                    You have farmer privileges. You can publish your harvest produce and choose/accept the best buyer bid.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      id="farmer-open-publish-modal-btn"
                      onClick={() => setPublishModalOpen(true)}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', gap: '0.5rem' }}
                    >
                      <span>🌾</span>
                      <span>Publish New Harvest for Auction</span>
                    </button>

                    <div style={{
                      padding: '1rem', background: '#F8FAFC', borderRadius: 8,
                      border: '1px solid #E2E8F0', fontSize: '0.82rem',
                    }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                        💡 How to Accept Bids:
                      </div>
                      <div style={{ color: '#64748B', lineHeight: 1.45 }}>
                        Review the incoming offers in the <strong>Live Bids & Offers</strong> list on the right. Click the green <strong>"✅ Accept Bid"</strong> button next to the offer you like best to finalize the contract.
                      </div>
                    </div>
                  </div>
                </div>
              ) : isAdmin ? (
                /* SUPER ADMIN VIEW: Auction Supervision & Moderation Controls */
                <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1.5px solid #7C5CFF', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>🛡️</span>
                      <h4 style={{ margin: 0, color: '#7C5CFF' }}>Admin Auction Oversight</h4>
                    </div>
                    <span style={{ background: 'rgba(124,92,255,0.12)', color: '#7C5CFF', padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 800 }}>
                      SUPER ADMIN
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    You are monitoring the live auction for <strong>{activeLot.crop}</strong> (Lot ID: {activeLot.id}) published by <strong>{activeLot.farmer}</strong>. You have supervisor access to remove fraudulent listings or delete shill bids.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      id="admin-remove-auction-lot-btn"
                      type="button"
                      onClick={() => handleAdminDeleteLot(activeLot)}
                      style={{
                        padding: '0.75rem', borderRadius: 8,
                        background: '#FEF2F2', border: '1.5px solid #F87171',
                        color: '#DC2626', fontWeight: 700, fontSize: '0.85rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      title="Permanently remove this lot and cancel its bids"
                    >
                      <span>🚨</span>
                      <span>Remove Auction Lot (Fraud / Violation)</span>
                    </button>

                    <Link
                      to="/admin"
                      style={{
                        padding: '0.65rem', borderRadius: 8,
                        background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.3)',
                        color: '#7C5CFF', fontWeight: 700, fontSize: '0.85rem',
                        textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <span>⚙️</span>
                      <span>Manage from Admin Panel</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Guest View */
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <h4>Join the Auction</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    Login as a <strong>Buyer</strong> to place bids, or as a <strong>Farmer</strong> to publish harvest lots and accept bids.
                  </p>
                  <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
                    Login to Participate
                  </Link>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: STATUS TRACKER & BIDS LIST WITH ACCEPTANCE ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Lot Status Tracker */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0 }}>Auction & Lot Status</h4>
                  <span className="badge badge-ai" style={{ fontSize: '0.68rem' }}>
                    {isLotAccepted ? 'Stage 5: Deal Finalized' : 'Stage 4: Bidding Active'}
                  </span>
                </div>
                <StatusTracker stages={trackStages} isAccepted={isLotAccepted} />
              </div>

              {/* Bids List Card */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Live Bids & Offers</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {lotBids.length} buyer offers placed for {activeLot.crop}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse-ai 1.2s infinite' }} />
                    <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Active Stream</span>
                  </div>
                </div>

                {lotBids.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏷️</div>
                    <div>No offers placed yet for this lot.</div>
                    {isBuyer && <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Be the first buyer to place an offer!</div>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: 420, overflowY: 'auto' }}>
                    {lotBids.map((bid, i) => {
                      const isWinning = bid.status === 'accepted';
                      const isHighest = bid.status === 'highest' && !isLotAccepted;

                      return (
                        <div
                          key={bid.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)',
                            background: isWinning
                              ? '#ECFDF5'
                              : isHighest
                              ? 'rgba(76,175,80,0.08)'
                              : '#FAFAFA',
                            border: `1.5px solid ${isWinning ? '#10B981' : isHighest ? 'rgba(76,175,80,0.3)' : '#E5E7EB'}`,
                            flexWrap: 'wrap', gap: '0.75rem',
                          }}
                        >
                          {/* Buyer info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: isWinning ? '#10B981' : isHighest ? 'rgba(76,175,80,0.15)' : 'rgba(0,0,0,0.06)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.9rem', fontWeight: 800,
                              color: isWinning ? '#FFFFFF' : isHighest ? 'var(--color-forest)' : 'var(--color-text-muted)',
                            }}>
                              {isWinning ? '✓' : i + 1}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{bid.buyer}</span>
                                {isBuyer && isBidOwnedByBuyer(bid) && (
                                  <span style={{
                                    background: '#052E2B', color: '#A7F3D0',
                                    fontSize: '0.66rem', fontWeight: 800, padding: '1px 6px', borderRadius: 8,
                                  }}>
                                    👤 Your Bid
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                {bid.timestamp} · Total: ₹{(bid.amount * activeLot.quantity).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>

                          {/* Bid amount & Action button */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{
                                fontWeight: 800, fontSize: '1.1rem',
                                color: isWinning ? '#065F46' : isHighest ? 'var(--color-forest)' : '#374151',
                              }}>
                                ₹{bid.amount}/kg
                              </div>
                              {isWinning ? (
                                <span style={{
                                  background: '#10B981', color: 'white',
                                  fontSize: '0.65rem', padding: '1px 6px', borderRadius: 8, fontWeight: 700,
                                }}>
                                  🎉 Accepted Winner
                                </span>
                              ) : isHighest ? (
                                <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>👑 Highest</span>
                              ) : (
                                <span style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>Active Offer</span>
                              )}
                            </div>

                            {/* FARMER ACCEPT & DECLINE BID ACTIONS */}
                            {isFarmer && !isLotAccepted && (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  id={`accept-bid-btn-${bid.id}`}
                                  onClick={() => setAcceptDialogBid(bid)}
                                  style={{
                                    background: '#10B981', color: '#FFFFFF',
                                    border: 'none', borderRadius: 8,
                                    padding: '0.45rem 0.8rem', fontSize: '0.8rem',
                                    fontWeight: 700, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                    boxShadow: '0 2px 6px rgba(16,185,129,0.3)',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <span>✅</span>
                                  <span>Accept</span>
                                </button>
                                <button
                                  id={`reject-bid-btn-${bid.id}`}
                                  onClick={() => handleRejectBid(bid)}
                                  style={{
                                    background: '#FEF2F2', color: '#DC2626',
                                    border: '1px solid #F87171', borderRadius: 8,
                                    padding: '0.45rem 0.7rem', fontSize: '0.8rem',
                                    fontWeight: 700, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Decline this buyer offer"
                                >
                                  <span>✕</span>
                                  <span>Decline</span>
                                </button>
                              </div>
                            )}

                            {/* BUYER ACTIONS ON OWN ACTIVE BIDS */}
                            {isBuyer && isBidOwnedByBuyer(bid) && !isLotAccepted && bid.status !== 'accepted' && bid.status !== 'rejected' && bid.status !== 'cancelled' && (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  id={`edit-bid-btn-${bid.id}`}
                                  onClick={() => handleOpenEditBid(bid)}
                                  style={{
                                    background: '#F0FDF4', color: '#166534',
                                    border: '1px solid #BBF7D0', borderRadius: 8,
                                    padding: '0.45rem 0.75rem', fontSize: '0.78rem',
                                    fontWeight: 700, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Revise your bid amount"
                                >
                                  <span>✏️</span>
                                  <span>Edit</span>
                                </button>
                                <button
                                  id={`cancel-bid-btn-${bid.id}`}
                                  onClick={() => handleCancelBid(bid)}
                                  style={{
                                    background: '#FEF2F2', color: '#DC2626',
                                    border: '1px solid #FECACA', borderRadius: 8,
                                    padding: '0.45rem 0.65rem', fontSize: '0.78rem',
                                    fontWeight: 700, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Withdraw this offer"
                                >
                                  <span>✕</span>
                                  <span>Withdraw</span>
                                </button>
                              </div>
                            )}

                            {/* SUPER ADMIN MODERATION ON ANY BID */}
                            {isAdmin && !isLotAccepted && (
                              <button
                                id={`admin-del-bid-${bid.id}`}
                                onClick={() => handleAdminDeleteBid(bid)}
                                style={{
                                  background: '#FEF2F2', color: '#DC2626',
                                  border: '1.5px solid #F87171', borderRadius: 8,
                                  padding: '0.45rem 0.75rem', fontSize: '0.78rem',
                                  fontWeight: 700, cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Admin: Remove fraudulent or wash bid"
                              >
                                <span>🚫</span>
                                <span>Remove Fraud</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FARMER CONFIRM ACCEPT BID MODAL ──────────────────────────────── */}
      {acceptDialogBid && (
        <div
          id="accept-bid-modal-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 1350,
            background: 'rgba(5, 46, 43, 0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16,
            maxWidth: 480, width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            padding: '2rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🤝</div>
            <h3 style={{ fontSize: '1.4rem', color: '#052E2B', marginBottom: '0.5rem' }}>
              Accept Buyer Offer?
            </h3>
            <p style={{ color: '#4B5563', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Are you sure you want to accept the offer from <strong>{acceptDialogBid.buyer}</strong> for your <strong>{activeLot.crop}</strong> harvest?
            </p>

            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 12, padding: '1rem', marginBottom: '1.5rem',
              display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#166534' }}>Offer Rate</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065F46' }}>
                  ₹{acceptDialogBid.amount}/kg
                </div>
              </div>
              <div style={{ width: 1, height: 35, background: '#BBF7D0' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: '#166534' }}>Total Deal Amount</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065F46' }}>
                  ₹{(acceptDialogBid.amount * activeLot.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setAcceptDialogBid(null)}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button
                id="confirm-accept-bid-btn"
                onClick={handleConfirmAcceptBid}
                className="btn btn-primary"
                style={{
                  flex: 1.5, justifyContent: 'center',
                  background: '#10B981', borderColor: '#10B981',
                  color: 'white', fontWeight: 700,
                }}
              >
                ✅ Yes, Accept Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BUYER EDIT BID MODAL ─────────────────────────────────────────── */}
      {editBidModalOpen && editingBid && (
        <div
          id="edit-bid-modal-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 1350,
            background: 'rgba(5, 46, 43, 0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={e => { if (e.target.id === 'edit-bid-modal-backdrop') setEditBidModalOpen(false); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16,
            maxWidth: 440, width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            padding: '2rem', position: 'relative',
          }}>
            <button
              onClick={() => setEditBidModalOpen(false)}
              style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                background: '#F3F4F6', border: 'none', borderRadius: '50%',
                width: 32, height: 32, cursor: 'pointer',
              }}
            >✕</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>✏️</span>
              <h3 style={{ margin: 0, color: '#052E2B', fontSize: '1.3rem' }}>Revise Your Offer</h3>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Update your offer per kg for <strong>{activeLot.crop}</strong> ({activeLot.quantity} kg).
            </p>

            <form onSubmit={handleConfirmEditBid} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  New Bid Amount (₹/kg)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                    fontWeight: 700, color: 'var(--color-text-muted)',
                  }}>₹</span>
                  <input
                    id="edit-bid-amount-input"
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={editBidAmount}
                    onChange={e => setEditBidAmount(e.target.value)}
                    className="input"
                    style={{ width: '100%', paddingLeft: '1.85rem', fontWeight: 700, fontSize: '1.1rem' }}
                  />
                </div>
              </div>

              <div style={{
                background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8,
                padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.8rem', color: '#166534' }}>Revised Total Value</span>
                <span style={{ fontWeight: 800, color: '#065F46', fontSize: '1.1rem' }}>
                  ₹{((Number(editBidAmount) || 0) * activeLot.quantity).toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setEditBidModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  id="confirm-edit-bid-btn"
                  type="submit"
                  className="btn btn-gold"
                  style={{ flex: 1.5, justifyContent: 'center', fontWeight: 700 }}
                >
                  💾 Save Revised Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── FARMER PUBLISH BIDDING PRODUCE MODAL ─────────────────────────── */}
      {publishModalOpen && (
        <div
          id="farmer-publish-modal-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 1350,
            background: 'rgba(5, 46, 43, 0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={(e) => { if (e.target.id === 'farmer-publish-modal-backdrop') setPublishModalOpen(false); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16,
            maxWidth: 540, width: '100%', maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            padding: '2rem', position: 'relative',
          }}>
            <button
              id="close-farmer-publish-modal"
              onClick={() => setPublishModalOpen(false)}
              style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                background: '#F3F4F6', border: 'none', borderRadius: '50%',
                width: 32, height: 32, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', color: '#4B5563',
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🌾</span>
              <h2 style={{ fontSize: '1.4rem', color: '#052E2B', margin: 0 }}>
                Publish Harvest for Live Bidding
              </h2>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Publish your crops into the live auction pool. Buyers will place bids and you can choose the winning offer.
            </p>

            {/* Farmer profile badge */}
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Farmer</div>
                <div style={{ fontWeight: 700, color: '#052E2B', fontSize: '0.9rem' }}>👨‍🌾 {user?.name || 'Farmer Ravi'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Farm Location</div>
                <div style={{ fontWeight: 700, color: '#052E2B', fontSize: '0.9rem' }}>📍 {user?.location || 'Vizag'}</div>
              </div>
            </div>

            <form onSubmit={handlePublishBiddingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Crop Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Select Harvest Crop
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {cropPresetOptions.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setFormCrop(c.name);
                        setFormBasePrice(String(c.defaultPrice));
                      }}
                      style={{
                        padding: '0.5rem 0.25rem', borderRadius: 8,
                        border: formCrop === c.name ? '2px solid #052E2B' : '1px solid #E5E7EB',
                        background: formCrop === c.name ? '#ECFDF5' : '#F9FAFB',
                        color: formCrop === c.name ? '#052E2B' : '#4B5563',
                        fontWeight: formCrop === c.name ? 700 : 500,
                        fontSize: '0.78rem', cursor: 'pointer', textAlign: 'center',
                      }}
                    >
                      <div>{c.emoji}</div>
                      <div>{c.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity and Base Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    Quantity (kg) <span style={{ color: '#E53935' }}>*</span>
                  </label>
                  <input
                    id="bidding-quantity-input"
                    type="number"
                    min="50"
                    step="10"
                    required
                    value={formQuantity}
                    onChange={e => setFormQuantity(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    Base Starting Price (₹/kg) <span style={{ color: '#E53935' }}>*</span>
                  </label>
                  <input
                    id="bidding-base-price-input"
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={formBasePrice}
                    onChange={e => setFormBasePrice(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Grade and Moisture */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    Quality Grade
                  </label>
                  <select
                    value={formGrade}
                    onChange={e => setFormGrade(e.target.value)}
                    className="input select"
                    style={{ width: '100%' }}
                  >
                    <option value="A+">Grade A+ (Export)</option>
                    <option value="A">Grade A (Premium)</option>
                    <option value="B+">Grade B+ (Standard)</option>
                    <option value="B">Grade B (Wholesale)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    Moisture Content (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="25"
                    value={formMoisture}
                    onChange={e => setFormMoisture(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Estimated Base Total */}
              <div style={{
                background: '#F9FAFB', border: '1px solid #E5E7EB',
                borderRadius: 8, padding: '0.75rem 1rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Estimated Base Starting Total</span>
                <span style={{ fontWeight: 800, color: '#052E2B', fontSize: '1.15rem' }}>
                  ₹{((Number(formQuantity) || 0) * (Number(formBasePrice) || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-bidding-lot-btn"
                  className="btn btn-primary"
                  style={{
                    flex: 1.5, justifyContent: 'center', padding: '0.75rem',
                    background: '#F5A623', borderColor: '#F5A623', color: '#1F2937', fontWeight: 700,
                  }}
                >
                  🌾 Publish to Auction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
