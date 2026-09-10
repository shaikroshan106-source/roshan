import { firestoreService } from '../services/firestoreService.js';
import { storageService } from '../services/storageService.js';

export const complaintController = {
  async getComplaints(req, res) {
    try {
      const { role, status, reporterRole } = req.query;
      let complaints = await firestoreService.getAll('complaints');

      // If regular user (farmer or buyer), filter to their complaints unless admin
      if (req.user && req.user.role !== 'admin') {
        complaints = complaints.filter(c =>
          c.reporterId === req.user.uid ||
          c.reporterName === req.user.name ||
          (req.user.phone && c.reporterPhone && c.reporterPhone.replace(/\D/g, '').slice(-10) === req.user.phone.replace(/\D/g, '').slice(-10))
        );
      }

      if (status && status !== 'All') {
        complaints = complaints.filter(c => c.status.toLowerCase() === status.toLowerCase());
      }
      if (reporterRole && reporterRole !== 'All') {
        complaints = complaints.filter(c => c.reporterRole.toLowerCase() === reporterRole.toLowerCase());
      }

      complaints.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return res.json({ success: true, count: complaints.length, data: complaints });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async submitComplaint(req, res) {
    try {
      const user = req.user;
      const {
        reporterName,
        reporterPhone,
        reporterEmail,
        category,
        counterpartyName,
        lotId,
        severity = 'High',
        description,
        evidenceBase64,
      } = req.body;

      if (!reporterName || !reporterPhone || !description) {
        return res.status(400).json({
          success: false,
          message: 'Full name, phone number, and a detailed description are required.',
        });
      }

      let evidenceUrl = req.body.evidenceUrl || null;
      if (req.file) {
        evidenceUrl = await storageService.uploadFile(req.file, 'complaint-evidence');
      } else if (evidenceBase64) {
        evidenceUrl = await storageService.uploadBase64(evidenceBase64, 'complaint-evidence');
      }

      const ticketId = `CMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newComplaint = {
        id: ticketId,
        reporterId: user.uid || 'user_1',
        reporterName: reporterName.trim(),
        reporterRole: (user.role && user.role.toLowerCase() === 'buyer') ? 'Buyer' : 'Farmer',
        reporterPhone: reporterPhone.trim(),
        reporterEmail: (reporterEmail || user.email || '').trim(),
        category: category || 'Other Grievance',
        counterpartyName: (counterpartyName || 'Not specified').trim(),
        lotId: (lotId || 'N/A').trim(),
        severity,
        description: description.trim(),
        evidenceUrl,
        status: 'Pending',
        adminNote: '',
        counterpartySuspended: false,
        submittedDate: new Date().toLocaleString('en-IN', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }).replace(',', ''),
        createdAt: new Date().toISOString(),
      };

      const saved = await firestoreService.set('complaints', ticketId, newComplaint);

      return res.status(201).json({
        success: true,
        message: `Complaint ticket ${ticketId} registered with the AgriDirect Arbitration Desk.`,
        data: saved,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, adminNote } = req.body;

      const complaint = await firestoreService.getById('complaints', id);
      if (!complaint) {
        return res.status(404).json({ success: false, message: 'Complaint ticket not found.' });
      }

      const updates = {
        status: status || complaint.status,
        adminNote: adminNote || complaint.adminNote,
        updatedDate: new Date().toLocaleString('en-IN'),
      };

      const updated = await firestoreService.update('complaints', id, updates);

      // Notify reporter of status update
      const notifId = `NOTIF_${Date.now()}`;
      await firestoreService.set('notifications', notifId, {
        id: notifId,
        userId: complaint.reporterId,
        type: 'COMPLAINT_UPDATE',
        title: `Grievance Update: ${id}`,
        message: `Your grievance ticket has been marked as '${status}'. Note: ${adminNote || 'Under review by arbitration panel.'}`,
        metadata: { complaintId: id, status },
        read: false,
        createdAt: new Date().toISOString(),
      });

      return res.json({ success: true, message: `Ticket ${id} status updated to ${status}.`, data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async toggleSuspendCounterparty(req, res) {
    try {
      const { id } = req.params;
      const { counterpartyName, reason } = req.body;

      const complaint = await firestoreService.getById('complaints', id);
      const party = counterpartyName || complaint?.counterpartyName;

      if (!party || party === 'Not specified' || party === 'N/A') {
        return res.status(400).json({ success: false, message: 'No valid counterparty name specified on this ticket.' });
      }

      const suspendedRecord = await firestoreService.getById('settings', 'suspended_users') || { id: 'suspended_users', list: ['Kiran Traders'] };
      let list = Array.isArray(suspendedRecord.list) ? suspendedRecord.list : [];

      const cleanName = party.trim();
      const isCurrentlySuspended = list.some(u => u.toLowerCase() === cleanName.toLowerCase());

      let isNowSuspended;
      if (isCurrentlySuspended) {
        list = list.filter(u => u.toLowerCase() !== cleanName.toLowerCase());
        isNowSuspended = false;
      } else {
        list.push(cleanName);
        isNowSuspended = true;
      }

      await firestoreService.set('settings', 'suspended_users', { id: 'suspended_users', list });

      // Also sync user document in 'users' collection
      const allUsers = await firestoreService.getAll('users');
      const targetUser = allUsers.find(u =>
        u.name.toLowerCase() === cleanName.toLowerCase() ||
        u.uid === cleanName
      );
      if (targetUser) {
        await firestoreService.update('users', targetUser.uid, {
          status: isNowSuspended ? 'suspended' : 'active',
          suspendedReason: isNowSuspended ? (reason || 'Enforced by Complaint Desk') : null,
          suspendedAt: isNowSuspended ? new Date().toISOString() : null,
        });
      }

      // Update complaint adminNote and status
      if (complaint) {
        const actionTag = isNowSuspended
          ? `⛔ Reported party "${cleanName}" was SUSPENDED by Admin. (${reason || 'Enforced by Complaint Desk'})`
          : `Admin revoked suspension for "${cleanName}".`;

        const updatedNote = complaint.adminNote ? `${complaint.adminNote} | ${actionTag}` : actionTag;
        await firestoreService.update('complaints', id, {
          counterpartySuspended: isNowSuspended,
          adminNote: updatedNote,
        });
      }

      return res.json({
        success: true,
        isSuspended: isNowSuspended,
        message: isNowSuspended
          ? `⛔ Reported party "${cleanName}" has been SUSPENDED from Agri Direct.`
          : `✅ Account for "${cleanName}" has been reinstated.`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getSuspendedUsers(req, res) {
    try {
      const record = await firestoreService.getById('settings', 'suspended_users') || { list: ['Kiran Traders'] };
      return res.json({ success: true, list: record.list || [] });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
