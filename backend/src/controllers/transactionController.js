import { firestoreService } from '../services/firestoreService.js';

export const transactionController = {
  async getTransactions(req, res) {
    try {
      const { orderId, type, status } = req.query;
      let txns = await firestoreService.getAll('transactions');

      if (req.user && req.user.role !== 'admin') {
        txns = txns.filter(t => t.payerId === req.user.uid || t.payeeId === req.user.uid);
      }

      if (orderId) txns = txns.filter(t => t.orderId === orderId);
      if (type) txns = txns.filter(t => t.type === type);
      if (status) txns = txns.filter(t => t.status === status);

      txns.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return res.json({ success: true, count: txns.length, data: txns });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getTransactionById(req, res) {
    try {
      const { id } = req.params;
      const txn = await firestoreService.getById('transactions', id);
      if (!txn) {
        return res.status(404).json({ success: false, message: 'Transaction record not found.' });
      }

      if (req.user.role !== 'admin' && txn.payerId !== req.user.uid && txn.payeeId !== req.user.uid) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      return res.json({ success: true, data: txn });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createTransaction(req, res) {
    try {
      const { orderId, type, amount, payeeId, paymentGateway = 'Razorpay', gatewayRefId } = req.body;
      const numAmount = Number(amount);

      if (!orderId || !type || !numAmount || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Valid orderId, type, and positive amount are required.' });
      }

      // Verify order existence and party authorization
      const order = await firestoreService.getById('orders', orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Associated order not found.' });
      }

      const isAdmin = req.user.role === 'admin';
      const isParty = order.buyerId === req.user.uid || order.farmerId === req.user.uid;
      if (!isAdmin && !isParty) {
        return res.status(403).json({ success: false, message: 'Access denied. You are not a party to this order.' });
      }

      const effectivePayerId = isAdmin ? (req.body.payerId || req.user.uid) : req.user.uid;
      const effectivePayerName = req.user.name || 'Verified Member';

      const txnId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const newTxn = {
        id: txnId,
        orderId,
        payerId: effectivePayerId,
        payerName: effectivePayerName,
        payeeId: payeeId || 'agridirect_escrow',
        payeeName: 'AgriDirect Instant Escrow',
        type,
        amount: numAmount,
        currency: 'INR',
        paymentGateway,
        gatewayRefId: gatewayRefId || `ref_${Date.now()}`,
        status: 'settled',
        settledAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await firestoreService.set('transactions', txnId, newTxn);

      return res.status(201).json({
        success: true,
        message: 'Transaction successfully processed and recorded in ledger.',
        data: newTxn,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
