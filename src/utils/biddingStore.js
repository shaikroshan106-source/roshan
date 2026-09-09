import { mockListings, mockBids } from '../data/mockAI';

const LOTS_STORAGE_KEY = 'farmflow_bidding_lots';
const BIDS_STORAGE_KEY = 'farmflow_bidding_bids';

// Initial seed lots tailored for bidding
const initialBiddingLots = [
  {
    id: 'L001',
    crop: 'Tomato',
    quantity: 500,
    unit: 'kg',
    grade: 'A',
    quality: 'Premium Grade',
    moisture: 12,
    basePrice: 26,
    pricePerKg: 29.0,
    farmer: 'Ravi Kumar',
    farmerPhone: '+91 98765 43210',
    location: 'Vizag',
    aiConfidence: 94,
    status: 'open', // 'open' | 'accepted' | 'closed'
    acceptedBid: null,
    imageUrl: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=75',
    description: 'Freshly harvested vine tomatoes from Anandapuram, Vizag. Grade A quality, sorted and packed in 25kg crates.',
    postedDate: '2026-09-02',
    endTime: '2026-09-06T18:00:00Z',
  },
  {
    id: 'L002',
    crop: 'Rice',
    quantity: 2000,
    unit: 'kg',
    grade: 'B+',
    quality: 'Good Quality',
    moisture: 14,
    basePrice: 30,
    pricePerKg: 33.0,
    farmer: 'Lakshmi Devi',
    farmerPhone: '+91 98480 12345',
    location: 'Guntur',
    aiConfidence: 87,
    status: 'open',
    acceptedBid: null,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e8c7?w=400&q=75',
    description: 'Sona Masoori raw paddy directly from Guntur delta farms. Excellent grain length and moisture under 14%.',
    postedDate: '2026-09-03',
    endTime: '2026-09-07T12:00:00Z',
  },
  {
    id: 'L003',
    crop: 'Chilli',
    quantity: 800,
    unit: 'kg',
    grade: 'A+',
    quality: 'Export Grade',
    moisture: 10,
    basePrice: 58,
    pricePerKg: 64.0,
    farmer: 'Ravi Kumar',
    farmerPhone: '+91 98765 43210',
    location: 'Vizag',
    aiConfidence: 96,
    status: 'open',
    acceptedBid: null,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    description: 'Deep red Guntur sannam variety chillies. High pungency, sun-dried, verified free of chemical residues.',
    postedDate: '2026-09-04',
    endTime: '2026-09-08T20:00:00Z',
  },
  {
    id: 'L004',
    crop: 'Cotton',
    quantity: 1500,
    unit: 'kg',
    grade: 'A',
    quality: 'Premium Long Staple',
    moisture: 8,
    basePrice: 65,
    pricePerKg: 70.0,
    farmer: 'Pavan Reddy',
    farmerPhone: '+91 94401 56789',
    location: 'Rajahmundry',
    aiConfidence: 91,
    status: 'open',
    acceptedBid: null,
    imageUrl: 'https://images.unsplash.com/photo-1605000797498-6f2145b1d820?w=400&q=75',
    description: 'Clean medium-long staple cotton harvested this week in Godavari belt. Moisture certified at 8%.',
    postedDate: '2026-09-01',
    endTime: '2026-09-06T15:00:00Z',
  }
];

const initialSeedBids = [
  { id: 'BID_001', lotId: 'L001', buyer: 'Krishna Fresh Foods', buyerPhone: '+91 98490 22334', amount: 27.5, timestamp: '10:32 AM', status: 'active' },
  { id: 'BID_002', lotId: 'L001', buyer: 'Coastal Agri Hub', buyerPhone: '+91 89781 44556', amount: 28.5, timestamp: '10:45 AM', status: 'active' },
  { id: 'BID_003', lotId: 'L001', buyer: 'Andhra Traders Pvt Ltd', buyerPhone: '+91 78930 11223', amount: 29.0, timestamp: '11:02 AM', status: 'highest' },
  { id: 'BID_004', lotId: 'L002', buyer: 'Delta Rice Millers', buyerPhone: '+91 91234 56780', amount: 33.0, timestamp: '09:15 AM', status: 'highest' },
  { id: 'BID_005', lotId: 'L003', buyer: 'Global Spices Co.', buyerPhone: '+91 94411 98765', amount: 64.0, timestamp: '11:30 AM', status: 'highest' },
  { id: 'BID_006', lotId: 'L004', buyer: 'Srinivas M.', buyerPhone: '+91 87654 32109', amount: 72.0, timestamp: '11:45 AM', status: 'highest' },
];

