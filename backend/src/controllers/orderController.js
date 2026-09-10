import { firestoreService } from '../services/firestoreService.js';

export const orderController = {
  async getOrders(req, res) {
    try {
      const { farmerId, buyerId, status } = req.query;
      let orders = await firestoreService.getAll('orders');

      // Access control: farmers see their sales, buyers see purchases, admin sees all
      if (req.user && req.user.role !== 'admin') {
        orders = orders.filter(o => o.farmerId === req.user.uid || o.buyerId === req.user.uid);
      }

      if (farmerId) orders = orders.filter(o => o.farmerId === farmerId);
      if (buyerId) orders = orders.filter(o => o.buyerId === buyerId);
      if (status) orders = orders.filter(o => o.orderStatus === status);

      orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return res.json({ success: true, count: orders.length, data: orders });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await firestoreService.getById('orders', id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      // Check authorization
      if (req.user.role !== 'admin' && order.farmerId !== req.user.uid && order.buyerId !== req.user.uid) {
        return res.status(403).json({ success: false, message: 'Access denied to this order.' });
      }

      // Associated transactions
      const allTxns = await firestoreService.getAll('transactions');
      const orderTxns = allTxns.filter(t => t.orderId === id);

      return res.json({ success: true, data: { ...order, transactions: orderTxns } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createOrder(req, res) {
    try {
      const {
        productId,
        bidId,
        farmerId,
        crop,
        quantity,
        unit = 'kg',
        unitPrice,
        logisticsFee = 1800,
        deliveryAddress,
      } = req.body;

      // Restrict buyerId to authenticated user unless admin
      const effectiveBuyerId = req.user.role === 'admin' ? (req.body.buyerId || req.user.uid) : req.user.uid;

      if (!productId || !farmerId || !effectiveBuyerId || !unitPrice || !quantity) {
        return res.status(400).json({ success: false, message: 'Missing required order parameters.' });
      }

      const orderId = `ORD_${new Date().getFullYear()}_${Math.floor(100000 + Math.random() * 900000)}`;
      const subtotalAmount = Number(quantity) * Number(unitPrice);
      const platformFee = +(subtotalAmount * 0.01).toFixed(0);
      const totalAmount = subtotalAmount + Number(logisticsFee) + platformFee;

      const farmerUser = await firestoreService.getById('users', farmerId);
      const buyerUser = await firestoreService.getById('users', effectiveBuyerId);

      const newOrder = {
        id: orderId,
        productId,
        bidId: bidId || 'DIRECT_PURCHASE',
        farmerId,
        farmerName: farmerUser?.name || 'Farmer',
        buyerId,
        buyerName: buyerUser?.name || 'Buyer',
        crop,
        quantity: Number(quantity),
        unit,
        unitPrice: Number(unitPrice),
        subtotalAmount,
        logisticsFee: Number(logisticsFee),
        platformFee,
        totalAmount,
        orderStatus: 'pending_payment',
        escrowStatus: 'awaiting_deposit',
        deliveryAddress: deliveryAddress || { hubName: 'Primary Warehouse', district: 'Guntur' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firestoreService.set('orders', orderId, newOrder);

      // Create Escrow Deposit Transaction
      const txnId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      await firestoreService.set('transactions', txnId, {
        id: txnId,
        orderId,
        payerId: buyerId,
        payerName: newOrder.buyerName,
        payeeId: 'agridirect_escrow',
        payeeName: 'AgriDirect Instant Escrow',
        type: 'escrow_deposit',
        amount: totalAmount,
        currency: 'INR',
        paymentGateway: 'Razorpay',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json({
        success: true,
        message: `Order ${orderId} created. Proceed to instant escrow funding.`,
        data: newOrder,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { orderStatus, escrowStatus, logisticsProvider, truckNumber } = req.body;

      const order = await firestoreService.getById('orders', id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      // Check role & ownership: Only buyer, farmer, or admin can interact with this order
      const isAdmin = req.user.role === 'admin';
      const isBuyer = order.buyerId === req.user.uid || order.buyerName === req.user.name;
      const isFarmer = order.farmerId === req.user.uid || order.farmerName === req.user.name;

      if (!isAdmin && !isBuyer && !isFarmer) {
        return res.status(403).json({ success: false, message: 'Access denied. You are not a party to this order.' });
      }

      // Escrow release: Only the receiving buyer or admin can confirm delivery completion
      if (orderStatus === 'completed' && !isBuyer && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Only the receiving buyer or admin can confirm delivery and release payment.' });
      }

      // Logistics dispatch updates: Only the dispatching farmer or admin can update dispatch/truck info
      if ((logisticsProvider || truckNumber) && !isFarmer && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Only the dispatching farmer or admin can update logistics carrier and truck details.' });
      }

      const updates = { updatedAt: new Date().toISOString() };
      if (orderStatus) updates.orderStatus = orderStatus;
      if (escrowStatus) updates.escrowStatus = escrowStatus;
      if (logisticsProvider) updates.logisticsProvider = logisticsProvider;
      if (truckNumber) updates.truckNumber = truckNumber;

      if (orderStatus === 'completed') {
        updates.completedAt = new Date().toISOString();
        updates.escrowStatus = 'released_to_farmer';

        // Automatically create farmer payout transaction record
        const txnId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        await firestoreService.set('transactions', txnId, {
          id: txnId,
          orderId: id,
          payerId: 'agridirect_escrow',
          payerName: 'AgriDirect Instant Escrow',
          payeeId: order.farmerId,
          payeeName: order.farmerName,
          type: 'farmer_payout',
          amount: order.subtotalAmount,
          currency: 'INR',
          paymentGateway: 'UPI',
          status: 'settled',
          settledAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }

      const updated = await firestoreService.update('orders', id, updates);

      return res.json({
        success: true,
        message: `Order ${id} updated to status '${updates.orderStatus || order.orderStatus}'.`,
        data: updated,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
