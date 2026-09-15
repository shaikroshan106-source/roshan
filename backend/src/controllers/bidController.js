import { firestoreService } from '../services/firestoreService.js';

export const bidController = {
  /**
   * Get all bids with query filters
   */
  async getAllBids(req, res) {
    try {
      const { lotId, buyerId, farmerId } = req.query;
      let bids = await firestoreService.getAll('bids');
      bids = bids.filter(b => b.status !== 'removed_by_admin');

      if (lotId) {
        bids = bids.filter(b => b.lotId === lotId || b.productId === lotId);
      }
      if (buyerId) {
        bids = bids.filter(b => b.buyerId === buyerId || b.buyer === buyerId);
      }
      if (farmerId) {
        const allProducts = await firestoreService.getAll('products');
        const farmerLotIds = allProducts
          .filter(p => p.farmerId === farmerId || p.farmer === farmerId)
          .map(p => p.id);
        bids = bids.filter(b => farmerLotIds.includes(b.lotId) || farmerLotIds.includes(b.productId));
      }

      bids.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return res.json({ success: true, count: bids.length, data: bids });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get bids for a specific produce lot
   */
  async getBidsForLot(req, res) {
    try {
      const { lotId } = req.params;
      const allBids = await firestoreService.getAll('bids');
      const lotBids = allBids
        .filter(b => (b.lotId === lotId || b.productId === lotId) && b.status !== 'removed_by_admin')
        .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));

      return res.json({ success: true, count: lotBids.length, data: lotBids });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Buyer: Place bid on a produce lot
   */
  async placeBid(req, res) {
    try {
      const user = req.user;
      const { lotId, amount, buyerName, buyerPhone } = req.body;
      const numAmount = Number(amount);

      if (!lotId || !numAmount || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Valid lotId and bid amount are required.' });
      }

      // Check lot status
      let lot = await firestoreService.getById('products', lotId);
      if (!lot) lot = await firestoreService.getById('listings', lotId);

      if (!lot) {
        return res.status(404).json({ success: false, message: 'Auction lot not found.' });
      }
      if (lot.status === 'accepted' || lot.status === 'closed') {
        return res.status(400).json({ success: false, message: 'This auction lot is already closed or accepted.' });
      }

      // Check auction timer expiry
      if (lot.endTime && new Date(lot.endTime).getTime() <= Date.now()) {
        await firestoreService.update('products', lotId, { status: 'closed' }).catch(() => {});
        await firestoreService.update('listings', lotId, { status: 'closed' }).catch(() => {});
        return res.status(400).json({ success: false, message: '⏱️ This auction has ended and is now closed for bidding.' });
      }

      if (lot.farmerId === user.uid) {
        return res.status(403).json({ success: false, message: 'Farmers cannot place bids on their own produce lots.' });
      }

      // Get existing bids for lot to find current highest
      const allBids = await firestoreService.getAll('bids');
      const activeLotBids = allBids.filter(b =>
        (b.lotId === lotId || b.productId === lotId) &&
        b.status !== 'removed_by_admin' &&
        b.status !== 'rejected' &&
        b.status !== 'cancelled'
      );
      const currentHighest = activeLotBids.length > 0
        ? Math.max(...activeLotBids.map(b => Number(b.amount) || 0))
        : Number(lot.basePrice || lot.pricePerKg || 0);

      if (numAmount <= currentHighest) {
        return res.status(400).json({
          success: false,
          message: `Your bid of ₹${numAmount}/kg must be strictly higher than the current highest bid: ₹${currentHighest}/kg`,
        });
      }

      const bidId = `BID_${Date.now()}`;
      const lotQty = Number(lot.quantity) || 1;
      const newBid = {
        id: bidId,
        lotId,
        productId: lotId,
        buyerId: user.uid || 'buyer_srinivas',
        buyer: user.name || buyerName || 'Verified Buyer',
        buyerName: user.name || buyerName || 'Verified Buyer',
        buyerPhone: user.phone || buyerPhone || '+91 87654 32109',
        farmerId: lot.farmerId || 'farmer_ravi',
        farmerName: lot.farmerName || lot.farmer || 'Farmer',
        cropId: lot.id,
        cropName: lot.crop || 'Produce',
        crop: lot.crop || 'Produce',
        quantity: lotQty,
        amount: numAmount,
        totalOfferValue: numAmount * lotQty,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'highest',
        createdAt: new Date().toISOString(),
      };

      // Mark other active bids for this lot as 'outbid'
      for (const b of activeLotBids) {
        if (b.status === 'highest') {
          await firestoreService.update('bids', b.id, { status: 'outbid' });
        }
      }

      // Save new bid
      await firestoreService.set('bids', bidId, newBid);

      // Update lot's current highest price in both collections
      const lotUpdates = {
        pricePerKg: numAmount,
        highestBid: numAmount,
        highestBidId: bidId,
        totalBidsCount: activeLotBids.length + 1,
        updatedAt: new Date().toISOString(),
      };
      await firestoreService.update('products', lotId, lotUpdates).catch(() => {});
      await firestoreService.update('listings', lotId, lotUpdates).catch(() => {});

      // Create in-app notification for the farmer
      const notifId = `NOTIF_${Date.now()}`;
      await firestoreService.set('notifications', notifId, {
        id: notifId,
        userId: lot.farmerId,
        type: 'NEW_BID',
        title: `New Offer on ${lot.crop}`,
        message: `${newBid.buyer} placed an offer of ₹${numAmount}/kg on your ${lot.crop} lot.`,
        metadata: { lotId, bidId, amount: numAmount },
        read: false,
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json({
        success: true,
        message: `🎉 Offer of ₹${numAmount}/kg placed successfully! You are the highest bidder.`,
        data: newBid,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Farmer: Accept winning bid on produce lot
   */
  async acceptBid(req, res) {
    try {
      const user = req.user;
      let { lotId, bidId } = req.body;

      if (!bidId) {
        return res.status(400).json({ success: false, message: 'bidId is required.' });
      }

      if (!lotId) {
        const foundBid = await firestoreService.getById('bids', bidId);
        if (foundBid) {
          lotId = foundBid.lotId || foundBid.productId;
        }
      }

      if (!lotId) {
        return res.status(400).json({ success: false, message: 'lotId or valid bidId is required.' });
      }

      let lot = await firestoreService.getById('products', lotId);
      if (!lot) lot = await firestoreService.getById('listings', lotId);
      if (!lot) {
        return res.status(404).json({ success: false, message: 'Lot not found.' });
      }

      // Only the listing farmer or admin can accept
      const isOwner = req.user.role === 'admin' ||
        lot.farmerId === user.uid ||
        lot.farmer === user.name ||
        lot.farmerName === user.name;

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Only the lot owner can accept bids.' });
      }

      const bid = await firestoreService.getById('bids', bidId);
      if (!bid || (bid.lotId !== lotId && bid.productId !== lotId)) {
        return res.status(404).json({ success: false, message: 'Bid not found for this lot.' });
      }

      // Update winning bid to 'accepted' and all others to 'closed'
      const allBids = await firestoreService.getAll('bids');
      for (const b of allBids.filter(b => b.lotId === lotId || b.productId === lotId)) {
        const newStatus = b.id === bidId ? 'accepted' : 'closed';
        await firestoreService.update('bids', b.id, { status: newStatus });
      }

      const acceptedBidData = {
        ...bid,
        status: 'accepted',
        acceptedAt: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN'),
      };

      // Update lot status in both collections
      const lotUpdates = {
        status: 'accepted',
        pricePerKg: bid.amount,
        highestBid: bid.amount,
        acceptedBid: acceptedBidData,
        updatedAt: new Date().toISOString(),
      };
      await firestoreService.update('products', lotId, lotUpdates).catch(() => {});
      const updatedLot = await firestoreService.update('listings', lotId, lotUpdates);

      // Instantiate new order record in 'orders' collection
      const orderId = `ORD_${new Date().getFullYear()}_${Math.floor(100000 + Math.random() * 900000)}`;
      const subtotalAmount = Number(bid.amount) * (Number(lot.quantity) || 100);
      const logisticsFee = 1800;
      const platformFee = +(subtotalAmount * 0.01).toFixed(0);
      const totalAmount = subtotalAmount + logisticsFee + platformFee;

      const orderRecord = {
        id: orderId,
        productId: lotId,
        bidId: bid.id,
        farmerId: lot.farmerId || user.uid,
        farmerName: lot.farmer || user.name || 'Farmer Ravi',
        buyerId: bid.buyerId || 'buyer_srinivas',
        buyerName: bid.buyer || 'Verified Buyer',
        crop: lot.crop,
        quantity: Number(lot.quantity) || 100,
        unit: lot.unit || 'kg',
        unitPrice: Number(bid.amount),
        subtotalAmount,
        logisticsFee,
        platformFee,
        totalAmount,
        orderStatus: 'pending_payment',
        escrowStatus: 'awaiting_deposit',
        deliveryAddress: { hubName: 'Buyer Mandi Depot', district: lot.location || 'Guntur' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await firestoreService.set('orders', orderId, orderRecord);

      // Create transaction escrow deposit record in 'transactions' collection
      const txnId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      await firestoreService.set('transactions', txnId, {
        id: txnId,
        orderId,
        payerId: bid.buyerId || 'buyer_srinivas',
        payerName: bid.buyer || 'Verified Buyer',
        payeeId: 'agridirect_escrow',
        payeeName: 'AgriDirect Instant Escrow',
        type: 'escrow_deposit',
        amount: totalAmount,
        currency: 'INR',
        paymentGateway: 'Razorpay',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      // Notify the winning buyer
      const notifId = `NOTIF_${Date.now()}`;
      await firestoreService.set('notifications', notifId, {
        id: notifId,
        userId: bid.buyerId,
        type: 'BID_ACCEPTED',
        title: `Deal Confirmed for ${lot.crop}!`,
        message: `Farmer ${lot.farmer} accepted your offer of ₹${bid.amount}/kg for ${lot.quantity} kg of ${lot.crop}. Order ${orderId} created.`,
        metadata: { lotId, bidId, orderId, totalValue: totalAmount },
        read: false,
        createdAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        message: `🎉 Deal Confirmed! You accepted the offer of ₹${bid.amount}/kg from ${bid.buyer}. Order ${orderId} generated for ₹${totalAmount.toLocaleString('en-IN')}.`,
        data: { lot: updatedLot, winningBid: acceptedBidData, order: orderRecord },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Farmer: Reject a bid on their produce lot
   */
  async rejectBid(req, res) {
    try {
      const user = req.user;
      let { lotId, bidId, reason } = req.body;

      if (!bidId) {
        return res.status(400).json({ success: false, message: 'bidId is required.' });
      }

      if (!lotId) {
        const foundBid = await firestoreService.getById('bids', bidId);
        if (foundBid) {
          lotId = foundBid.lotId || foundBid.productId;
        }
      }

      if (!lotId) {
        return res.status(400).json({ success: false, message: 'lotId or valid bidId is required.' });
      }

      let lot = await firestoreService.getById('products', lotId);
      if (!lot) lot = await firestoreService.getById('listings', lotId);
      if (!lot) {
        return res.status(404).json({ success: false, message: 'Produce lot not found.' });
      }

      // Only lot owner or admin can reject
      const isOwner = req.user.role === 'admin' ||
        lot.farmerId === user.uid ||
        lot.farmer === user.name ||
        lot.farmerName === user.name;

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Only the produce lot owner can reject bids.' });
      }

      const bid = await firestoreService.getById('bids', bidId);
      if (!bid || (bid.lotId !== lotId && bid.productId !== lotId)) {
        return res.status(404).json({ success: false, message: 'Bid not found for this lot.' });
      }

      // Mark bid as rejected
      const rejectedBid = await firestoreService.update('bids', bidId, {
        status: 'rejected',
        rejectionReason: reason || 'Farmer declined offer',
        rejectedAt: new Date().toISOString(),
      });

      // Recalculate remaining active bids for the lot to update highest bid if needed
      const allBids = await firestoreService.getAll('bids');
      const activeBids = allBids
        .filter(b => (b.lotId === lotId || b.productId === lotId) && b.status !== 'rejected' && b.status !== 'removed_by_admin')
        .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));

      const newHighest = activeBids.length > 0 ? Number(activeBids[0].amount) : Number(lot.basePrice || lot.expectedPrice || 25);
      if (activeBids.length > 0) {
        await firestoreService.update('bids', activeBids[0].id, { status: 'highest' });
      }

      const lotUpdates = {
        highestBid: newHighest,
        pricePerKg: newHighest,
        highestBidId: activeBids.length > 0 ? activeBids[0].id : null,
        updatedAt: new Date().toISOString(),
      };
      await firestoreService.update('products', lotId, lotUpdates).catch(() => {});
      await firestoreService.update('listings', lotId, lotUpdates).catch(() => {});

      // Notify the buyer of the rejection
      const notifId = `NOTIF_${Date.now()}`;
      await firestoreService.set('notifications', notifId, {
        id: notifId,
        userId: bid.buyerId,
        type: 'BID_REJECTED',
        title: `Offer Declined on ${lot.crop}`,
        message: `Farmer ${lot.farmer || 'Farmer'} declined your offer of ₹${bid.amount}/kg for ${lot.crop}. You can place a revised offer.`,
        metadata: { lotId, bidId, amount: bid.amount },
        read: false,
        createdAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        message: `Offer of ₹${bid.amount}/kg from ${bid.buyer || 'Buyer'} has been declined.`,
        data: rejectedBid,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Buyer: Edit/revise an existing bid before acceptance
   */
  async editBid(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;
      const { amount, deliveryLocation } = req.body;
      const numAmount = Number(amount);

      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'A valid revised bid amount is required.' });
      }

      const bid = await firestoreService.getById('bids', id);
      if (!bid) {
        return res.status(404).json({ success: false, message: 'Bid not found.' });
      }

      // Check ownership: only the buyer who placed the bid or admin can edit
      const isOwner = req.user.role === 'admin' ||
        bid.buyerId === user.uid ||
        bid.buyer === user.name ||
        bid.buyerName === user.name;

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'You can only edit your own bids.' });
      }

      // Check if bid is in editable state
      if (bid.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'Cannot edit a bid that has already been accepted.' });
      }
      if (bid.status === 'rejected') {
        return res.status(400).json({ success: false, message: 'Cannot edit a rejected bid. Please place a new bid.' });
      }

      const lotId = bid.lotId || bid.productId;
      let lot = await firestoreService.getById('products', lotId);
      if (!lot) lot = await firestoreService.getById('listings', lotId);

      if (lot && (lot.status === 'accepted' || lot.status === 'closed')) {
        return res.status(400).json({ success: false, message: 'The auction lot has already closed.' });
      }

      // Update bid fields
      const bidUpdates = {
        amount: numAmount,
        totalOfferValue: numAmount * (Number(lot?.quantity) || 100),
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        updatedAt: new Date().toISOString(),
      };
      if (deliveryLocation) bidUpdates.deliveryLocation = deliveryLocation;

      // Recalculate status against all active bids for this lot
      const allBids = await firestoreService.getAll('bids');
      const otherActiveBids = allBids.filter(b =>
        b.id !== id &&
        (b.lotId === lotId || b.productId === lotId) &&
        b.status !== 'rejected' &&
        b.status !== 'cancelled' &&
        b.status !== 'removed_by_admin'
      );

      const otherHighest = otherActiveBids.length > 0
        ? Math.max(...otherActiveBids.map(b => Number(b.amount) || 0))
        : 0;

      if (numAmount > otherHighest) {
        bidUpdates.status = 'highest';
        // Mark others outbid
        for (const b of otherActiveBids) {
          if (b.status === 'highest') {
            await firestoreService.update('bids', b.id, { status: 'outbid' });
          }
        }
      } else {
        bidUpdates.status = 'outbid';
      }

      const updatedBid = await firestoreService.update('bids', id, bidUpdates);

      // Update lot's highest bid if this bid is the highest
      const newHighest = Math.max(numAmount, otherHighest, Number(lot?.basePrice || lot?.pricePerKg || 0));
      const lotUpdates = {
        highestBid: newHighest,
        pricePerKg: newHighest,
        updatedAt: new Date().toISOString(),
      };
      if (numAmount >= otherHighest) {
        lotUpdates.highestBidId = id;
      }
      if (lotId) {
        await firestoreService.update('products', lotId, lotUpdates).catch(() => {});
        await firestoreService.update('listings', lotId, lotUpdates).catch(() => {});
      }

      // Notify the farmer about the revised offer
      if (lot && lot.farmerId) {
        const notifId = `NOTIF_${Date.now()}`;
        await firestoreService.set('notifications', notifId, {
          id: notifId,
          userId: lot.farmerId,
          type: 'BID_REVISED',
          title: `Offer Revised on ${lot.crop}`,
          message: `Buyer ${bid.buyer || user.name} updated their offer on ${lot.crop} to ₹${numAmount}/kg.`,
          metadata: { lotId, bidId: id, newAmount: numAmount },
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        message: `Your offer has been updated to ₹${numAmount}/kg.`,
        data: updatedBid,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Buyer: Cancel/withdraw an active bid
   */
  async cancelBid(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;

      const bid = await firestoreService.getById('bids', id);
      if (!bid) {
        return res.status(404).json({ success: false, message: 'Bid not found.' });
      }

      // Check ownership
      const isOwner = req.user.role === 'admin' ||
        bid.buyerId === user.uid ||
        bid.buyer === user.name ||
        bid.buyerName === user.name;

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'You can only cancel your own bids.' });
      }

      if (bid.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'Cannot cancel an accepted bid with an active contract.' });
      }

      const lotId = bid.lotId || bid.productId;
      let lot = await firestoreService.getById('products', lotId);
      if (!lot) lot = await firestoreService.getById('listings', lotId);

      // Mark bid as cancelled
      const cancelledBid = await firestoreService.update('bids', id, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      });

      // Recalculate highest remaining bid for this lot
      const allBids = await firestoreService.getAll('bids');
      const remainingActiveBids = allBids
        .filter(b =>
          b.id !== id &&
          (b.lotId === lotId || b.productId === lotId) &&
          b.status !== 'cancelled' &&
          b.status !== 'rejected' &&
          b.status !== 'removed_by_admin'
        )
        .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));

      const newHighest = remainingActiveBids.length > 0
        ? Number(remainingActiveBids[0].amount)
        : Number(lot?.basePrice || lot?.expectedPrice || 25);

      if (remainingActiveBids.length > 0) {
        await firestoreService.update('bids', remainingActiveBids[0].id, { status: 'highest' });
      }

      if (lotId) {
        const lotUpdates = {
          highestBid: newHighest,
          pricePerKg: newHighest,
          highestBidId: remainingActiveBids.length > 0 ? remainingActiveBids[0].id : null,
          totalBidsCount: remainingActiveBids.length,
          updatedAt: new Date().toISOString(),
        };
        await firestoreService.update('products', lotId, lotUpdates).catch(() => {});
        await firestoreService.update('listings', lotId, lotUpdates).catch(() => {});
      }

      // Notify the farmer about withdrawal
      if (lot && lot.farmerId) {
        const notifId = `NOTIF_${Date.now()}`;
        await firestoreService.set('notifications', notifId, {
          id: notifId,
          userId: lot.farmerId,
          type: 'BID_CANCELLED',
          title: `Bid Withdrawn on ${lot.crop}`,
          message: `Buyer ${bid.buyer || user.name} withdrew their offer of ₹${bid.amount}/kg for ${lot.crop}.`,
          metadata: { lotId, bidId: id },
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        message: `Your offer of ₹${bid.amount}/kg has been withdrawn.`,
        data: cancelledBid,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