function triggerUpdate() {
  try {
    window.dispatchEvent(new Event('farmflow_bidding_updated'));
  } catch (e) {
    // Ignore in SSR
  }
}

// ─── GET BIDDING LOTS ────────────────────────────────────────────────────────
export function getBiddingLots() {
  try {
    let removedIds = [];
    try {
      const rawRemoved = localStorage.getItem('farmflow_removed_listing_ids');
      removedIds = rawRemoved ? JSON.parse(rawRemoved) : [];
    } catch {}

    const rawLots = localStorage.getItem(LOTS_STORAGE_KEY);
    let lots = rawLots ? JSON.parse(rawLots) : null;
    if (!lots || !Array.isArray(lots) || lots.length === 0) {
      lots = [...initialBiddingLots];
      localStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(initialBiddingLots));
    }

    // Merge any custom listings published by farmers in Marketplace
    try {
      const rawMarketListings = localStorage.getItem('farmflow_published_listings');
      if (rawMarketListings) {
        const marketLots = JSON.parse(rawMarketListings);
        if (Array.isArray(marketLots)) {
          marketLots.forEach(m => {
            if (!lots.some(l => l.id === m.id) && !removedIds.includes(m.id)) {
              lots.unshift({
                id: m.id,
                crop: m.crop,
                quantity: Number(m.quantity) || 100,
                unit: m.unit || 'kg',
                grade: m.grade || 'A',
                quality: m.quality || 'Premium Quality',
                moisture: Number(m.moisture) || 12,
                basePrice: Number(m.pricePerKg) || 25,
                pricePerKg: Number(m.pricePerKg) || 25,
                farmer: m.farmer || 'Farmer Ravi',
                farmerPhone: m.farmerPhone || '+91 98765 43210',
                location: m.location || 'Vizag',
                aiConfidence: m.aiConfidence || 94,
                status: 'open',
                acceptedBid: null,
                imageUrl: m.imageUrl || null,
                description: m.description || `${m.crop} lot published directly by farmer for live market auction.`,
                postedDate: m.postedDate || new Date().toISOString().split('T')[0],
                endTime: new Date(Date.now() + 86400000 * 3).toISOString(),
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error reading market listings for bidding lots:', e);
    }

    return lots.filter(l => !removedIds.includes(l.id));
  } catch (err) {
    console.error('Error getting bidding lots:', err);
    return initialBiddingLots;
  }
}

// ─── GET BIDS ────────────────────────────────────────────────────────────────
export function getAllBids() {
  try {
    const rawBids = localStorage.getItem(BIDS_STORAGE_KEY);
    const bids = rawBids ? JSON.parse(rawBids) : null;
    if (bids && Array.isArray(bids) && bids.length > 0) {
      return bids;
    }
    localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(initialSeedBids));
    return initialSeedBids;
  } catch (err) {
    console.error('Error getting all bids:', err);
    return initialSeedBids;
  }
}

export function getBidsForLot(lotId) {
  const allBids = getAllBids();
  return allBids.filter(b => b.lotId === lotId);
}

export function getBidsByBuyer(buyerName, buyerPhone) {
  const allBids = getAllBids();
  if (!buyerName && !buyerPhone) return [];
  return allBids.filter(b => {
    const cleanBuyer = (buyerName || '').trim().toLowerCase();
    const bBuyer = (b.buyer || '').trim().toLowerCase();
    const nameMatch = cleanBuyer && (bBuyer === cleanBuyer || bBuyer.includes(cleanBuyer) || cleanBuyer.includes(bBuyer));
    const cleanPhone = (buyerPhone || '').replace(/\D/g, '');
    const bPhone = (b.buyerPhone || '').replace(/\D/g, '');
    const phoneMatch = cleanPhone && bPhone && (cleanPhone.slice(-10) === bPhone.slice(-10));
    return Boolean(nameMatch || phoneMatch);
  });
}

// ─── FARMER: PUBLISH NEW BIDDING LOT ─────────────────────────────────────────
export function publishBiddingLot(lotData) {
  try {
    const existing = getBiddingLots();
    const newLot = {
      id: `AUCTION_${Date.now()}`,
      crop: lotData.crop,
      quantity: Number(lotData.quantity) || 100,
      unit: 'kg',
      grade: lotData.grade || 'A',
      quality: lotData.quality || 'Premium Quality',
      moisture: Number(lotData.moisture) || 12,
      basePrice: Number(lotData.basePrice) || 25,
      pricePerKg: Number(lotData.basePrice) || 25,
      farmer: lotData.farmer || 'Farmer Ravi',
      farmerPhone: lotData.farmerPhone || '+91 98765 43210',
      location: lotData.location || 'Vizag',
      aiConfidence: Math.floor(90 + Math.random() * 8),
      status: 'open',
      acceptedBid: null,
      imageUrl: lotData.imageUrl || null,
      description: lotData.description || `${lotData.crop} lot published directly by farmer for live market auction.`,
      postedDate: new Date().toISOString().split('T')[0],
      endTime: lotData.endTime || new Date(Date.now() + 86400000 * 3).toISOString(),
    };

    const updated = [newLot, ...existing];
    localStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(updated));
    triggerUpdate();
    return updated;
  } catch (err) {
    console.error('Failed to publish bidding lot:', err);
    return getBiddingLots();
  }
}

// ─── BUYER: PLACE BID ON LOT ─────────────────────────────────────────────────
export function placeBidOnLot(lotId, { buyerName, buyerPhone, amount }) {
  try {
    const numAmount = Number(amount);
    const allBids = getAllBids();
    const existingLotBids = allBids.filter(b => b.lotId === lotId);
    
    // Check highest
    const lots = getBiddingLots();
    const currentLot = lots.find(l => l.id === lotId);
    const currentHighest = existingLotBids.length > 0
      ? Math.max(...existingLotBids.map(b => b.amount))
      : (currentLot ? currentLot.basePrice : 0);

    if (numAmount <= currentHighest) {
      return {
        success: false,
        message: `Your bid (₹${numAmount}) must be higher than current highest: ₹${currentHighest}/kg`,
      };
    }

    const newBid = {
      id: `BID_${Date.now()}`,
      lotId,
      buyer: buyerName || 'Verified Buyer',
      buyerPhone: buyerPhone || '+91 98765 00000',
      amount: numAmount,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'highest',
    };

    // Update other bids for this lot to outbid
    const updatedBids = allBids.map(b => {
      if (b.lotId === lotId) {
        return { ...b, status: b.status === 'accepted' ? 'accepted' : 'outbid' };
      }
      return b;
    });

    const finalBids = [newBid, ...updatedBids];
    localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(finalBids));

    // Also update lot current price
    if (currentLot) {
      const updatedLots = lots.map(l => {
        if (l.id === lotId) {
          return { ...l, pricePerKg: numAmount };
        }
        return l;
      });
      localStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(updatedLots));
    }

    triggerUpdate();
    return {
      success: true,
      bid: newBid,
      message: `🎉 Offer of ₹${numAmount}/kg placed successfully! You are the highest bidder.`,
    };
  } catch (err) {
    console.error('Failed to place bid:', err);
    return { success: false, message: 'Could not place bid. Please try again.' };
  }
}

// ─── FARMER: ACCEPT SPECIFIC BID ─────────────────────────────────────────────
export function acceptBidForLot(lotId, bidId) {
  try {
    const allBids = getAllBids();
    const selectedBid = allBids.find(b => b.id === bidId);

    if (!selectedBid) {
      return { success: false, message: 'Bid not found.' };
    }

    // Mark that bid as accepted, others for that lot as unaccepted
    const updatedBids = allBids.map(b => {
      if (b.lotId === lotId) {
        if (b.id === bidId) {
          return { ...b, status: 'accepted' };
        } else {
          return { ...b, status: 'closed' };
        }
      }
      return b;
    });
    localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(updatedBids));

    // Update lot status to 'accepted' with the winning bid details
    const lots = getBiddingLots();
    const currentLot = lots.find(l => l.id === lotId);
    const updatedLots = lots.map(l => {
      if (l.id === lotId) {
        return {
          ...l,
          status: 'accepted',
          pricePerKg: selectedBid.amount,
          acceptedBid: {
            ...selectedBid,
            status: 'accepted',
            acceptedAt: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN'),
          },
        };
      }
      return l;
    });
    localStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(updatedLots));

    triggerUpdate();
    return {
      success: true,
      winningBid: selectedBid,
      message: `🎉 Deal Confirmed! You accepted the offer of ₹${selectedBid.amount}/kg from ${selectedBid.buyer}. Total lot value: ₹${(selectedBid.amount * (currentLot?.quantity || 1)).toLocaleString('en-IN')}.`,
    };
  } catch (err) {
    console.error('Failed to accept bid:', err);
    return { success: false, message: 'Could not accept bid. Please try again.' };
  }
}

