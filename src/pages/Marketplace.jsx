import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getStoredListings, saveNewListing, updateProduceListing, removeCustomListing, removeListing } from '../utils/marketplaceStore';
import { placeBidOnLot, getBiddingLots, getBidsForLot, removeFraudulentBid, removeFraudulentListing, publishBiddingLot } from '../utils/biddingStore';
import { resolveProduceImage, PRESET_CROPS, getProduceMetadata } from '../utils/produceImageResolver';
import ProduceImageScanner from '../components/ProduceImageScanner';
import marketplaceHeroImg from '../assets/marketplace-hero.jpg';

const presetCrops = PRESET_CROPS.map(c => ({
  name: c.name,
  emoji: c.emoji,
  color: c.color,
  img: c.imageUrl,
  defaultPrice: c.defaultPrice,
}));

const cropEmoji = Object.fromEntries(PRESET_CROPS.map(c => [c.name, c.emoji]));
const cropColor = Object.fromEntries(PRESET_CROPS.map(c => [c.name, c.color]));

const gradeOptions = ['All', 'A+', 'A', 'B+', 'B'];

function CropCard({ lot, isFarmer, isBuyer, isAdmin, isYours, onBidClick, onViewLotClick, onAdminRemoveListing, onEditClick, onDeleteClick }) {
  const [imageError, setImageError] = useState(false);
  const color = cropColor[lot.crop] || '#2E7D32';
  const emoji = cropEmoji[lot.crop] || '🌾';
  const imgUrl = resolveProduceImage(lot.crop, lot.imageUrl);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Image */}
      <div style={{ position: 'relative', height: 165, overflow: 'hidden', background: `${color}15` }}>
        {!imageError ? (
          <img
            src={imgUrl}
            alt={lot.crop}
            onError={() => setImageError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
            {emoji}
          </div>
        )}

        {/* Grade badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          borderRadius: 20, padding: '3px 10px',
          fontSize: '0.72rem', fontWeight: 700, color: 'white',
        }}>
          Grade {lot.grade}
        </div>

        {/* Farmer Yours badge */}
        {isYours && (
          <div style={{
            position: 'absolute', top: 10, left: lot.grade ? 82 : 10,
            background: 'linear-gradient(135deg, #052E2B, #1B5E20)',
            border: '1.5px solid #10B981',
            borderRadius: 20, padding: '3px 9px',
            fontSize: '0.72rem', fontWeight: 800, color: '#A7F3D0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: '3px',
          }}>
            <span>👨‍🌾 Yours</span>
          </div>
        )}

        {/* AI Inspection Certificate Badge */}
        {lot.aiInspection && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(5, 46, 43, 0.92)', backdropFilter: 'blur(8px)',
            border: '1px solid #10B981',
            borderRadius: 14, padding: '3px 8px',
            fontSize: '0.68rem', fontWeight: 700, color: '#A7F3D0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <span>✨ AI Inspected</span>
          </div>
        )}

        {/* Newly published badge if applicable */}
        {lot.isNewlyPublished && (
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'linear-gradient(135deg, #052E2B, #1B5E20)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 14, padding: '2px 8px',
            fontSize: '0.68rem', fontWeight: 700, color: '#A7F3D0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            🌱 Farmer Published
          </div>
        )}

        {/* AI confidence */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(5,46,43,0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0,229,199,0.4)',
          borderRadius: 20, padding: '3px 10px',
          fontSize: '0.7rem', fontWeight: 700, color: '#00E5C7',
        }}>
          🤖 {lot.aiConfidence}% AI Score
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
              <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{lot.crop}</h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Farmer: <strong style={{ color: '#1F2937' }}>{lot.farmer}</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#052E2B', fontFamily: 'var(--font-heading)' }}>
              ₹{lot.pricePerKg}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>per kg</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <span className="chip" style={{ fontSize: '0.75rem' }}>📦 {lot.quantity} kg</span>
          <span className="chip" style={{ fontSize: '0.75rem' }}>📍 {lot.location}</span>
          <span className="chip" style={{ fontSize: '0.75rem' }}>💧 {lot.moisture}% moisture</span>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Quality Rating
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#052E2B' }}>
              {lot.quality || 'Verified'}
            </span>
          </div>
          <div className="progress-bar-track" style={{ marginBottom: '1rem' }}>
            <div className="progress-bar-fill progress-bar-fill--ai" style={{ width: `${lot.aiConfidence}%` }} />
          </div>

          {/* Action buttons: Farmer sees View Lot + (Edit & Delete if owned); Buyer sees View Lot + Bid */}
          {isFarmer ? (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                id={`view-lot-${lot.id}`}
                onClick={() => onViewLotClick && onViewLotClick(lot)}
                className="btn btn-primary"
                style={{ flex: isYours ? 1.4 : 1, justifyContent: 'center', padding: '0.55rem', fontSize: '0.85rem' }}
              >
                {isYours ? 'View Lot' : 'View Lot Details'}
              </button>
              {isYours && (
                <>
                  <button
                    id={`edit-lot-${lot.id}`}
                    type="button"
                    onClick={() => onEditClick && onEditClick(lot)}
                    style={{
                      padding: '0.45rem 0.75rem',
                      background: '#ECFDF5',
                      border: '1.5px solid #10B981',
                      borderRadius: 8,
                      color: '#065F46',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                    title="Edit price, quantity, location, or produce details"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    id={`delete-lot-${lot.id}`}
                    type="button"
                    onClick={() => onDeleteClick && onDeleteClick(lot)}
                    style={{
                      padding: '0.45rem 0.65rem',
                      background: '#FEF2F2',
                      border: '1.5px solid #F87171',
                      borderRadius: 8,
                      color: '#DC2626',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                    title="Delete your produce listing"
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                id={`view-lot-${lot.id}`}
                onClick={() => onViewLotClick && onViewLotClick(lot)}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center', padding: '0.5rem', fontSize: '0.85rem' }}
              >
                View Lot
              </button>
              <button
                id={`bid-${lot.id}`}
                onClick={() => onBidClick && onBidClick(lot)}
                className="btn btn-primary btn-sm"
                style={{
                  padding: '0.5rem 0.95rem',
                  fontSize: '0.85rem',
                  background: '#F5A623',
                  borderColor: '#F5A623',
                  color: '#1F2937',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>🏷️</span>
                <span>Bid</span>
              </button>
            </div>
          )}
          {/* Admin Fraud Removal Control */}
          {isAdmin && (
            <button
              id={`admin-remove-lot-${lot.id}`}
              type="button"
              onClick={() => onAdminRemoveListing && onAdminRemoveListing(lot)}
              style={{
                marginTop: '0.6rem',
                width: '100%',
                padding: '0.45rem 0.65rem',
                background: '#FEF2F2',
                border: '1.5px solid #F87171',
                borderRadius: 8,
                color: '#DC2626',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              title="Admin: Remove this fraudulent or suspicious listing"
            >
              <span>🚨</span>
              <span>Remove Fraudulent Listing</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { isLoggedIn, role, user } = useAuth();
  const locationHook = useLocation();
  const navigate = useNavigate();

  const isFarmer = isLoggedIn && role === 'farmer';
  const isBuyer  = isLoggedIn && role === 'buyer';
  const isAdmin  = isLoggedIn && role === 'admin';

  const [listings, setListings] = useState(getStoredListings);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // "Yours" filter for logged-in farmer
  const [showYoursOnly, setShowYoursOnly] = useState(false);

  // Publish Modal State
  const [publishOpen, setPublishOpen] = useState(false);
  const [buyerNoticeOpen, setBuyerNoticeOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Live Bidding Modal State (for Buyers)
  const [biddingModalOpen, setBiddingModalOpen] = useState(false);
  const [selectedLotForBid, setSelectedLotForBid] = useState(null);
  const [buyerBidAmount, setBuyerBidAmount] = useState('');
  const [buyerBidName, setBuyerBidName] = useState('');
  const [buyerBidFeedback, setBuyerBidFeedback] = useState('');

  // View Lot Modal State
  const [viewLotModalOpen, setViewLotModalOpen] = useState(false);
  const [selectedLotForView, setSelectedLotForView] = useState(null);

  // Form inputs for publishing produce
  const [formCrop, setFormCrop] = useState('Chilli');
  const [customCropName, setCustomCropName] = useState('');
  const [formQuantity, setFormQuantity] = useState('500');
  const [formPrice, setFormPrice] = useState('60');
  const [formGrade, setFormGrade] = useState('A');
  const [formMoisture, setFormMoisture] = useState('11');
  const [formImage, setFormImage] = useState('');
  const [formAiInspection, setFormAiInspection] = useState(null);

  // Edit Produce Modal State (for Farmers)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [editCrop, setEditCrop] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editGrade, setEditGrade] = useState('A');
  const [editMoisture, setEditMoisture] = useState('12');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState('');

  function handleOpenEditModal(lot) {
    setEditingLot(lot);
    setEditCrop(lot.crop || '');
    setEditQuantity(String(lot.quantity || ''));
    setEditPrice(String(lot.pricePerKg || lot.basePrice || ''));
    setEditLocation(lot.location || user?.location || 'Vizag');
    setEditGrade(lot.grade || 'A');
    setEditMoisture(String(lot.moisture || '12'));
    setEditDescription(lot.description || '');
    setEditImage(lot.imageUrl || '');
    setEditModalOpen(true);
  }

  function handleSaveEditProduce(e) {
    e.preventDefault();
    if (!editingLot) return;

    const numQty = Number(editQuantity);
    const numPrice = Number(editPrice);

    if (!numQty || numQty <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }
    if (!numPrice || numPrice <= 0) {
      alert('Please enter a valid price per kg.');
      return;
    }

    const updated = updateProduceListing(editingLot.id, {
      crop: editCrop.trim() || editingLot.crop,
      quantity: numQty,
      pricePerKg: numPrice,
      basePrice: numPrice,
      expectedPrice: numPrice,
      location: editLocation.trim() || editingLot.location,
      grade: editGrade,
      moisture: Number(editMoisture) || 12,
      description: editDescription.trim(),
      imageUrl: editImage || editingLot.imageUrl,
    });

    setListings(updated);
    setEditModalOpen(false);
    setSuccessToast(`🎉 Produce lot ${editCrop || editingLot.crop} (${numQty}kg at ₹${numPrice}/kg) updated successfully!`);
    setTimeout(() => setSuccessToast(''), 4500);
  }

  function handleDeleteProduce(lot) {
    if (window.confirm(`Are you sure you want to delete your ${lot.crop} lot (${lot.quantity}kg)? This action will remove it from the marketplace.`)) {
      const updated = removeCustomListing(lot.id);
      setListings(updated);
      setSuccessToast(`Produce lot ${lot.crop} was removed.`);
      setTimeout(() => setSuccessToast(''), 4000);
    }
  }

  // Listen for voice assistant event to open publish produce modal
  useEffect(() => {
    const handleVoicePublish = () => setPublishOpen(true);
    window.addEventListener('open_publish_produce_modal', handleVoicePublish);
    return () => window.removeEventListener('open_publish_produce_modal', handleVoicePublish);
  }, []);

  // Handle opening live bid modal for buyers
  function handleOpenBidModal(lot) {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (isFarmer) {
      return; // Farmers cannot bid
    }
    const lotBids = getBidsForLot(lot.id);
    const highest = lotBids.length > 0 ? Math.max(...lotBids.map(b => b.amount)) : (lot.pricePerKg || 25);
    const minBid = +(highest + 1).toFixed(1);
    setSelectedLotForBid(lot);
    setBuyerBidAmount(String(minBid));
    setBuyerBidName(user?.name || 'Verified Buyer');
    setBuyerBidFeedback('');
    setBiddingModalOpen(true);
  }

  // Handle submitting live bid from marketplace
  function handlePlaceBidSubmit(e) {
    e.preventDefault();
    if (!selectedLotForBid) return;
    const res = placeBidOnLot(selectedLotForBid.id, {
      buyerName: buyerBidName,
      buyerPhone: user?.phone || '+91 98765 00000',
      amount: Number(buyerBidAmount),
    });

    if (res.success) {
      setBuyerBidFeedback(res.message);
      setSuccessToast(`🎉 Offer of ₹${buyerBidAmount}/kg directly added to Bidding section! You are the highest bidder.`);
      setTimeout(() => {
        setBiddingModalOpen(false);
        setBuyerBidFeedback('');
      }, 1800);
    } else {
      setBuyerBidFeedback(res.message || '❌ Could not place bid.');
    }
  }

  // Admin fraud moderation handlers
  function handleAdminRemoveListing(lot) {
    if (!lot) return;
    const confirmed = window.confirm(`[Admin Moderation] Are you sure you want to remove the listing "${lot.crop}" (Lot #${lot.id}) from ${lot.farmer}? This will permanently remove it from the Marketplace and cancel all its bids.`);
    if (!confirmed) return;
    const res = removeFraudulentListing(lot.id, 'Fraudulent or suspicious listing flagged by Admin');
    if (res.success) {
      setListings(getStoredListings());
      setSuccessToast(res.message);
      if (selectedLotForView?.id === lot.id) setViewLotModalOpen(false);
      if (selectedLotForBid?.id === lot.id) setBiddingModalOpen(false);
    }
  }

  function handleAdminRemoveBid(bidId) {
    if (!bidId) return;
    const confirmed = window.confirm(`[Admin Moderation] Are you sure you want to delete this bid as fraudulent or suspicious?`);
    if (!confirmed) return;
    const res = removeFraudulentBid(bidId, 'Suspicious / wash bidding flagged by Admin');
    if (res.success) {
      setSuccessToast(res.message);
      setListings(getStoredListings());
    }
  }

  function handleOpenViewLotModal(lot) {
    setSelectedLotForView(lot);
    setViewLotModalOpen(true);
  }

  // Listen to cross-tab / cross-component storage updates
  useEffect(() => {
    function handleUpdate() {
      setListings(getStoredListings());
    }
    window.addEventListener('farmflow_listings_updated', handleUpdate);
    return () => window.removeEventListener('farmflow_listings_updated', handleUpdate);
  }, []);

  // Check query params if arriving with ?publish=true
  useEffect(() => {
    const params = new URLSearchParams(locationHook.search);
    if (params.get('publish') === 'true') {
      if (isFarmer) {
        setPublishOpen(true);
      } else if (isBuyer) {
        setBuyerNoticeOpen(true);
      } else {
        navigate('/login');
      }
    }
  }, [locationHook.search, isFarmer, isBuyer, navigate]);

  useEffect(() => {
    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        gsap.fromTo('.crop-card-animate', {
          opacity: 0, y: 30,
        }, {
          opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power3.out',
        });
      });
    });
  }, [selectedCrop, selectedLocation, selectedGrade, listings.length]);

  // Dynamic unique lists for filters
  const dynamicCrops = ['All', ...Array.from(new Set(listings.map(l => l.crop)))];
  const dynamicLocations = ['All', ...Array.from(new Set(listings.map(l => l.location)))];

  // Helper to determine if produce is listed by the logged-in farmer
  function isLotOwnedByFarmer(lot) {
    if (!isFarmer || !user) return false;
    if (lot.farmerId && user.uid && lot.farmerId === user.uid) return true;
    const cleanUser = (user.name || '').trim().toLowerCase();
    const cleanFarmer = (lot.farmer || lot.farmerName || '').trim().toLowerCase();
    const cleanPhone = (user?.phone || '').replace(/\D/g, '');
    const lotPhone = (lot.farmerPhone || '').replace(/\D/g, '');
    const phoneMatch = cleanPhone && lotPhone && cleanPhone.slice(-10) === lotPhone.slice(-10);
    return cleanFarmer === cleanUser || cleanFarmer.includes(cleanUser) || phoneMatch || Boolean(lot.isNewlyPublished);
  }

  const farmerYoursCount = listings.filter(isLotOwnedByFarmer).length;

  const filtered = listings.filter(lot => {
    const matchSearch = lot.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCrop     = selectedCrop === 'All' || lot.crop === selectedCrop;
    const matchLocation = selectedLocation === 'All' || lot.location === selectedLocation;
    const matchGrade    = selectedGrade === 'All' || lot.grade === selectedGrade;
    const matchYours    = !showYoursOnly || isLotOwnedByFarmer(lot);
    return matchSearch && matchCrop && matchLocation && matchGrade && matchYours;
  }).sort((a, b) => {
    if (sortBy === 'price-asc')  return a.pricePerKg - b.pricePerKg;
    if (sortBy === 'price-desc') return b.pricePerKg - a.pricePerKg;
    if (sortBy === 'ai-score')   return b.aiConfidence - a.aiConfidence;
    return new Date(b.postedDate) - new Date(a.postedDate);
  });

  // Handle publishing a new produce lot
  function handlePublishProduce(e) {
    e.preventDefault();
    if (!isFarmer) {
      setBuyerNoticeOpen(true);
      return;
    }

    const cropName = formCrop === 'Custom' ? (customCropName.trim() || 'Organic Veg') : formCrop;
    const qty = Number(formQuantity) || 100;
    const prc = Number(formPrice) || 30;
    const finalImage = resolveProduceImage(cropName, formImage);

    const newLot = {
      id: `LOT_${Date.now()}`,
      crop: cropName,
      quantity: qty,
      unit: 'kg',
      grade: formGrade,
      pricePerKg: prc,
      location: user?.location || 'Vizag',
      farmer: user?.name || 'Farmer Ravi',
      aiConfidence: formAiInspection ? formAiInspection.confidence : Math.floor(92 + Math.random() * 6),
      postedDate: new Date().toISOString().split('T')[0],
      quality: formGrade.startsWith('A') ? 'Premium' : 'Good',
      moisture: Number(formMoisture) || 11,
      isNewlyPublished: true,
      imageUrl: finalImage,
      aiInspection: formAiInspection || {
        grade: formGrade,
        confidence: 94,
        freshness: '95%',
        blemishFree: '98.0%',
        defectRate: '2.0%',
        inspectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        certificateId: `AGRI-AI-${Date.now().toString().slice(-6)}`,
      },
    };

    const updated = saveNewListing(newLot);
    // Directly sync with bidding store so this produce lot immediately appears in the Bidding Arena too!
    try {
      publishBiddingLot({
        ...newLot,
        basePrice: newLot.pricePerKg,
        farmerPhone: user?.phone || '+91 98765 43210',
      });
    } catch (syncErr) {
      console.warn('Could not sync to bidding lots:', syncErr);
    }

    setListings(updated);
    setPublishOpen(false);

    // Reset form values
    setCustomCropName('');
    setFormImage('');
    setFormAiInspection(null);
    setSuccessToast(`🎉 ${newLot.crop} (${newLot.quantity} kg at ₹${newLot.pricePerKg}/kg) published successfully with AI Quality Grade ${newLot.grade}! Available for all buyers.`);
    setTimeout(() => setSuccessToast(''), 6500);
  }

  return (
    <main style={{ paddingTop: 68, minHeight: '100vh', background: 'var(--color-cream)' }}>
      {/* Success Notification Toast */}
      {successToast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1200,
          background: '#052E2B', color: '#FFFFFF',
          padding: '1rem 1.4rem', borderRadius: 12,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '0.8rem',
          maxWidth: 480, border: '1px solid #10B981',
          animation: 'fadeIn 0.3s ease-in-out',
        }}>
          <span style={{ fontSize: '1.4rem' }}>✅</span>
          <div style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{successToast}</div>
          <button
            onClick={() => setSuccessToast('')}
            style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '1.1rem', marginLeft: 'auto' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Admin Moderation Banner */}
      {isAdmin && (
        <div style={{
          background: 'linear-gradient(135deg, #450A0A 0%, #7F1D1D 100%)',
          color: 'white', padding: '0.75rem 1.5rem',
          borderBottom: '2px solid #EF4444',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
          boxShadow: '0 4px 14px rgba(185,28,28,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                Admin Fraud Moderation Mode Active
              </div>
              <div style={{ fontSize: '0.78rem', color: '#FECACA' }}>
                As Admin ({user?.name || 'Administrator'}), you can remove any fraudulent or suspicious crop listing or delete fraudulent bids.
              </div>
            </div>
          </div>
          <Link
            to="/admin"
            style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: 'white', textDecoration: 'none', padding: '5px 14px', borderRadius: 6,
              fontSize: '0.8rem', fontWeight: 700,
            }}
          >
            Go to Admin Complaint &amp; Moderation Desk →
          </Link>
        </div>
      )}

      {/* Header */}
      <section style={{
        position: 'relative',
        backgroundImage: `linear-gradient(to bottom, rgba(5, 46, 43, 0.78), rgba(5, 46, 43, 0.92)), url('${marketplaceHeroImg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '3.5rem 0 3rem',
      }}>
        <div className="container">
          <span className="section-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Live Listings &amp; Direct Trade</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '2.4rem', marginBottom: '0.5rem' }}>Farmer Marketplace</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 620, margin: 0 }}>
                {listings.length} live produce lots available. Direct trade between verified farmers and buyers with AI-verified pricing.
              </p>
            </div>

            {/* Action buttons based on Role */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {isFarmer ? (
                <button
                  id="farmer-publish-produce-btn"
                  onClick={() => setPublishOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: '#F5A623', color: '#1F2937',
                    fontWeight: 700, fontSize: '0.92rem',
                    padding: '0.65rem 1.25rem', borderRadius: 8,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(245, 166, 35, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>🌾</span>
                  <span>+ Publish Your Produce</span>
                </button>
              ) : isBuyer ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#FFFFFF', padding: '0.5rem 0.9rem',
                    borderRadius: 20, fontSize: '0.82rem', fontWeight: 600,
                  }}>
                    <span>🏪 Buyer View: Active</span>
                  </div>
                  <button
                    id="buyer-publish-restriction-btn"
                    onClick={() => setBuyerNoticeOpen(true)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.9)',
                      padding: '0.5rem 0.85rem', borderRadius: 8,
                      fontSize: '0.82rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                    }}
                  >
                    <span>🔒 Publish Produce</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: '#F5A623', color: '#1F2937',
                    fontWeight: 700, fontSize: '0.9rem',
                    padding: '0.6rem 1.1rem', borderRadius: 8,
                    textDecoration: 'none',
                  }}
                >
                  <span>👨‍🌾 Farmer Login to Publish</span>
                </Link>
              )}

              <div className="badge badge-ai" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}>
                🤖 AI Price-Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section style={{ background: 'white', borderBottom: '1px solid rgba(27,94,32,0.08)', padding: '1.25rem 0', position: 'sticky', top: 68, zIndex: 100, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div className="search-bar" style={{ flex: '1 1 220px', minWidth: 200 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>🔍</span>
              <input
                id="marketplace-search"
                type="text"
                placeholder="Search crops, chillis, garlic, farmers, locations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter by Crop */}
            <select
              id="filter-crop"
              className="input select"
              style={{ width: 140 }}
              value={selectedCrop}
              onChange={e => setSelectedCrop(e.target.value)}
            >
              {dynamicCrops.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'Crop: All' : c}</option>
              ))}
            </select>

            {/* Filter by Location */}
            <select
              id="filter-location"
              className="input select"
              style={{ width: 140 }}
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
            >
              {dynamicLocations.map(l => (
                <option key={l} value={l}>{l === 'All' ? 'Location: All' : l}</option>
              ))}
            </select>

            {/* Filter by Grade */}
            <select
              id="filter-grade"
              className="input select"
              style={{ width: 120 }}
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
            >
              {gradeOptions.map(g => (
                <option key={g} value={g}>{g === 'All' ? 'Grade: All' : `Grade ${g}`}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              id="sort-listings"
              className="input select"
              style={{ width: 160 }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="ai-score">AI Score: Best First</option>
            </select>

            {/* Filter by Farmer's Own Produce ("Yours") */}
            {isFarmer && (
              <button
                id="filter-yours-btn"
                onClick={() => setShowYoursOnly(prev => !prev)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 20,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: showYoursOnly ? '2px solid #052E2B' : '1.5px solid #D1D5DB',
                  background: showYoursOnly ? '#052E2B' : '#FFFFFF',
                  color: showYoursOnly ? '#FFFFFF' : '#1F2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: showYoursOnly ? '0 2px 8px rgba(5,46,43,0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                title="Toggle showing only produce listed by you"
              >
                <span>👨‍🌾 Yours</span>
                <span style={{
                  background: showYoursOnly ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                  color: showYoursOnly ? '#FFFFFF' : '#374151',
                  fontSize: '0.72rem',
                  padding: '1px 7px',
                  borderRadius: 10,
                  fontWeight: 800,
                }}>
                  {farmerYoursCount}
                </span>
              </button>
            )}

            {/* Quick Publish produce button if Farmer */}
            {isFarmer && (
              <button
                id="filter-publish-btn"
                onClick={() => setPublishOpen(true)}
                style={{
                  marginLeft: 'auto',
                  background: '#052E2B', color: 'white',
                  border: 'none', padding: '0.55rem 1rem',
                  borderRadius: 8, fontSize: '0.84rem', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                <span>🌱 + Publish Produce</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="section" style={{ paddingTop: '2rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              {showYoursOnly
                ? `Showing produce listed by you (${user?.name || 'Farmer'}): ${filtered.length} lot(s)`
                : `Showing ${filtered.length} produce lots available for both buyers and farmers`}
            </p>
            {isFarmer && (
              <span style={{ fontSize: '0.8rem', color: '#052E2B', fontWeight: 600, background: '#ECFDF5', padding: '0.25rem 0.65rem', borderRadius: 12 }}>
                📍 Your Farm Location: {user?.location || 'Vizag'}
              </span>
            )}
          </div>

          {/* Active "Yours" filter banner */}
          {isFarmer && showYoursOnly && (
            <div style={{
              background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 12,
              padding: '0.85rem 1.25rem', marginBottom: '1.5rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
            }}>
              <div style={{ fontSize: '0.88rem', color: '#065F46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>👨‍🌾</span>
                <span>
                  Filtering active: Showing only produce listed by you (<strong>{user?.name || 'You'}</strong>). Total: <strong>{filtered.length}</strong> lot(s).
                </span>
              </div>
              <button
                id="clear-yours-filter-btn"
                onClick={() => setShowYoursOnly(false)}
                style={{
                  background: '#052E2B', color: 'white', border: 'none',
                  padding: '4px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                Show All Produce ✕
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', background: 'white', borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3>No produce lots found</h3>
              <p style={{ color: '#6B7280', marginBottom: '1.25rem' }}>Try adjusting your search terms or filters.</p>
              {isFarmer && (
                <button
                  onClick={() => setPublishOpen(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>🌾 Publish {searchTerm || 'New Produce'} Now</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-3">
              {filtered.map((lot, i) => (
                <div key={lot.id} className="crop-card-animate" style={{ animationDelay: `${i * 0.05}s` }}>
                  <CropCard
                    lot={lot}
                    isFarmer={isFarmer}
                    isBuyer={isBuyer}
                    isAdmin={isAdmin}
                    isYours={isFarmer && isLotOwnedByFarmer(lot)}
                    onBidClick={handleOpenBidModal}
                    onViewLotClick={handleOpenViewLotModal}
                    onAdminRemoveListing={handleAdminRemoveListing}
                    onEditClick={handleOpenEditModal}
                    onDeleteClick={handleDeleteProduce}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── FARMER PUBLISH PRODUCE MODAL ───────────────────────────────────── */}
      {publishOpen && (
        <div
          id="publish-produce-modal-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            background: 'rgba(5, 46, 43, 0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={(e) => { if (e.target.id === 'publish-produce-modal-backdrop') setPublishOpen(false); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16,
            maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            padding: '2rem', position: 'relative',
          }}>
            {/* Close Button */}
            <button
              id="close-publish-modal-btn"
              onClick={() => setPublishOpen(false)}
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

            {/* Modal Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🌾</span>
              <h2 style={{ fontSize: '1.5rem', color: '#052E2B', margin: 0 }}>Publish Your Farm Produce</h2>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Publish your freshly grown crops like chillis, garlic, and other vegetables. Your listing will appear for both buyers and farmers instantly.
            </p>

            {/* Farmer & Location Badge (Enforcing rule: farmer publishes according to their location) */}
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>
                  Publishing As Verified Farmer
                </div>
                <div style={{ fontWeight: 700, color: '#052E2B', fontSize: '0.95rem' }}>
                  👨‍🌾 {user?.name || 'Farmer Ravi'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>
                  Registered Farm Location
                </div>
                <div style={{ fontWeight: 700, color: '#052E2B', fontSize: '0.95rem' }}>
                  📍 {user?.location || 'Vizag'}
                </div>
              </div>
            </div>

            {/* Publish Form */}
            <form onSubmit={handlePublishProduce} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Vegetable / Produce Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                  Select Produce / Vegetable <span style={{ color: '#E53935' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  {presetCrops.map(c => {
                    const isSelected = formCrop === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        id={`select-crop-${c.name.toLowerCase()}`}
                        onClick={() => {
                          setFormCrop(c.name);
                          setFormPrice(String(c.defaultPrice));
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.5rem 0.65rem', borderRadius: 8,
                          border: isSelected ? '2px solid #052E2B' : '1px solid #E5E7EB',
                          background: isSelected ? '#ECFDF5' : '#F9FAFB',
                          color: isSelected ? '#052E2B' : '#4B5563',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.82rem', cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{c.emoji}</span>
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setFormCrop('Custom')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.5rem 0.65rem', borderRadius: 8,
                      border: formCrop === 'Custom' ? '2px solid #052E2B' : '1px solid #E5E7EB',
                      background: formCrop === 'Custom' ? '#ECFDF5' : '#F9FAFB',
                      color: formCrop === 'Custom' ? '#052E2B' : '#4B5563',
                      fontWeight: formCrop === 'Custom' ? 700 : 500,
                      fontSize: '0.82rem', cursor: 'pointer',
                    }}
                  >
                    <span>➕</span>
                    <span>Other...</span>
                  </button>
                </div>

                {formCrop === 'Custom' && (
                  <input
                    id="custom-crop-name-input"
                    type="text"
                    required
                    placeholder="Enter crop/vegetable name (e.g. Green Chillies, Garlic, Drumsticks...)"
                    value={customCropName}
                    onChange={e => setCustomCropName(e.target.value)}
                    className="input"
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  />
                )}
              </div>

              {/* Produce Photo & AI Image Quality Detection */}
              <ProduceImageScanner
                selectedCrop={formCrop === 'Custom' ? customCropName : formCrop}
                currentImage={formImage}
                onImageSelected={(url) => setFormImage(url)}
                onApplyAnalysis={(analysis) => {
                  setFormImage(analysis.imageUrl);
                  setFormGrade(analysis.grade);
                  setFormMoisture(String(analysis.moisture));
                  setFormPrice(String(analysis.recommendedPrice));
                  setFormAiInspection(analysis);
                }}
              />

              {formImage && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.6rem 0.85rem', background: '#ECFDF5', border: '1px solid #10B981',
                  borderRadius: 8, fontSize: '0.8rem', color: '#065F46', fontWeight: 600
                }}>
                  <span>📸</span>
                  <span>Produce Photo Attached: Your exact uploaded image will be shown on this produce lot in the Marketplace.</span>
                </div>
              )}

              {/* Quantity and Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                    Available Quantity (kg) <span style={{ color: '#E53935' }}>*</span>
                  </label>
                  <input
                    id="produce-quantity-input"
                    type="number"
                    min="10"
                    step="10"
                    required
                    value={formQuantity}
                    onChange={e => setFormQuantity(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. 500"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                    Price Per kg (₹) <span style={{ color: '#E53935' }}>*</span>
                  </label>
                  <input
                    id="produce-price-input"
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. 60"
                  />
                </div>
              </div>

              {/* Quality Grade and Moisture */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                    Quality Grade
                  </label>
                  <select
                    id="produce-grade-select"
                    value={formGrade}
                    onChange={e => setFormGrade(e.target.value)}
                    className="input select"
                    style={{ width: '100%' }}
                  >
                    <option value="A+">Grade A+ (Export Quality)</option>
                    <option value="A">Grade A (Premium Quality)</option>
                    <option value="B+">Grade B+ (Good Quality)</option>
                    <option value="B">Grade B (Standard Wholesale)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                    Moisture Content (%)
                  </label>
                  <input
                    id="produce-moisture-input"
                    type="number"
                    min="1"
                    max="30"
                    value={formMoisture}
                    onChange={e => setFormMoisture(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Total Estimated Lot Value Preview */}
              <div style={{
                background: '#F9FAFB', border: '1px solid #E5E7EB',
                borderRadius: 10, padding: '0.85rem 1rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Estimated Total Lot Revenue</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#052E2B' }}>
                    ₹{((Number(formQuantity) || 0) * (Number(formPrice) || 0)).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-ai" style={{ fontSize: '0.72rem' }}>
                    🤖 AI Fair Price Verified
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPublishOpen(false)}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: 8,
                    background: '#F3F4F6', border: '1px solid #E5E7EB',
                    fontWeight: 600, color: '#4B5563', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  id="confirm-publish-produce-btn"
                  type="submit"
                  style={{
                    flex: 2, padding: '0.75rem', borderRadius: 8,
                    background: '#052E2B', color: 'white',
                    fontWeight: 700, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(5, 46, 43, 0.3)',
                  }}
                >
                  <span>🚀 Publish to Marketplace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── FARMER EDIT PRODUCE MODAL ─────────────────────────────────────── */}
      {editModalOpen && editingLot && (
        <div
          id="edit-produce-modal-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            background: 'rgba(5, 46, 43, 0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={(e) => { if (e.target.id === 'edit-produce-modal-backdrop') setEditModalOpen(false); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16,
            maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            padding: '2rem', position: 'relative',
          }}>
            {/* Close Button */}
            <button
              id="close-edit-modal-btn"
              onClick={() => setEditModalOpen(false)}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>✏️</span>
              <h2 style={{ fontSize: '1.4rem', color: '#052E2B', margin: 0 }}>Edit Produce Lot Details</h2>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Update your quantity, expected price per kg, farm location, or grade. Changes will update in real-time across the marketplace.
            </p>

            <form onSubmit={handleSaveEditProduce} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Crop Name
                </label>
                <input
                  type="text"
                  required
                  value={editCrop}
                  onChange={e => setEditCrop(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                    Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editQuantity}
                    onChange={e => setEditQuantity(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                    Expected Price / kg (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                    Farm / Mandi Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                    Quality Grade
                  </label>
                  <select
                    value={editGrade}
                    onChange={e => setEditGrade(e.target.value)}
                    className="input select"
                    style={{ width: '100%' }}
                  >
                    <option value="A+">Grade A+ (Export Quality)</option>
                    <option value="A">Grade A (Premium)</option>
                    <option value="B+">Grade B+ (Good)</option>
                    <option value="B">Grade B (Standard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Description / Harvest Notes
                </label>
                <textarea
                  rows="3"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="input"
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Describe produce freshness, packing, harvest date..."
                />
              </div>

              {/* Total Estimated Lot Value */}
              <div style={{
                background: '#F9FAFB', border: '1px solid #E5E7EB',
                borderRadius: 10, padding: '0.75rem 1rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Estimated Lot Total:</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#052E2B' }}>
                  ₹{((Number(editQuantity) || 0) * (Number(editPrice) || 0)).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: 8,
                    background: '#F3F4F6', border: '1px solid #E5E7EB',
                    fontWeight: 600, color: '#4B5563', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  id="confirm-save-edit-produce-btn"
                  type="submit"
                  style={{
                    flex: 2, padding: '0.75rem', borderRadius: 8,
                    background: '#052E2B', color: 'white',
                    fontWeight: 700, border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 46, 43, 0.3)',
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── BUYER PUBLISH RESTRICTION NOTICE MODAL ───────────────────────── */}
      {buyerNoticeOpen && (
        <div
          id="buyer-notice-modal-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            background: 'rgba(5, 46, 43, 0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={(e) => { if (e.target.id === 'buyer-notice-modal-backdrop') setBuyerNoticeOpen(false); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16,
            maxWidth: 480, width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            padding: '2rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔒</div>
            <h3 style={{ fontSize: '1.4rem', color: '#052E2B', marginBottom: '0.5rem' }}>
              Farmer-Only Publishing Access
            </h3>
            <p style={{ color: '#4B5563', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Only registered <strong>Farmers</strong> have access to publish their grown crops and vegetables with prices and quantities based on their farm location.
              <br /><br />
              As a <strong>Buyer</strong> ({user?.name || 'Active Buyer'}), you have full access to explore, place bids, and buy verified lots directly from farmers across all locations!
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setBuyerNoticeOpen(false)}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.4rem' }}
              >
                Got It, Continue Browsing
              </button>
              <Link
                to="/login"
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.2rem', textDecoration: 'none' }}
              >
                Switch to Farmer Account
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* ─── BUYER LIVE BIDDING MODAL ─────────────────────────────────────── */}
      {biddingModalOpen && selectedLotForBid && (
        <div
          id="marketplace-bid-modal-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 1250,
            background: 'rgba(5, 46, 43, 0.7)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={(e) => { if (e.target.id === 'marketplace-bid-modal-backdrop') setBiddingModalOpen(false); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16,
            maxWidth: 520, width: '100%', maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            padding: '2rem', position: 'relative',
          }}>
            <button
              id="close-bid-modal-btn"
              onClick={() => setBiddingModalOpen(false)}
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

            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🏷️</span>
              <h2 style={{ fontSize: '1.4rem', color: '#052E2B', margin: 0 }}>
                Place Live Bid — {selectedLotForBid.crop}
              </h2>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Submit your direct offer to the farmer. The farmer can review and choose your bid to finalize the trade.
            </p>

            {/* Produce Summary Card */}
            <div style={{
              background: '#F8FAFC', border: '1px solid #E2E8F0',
              borderRadius: 12, padding: '1rem', marginBottom: '1.25rem',
              display: 'flex', gap: '1rem', alignItems: 'center',
            }}>
              <div style={{
                width: 70, height: 70, borderRadius: 10, overflow: 'hidden',
                background: '#ECFDF5', flexShrink: 0,
              }}>
                <img
                  src={resolveProduceImage(selectedLotForBid.crop, selectedLotForBid.imageUrl)}
                  alt={selectedLotForBid.crop}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
                  {selectedLotForBid.crop} ({selectedLotForBid.quantity} kg)
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: 2 }}>
                  <span>👨‍🌾 {selectedLotForBid.farmer}</span>
                  <span>📍 {selectedLotForBid.location}</span>
                  <span>⭐ Grade {selectedLotForBid.grade}</span>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#052E2B', marginTop: 4 }}>
                  Base Asking Price: ₹{selectedLotForBid.pricePerKg}/kg
                </div>
              </div>
            </div>

            {/* Bid Form */}
            <form onSubmit={handlePlaceBidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Buyer Company / Your Name
                </label>
                <input
                  id="bid-buyer-name-input"
                  type="text"
                  required
                  value={buyerBidName}
                  onChange={e => setBuyerBidName(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Srinivas Agro Trading Co."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Your Offer Per kg (₹)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                    fontWeight: 700, color: '#64748B',
                  }}>₹</span>
                  <input
                    id="bid-amount-modal-input"
                    type="number"
                    step="0.5"
                    min={(selectedLotForBid.pricePerKg || 20)}
                    required
                    value={buyerBidAmount}
                    onChange={e => setBuyerBidAmount(e.target.value)}
                    className="input"
                    style={{ width: '100%', paddingLeft: '1.85rem', fontSize: '1.15rem', fontWeight: 700 }}
                  />
                </div>

                {/* Quick Add Chips */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Quick Increase:</span>
                  {[1, 2, 5].map(inc => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => {
                        const currentVal = Number(buyerBidAmount) || selectedLotForBid.pricePerKg || 25;
                        setBuyerBidAmount(String(currentVal + inc));
                      }}
                      style={{
                        background: '#F1F5F9', border: '1px solid #CBD5E1',
                        borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem',
                        fontWeight: 600, cursor: 'pointer', color: '#334155',
                      }}
                    >
                      +₹{inc}/kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(27,94,32,0.06))',
                border: '1px solid rgba(245,166,35,0.25)',
                borderRadius: 10, padding: '0.85rem 1rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Total Calculated Lot Offer</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#052E2B', fontFamily: 'var(--font-heading)' }}>
                    ₹{((Number(buyerBidAmount) || 0) * selectedLotForBid.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748B' }}>
                  Quantity: <strong>{selectedLotForBid.quantity} kg</strong>
                </div>
              </div>

              {buyerBidFeedback && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: 8,
                  background: buyerBidFeedback.startsWith('🎉') || buyerBidFeedback.startsWith('✅') ? '#ECFDF5' : '#FEF2F2',
                  color: buyerBidFeedback.startsWith('🎉') || buyerBidFeedback.startsWith('✅') ? '#065F46' : '#991B1B',
                  border: `1px solid ${buyerBidFeedback.startsWith('🎉') || buyerBidFeedback.startsWith('✅') ? '#A7F3D0' : '#FECACA'}`,
                  fontSize: '0.85rem', fontWeight: 600,
                }}>
                  {buyerBidFeedback}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  id="submit-buyer-bid-btn"
                  className="btn btn-primary"
                  style={{
                    flex: 1.5, justifyContent: 'center', padding: '0.75rem',
                    background: '#F5A623', borderColor: '#F5A623', color: '#1F2937',
                    fontWeight: 700, fontSize: '0.95rem',
                  }}
                >
                  🏷️ Submit Offer Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBiddingModalOpen(false);
                    navigate(`/bidding?lotId=${selectedLotForBid.id}`);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', padding: '0.75rem', fontSize: '0.85rem' }}
                >
                  Bidding Arena ↗
                </button>
              </div>
            </form>

            {/* Admin Live Bids Fraud Moderation Section */}
            {isAdmin && (
              <div style={{
                marginTop: '1.25rem', paddingTop: '1rem',
                borderTop: '1.5px solid #FEE2E2',
                background: '#FFF5F5', borderRadius: 10, padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🛡️</span> Admin Bidding Fraud Watch
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdminRemoveListing(selectedLotForBid)}
                    style={{
                      background: '#DC2626', color: 'white', border: 'none',
                      borderRadius: 6, padding: '3px 9px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    🚨 Remove Entire Listing
                  </button>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '0.5rem' }}>
                  Inspect and remove suspicious bids or shilling on this lot:
                </div>
                {getBidsForLot(selectedLotForBid.id).length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#9CA3AF', fontStyle: 'italic' }}>No active bids on this lot yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {getBidsForLot(selectedLotForBid.id).map(b => (
                      <div key={b.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'white', border: '1px solid #FECACA', borderRadius: 8, padding: '0.5rem 0.75rem',
                      }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#1F2937' }}>{b.buyer}</strong>
                          <span style={{ fontSize: '0.78rem', color: '#052E2B', fontWeight: 700, marginLeft: 8 }}>₹{b.amount}/kg</span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B', marginLeft: 8 }}>({b.status})</span>
                        </div>
                        <button
                          type="button"
                          id={`admin-remove-bid-${b.id}`}
                          onClick={() => handleAdminRemoveBid(b.id)}
                          style={{
                            background: '#FEE2E2', border: '1px solid #F87171', color: '#B91C1C',
                            borderRadius: 6, padding: '3px 8px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          🚫 Remove Fraudulent Bid
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── VIEW LOT DETAILS MODAL ────────────────────────────────────────── */}
      {viewLotModalOpen && selectedLotForView && (
        <div
          id="view-lot-modal-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 1250,
            background: 'rgba(5, 46, 43, 0.7)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={(e) => { if (e.target.id === 'view-lot-modal-backdrop') setViewLotModalOpen(false); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16,
            maxWidth: 580, width: '100%', maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            padding: '2rem', position: 'relative',
          }}>
            <button
              onClick={() => setViewLotModalOpen(false)}
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

            {/* Produce Header */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: 90, height: 90, borderRadius: 12, overflow: 'hidden',
                background: '#ECFDF5', flexShrink: 0,
              }}>
                <img
                  src={resolveProduceImage(selectedLotForView.crop, selectedLotForView.imageUrl)}
                  alt={selectedLotForView.crop}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 4 }}>
                  <span className="badge badge-ai" style={{ fontSize: '0.7rem' }}>Grade {selectedLotForView.grade}</span>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>🤖 {selectedLotForView.aiConfidence}% AI Score</span>
                  {selectedLotForView.aiInspection && (
                    <span className="badge badge-leaf" style={{ fontSize: '0.7rem', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                      ✨ AI Quality Inspected
                    </span>
                  )}
                </div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#052E2B' }}>{selectedLotForView.crop}</h2>
                <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 2 }}>
                  Offered by <strong>{selectedLotForView.farmer}</strong> · 📍 {selectedLotForView.location}
                </div>
              </div>
            </div>

            {/* AI Quality Inspection Card if present */}
            {selectedLotForView.aiInspection && (
              <div style={{
                background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12, padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔬</span>
                    <span>AI Produce Quality Scan Report</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#15803D', fontWeight: 600 }}>
                    {selectedLotForView.aiInspection.certificateId || 'Verified Inspection'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  <div style={{ background: '#FFFFFF', padding: '0.4rem', borderRadius: 6, border: '1px solid #DCFCE7' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Freshness</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#15803D' }}>
                      {selectedLotForView.aiInspection.freshness || '96%'}
                    </div>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '0.4rem', borderRadius: 6, border: '1px solid #DCFCE7' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Blemish-Free</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0284C7' }}>
                      {selectedLotForView.aiInspection.blemishFree || '98.5%'}
                    </div>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '0.4rem', borderRadius: 6, border: '1px solid #DCFCE7' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Defect Rate</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#D97706' }}>
                      {selectedLotForView.aiInspection.defectRate || '1.5%'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Specs Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem',
              background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1rem',
              marginBottom: '1.5rem',
            }}>
              {[
                ['Available Quantity', `${selectedLotForView.quantity} kg`],
                ['Price per kg', `₹${selectedLotForView.pricePerKg}/kg`],
                ['Estimated Lot Total', `₹${(selectedLotForView.pricePerKg * selectedLotForView.quantity).toLocaleString('en-IN')}`],
                ['Moisture Content', `${selectedLotForView.moisture}%`],
                ['Quality Certification', selectedLotForView.quality || 'Verified Grade A'],
                ['Posted Date', selectedLotForView.postedDate || 'Recent'],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '0.35rem 0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{k}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setViewLotModalOpen(false)}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Close Details
              </button>
              {isBuyer && (
                <button
                  onClick={() => {
                    setViewLotModalOpen(false);
                    handleOpenBidModal(selectedLotForView);
                  }}
                  className="btn btn-primary"
                  style={{
                    flex: 1.5, justifyContent: 'center',
                    background: '#F5A623', borderColor: '#F5A623', color: '#1F2937', fontWeight: 700,
                  }}
                >
                  🏷️ Place a Bid on this Produce
                </button>
              )}
              {isAdmin && (
                <button
                  id="admin-modal-remove-listing-btn"
                  onClick={() => handleAdminRemoveListing(selectedLotForView)}
                  className="btn"
                  style={{
                    flex: 1.5, justifyContent: 'center',
                    background: '#DC2626', color: 'white', fontWeight: 700,
                    border: 'none',
                  }}
                >
                  🚨 Remove Listing (Fraud)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