// ─── ADMIN: REMOVE FRAUDULENT BID ──────────────────────────────────────────
export function removeFraudulentBid(bidId, reason = 'Fraudulent / suspicious activity') {
  try {
    const allBids = getAllBids();
    const targetBid = allBids.find(b => b.id === bidId);
    if (!targetBid) {
      return { success: false, message: 'Bid not found.' };
    }

    const remainingBids = allBids.filter(b => b.id !== bidId);
    const lotId = targetBid.lotId;

    // Check remaining bids for this lot to re-assign 'highest'
    const lotBids = remainingBids.filter(b => b.lotId === lotId);
    if (lotBids.length > 0) {
      const highestAmount = Math.max(...lotBids.map(b => b.amount));
      const updatedLotBids = remainingBids.map(b => {
        if (b.lotId === lotId) {
          return {
            ...b,
            status: b.amount === highestAmount ? 'highest' : (b.status === 'accepted' ? 'accepted' : 'outbid')
          };
        }
        return b;
      });
      localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(updatedLotBids));

      // Also update lot current price
      const lots = getBiddingLots();
      const updatedLots = lots.map(l => {
        if (l.id === lotId) {
          return { ...l, pricePerKg: highestAmount };
        }
        return l;
      });
      localStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(updatedLots));
    } else {
      localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(remainingBids));
      // Reset lot price to base price
      const lots = getBiddingLots();
      const updatedLots = lots.map(l => {
        if (l.id === lotId) {
          return { ...l, pricePerKg: l.basePrice || 25 };
        }
        return l;
      });
      localStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(updatedLots));
    }

    triggerUpdate();
    window.dispatchEvent(new CustomEvent('farmflow_bid_removed', { detail: { bidId, lotId, reason } }));
    return {
      success: true,
      message: `🚫 Fraudulent bid of ₹${targetBid.amount}/kg from ${targetBid.buyer} has been removed by Admin.`,
    };
  } catch (err) {
    console.error('Failed to remove fraudulent bid:', err);
    return { success: false, message: 'Could not remove bid.' };
  }
}

// ─── ADMIN: REMOVE FRAUDULENT LISTING AND ALL ITS BIDS ──────────────────────
export function removeFraudulentListing(lotId, reason = 'Fraudulent / suspicious activity') {
  try {
    // 1. Remove all bids for this lot
    const allBids = getAllBids();
    const remainingBids = allBids.filter(b => b.lotId !== lotId);
    localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(remainingBids));

    // 2. Remove from bidding lots
    const lots = getBiddingLots();
    const remainingLots = lots.filter(l => l.id !== lotId);
    localStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(remainingLots));

    // 3. Mark removed in marketplace store
    const removedKey = 'farmflow_removed_listing_ids';
    let removed = [];
    try {
      const raw = localStorage.getItem(removedKey);
      removed = raw ? JSON.parse(raw) : [];
    } catch {}
    if (!removed.includes(lotId)) {
      removed.push(lotId);
      localStorage.setItem(removedKey, JSON.stringify(removed));
    }

    triggerUpdate();
    window.dispatchEvent(new Event('farmflow_listings_updated'));
    window.dispatchEvent(new CustomEvent('farmflow_listing_removed', { detail: { lotId, reason } }));
    return {
      success: true,
      message: `🚨 Listing ${lotId} and all associated bids have been removed by Admin.`,
    };
  } catch (err) {
    console.error('Failed to remove fraudulent listing:', err);
    return { success: false, message: 'Could not remove listing.' };
  }
}
