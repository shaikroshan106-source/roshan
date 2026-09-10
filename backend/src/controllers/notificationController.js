import { firestoreService } from '../services/firestoreService.js';

export const notificationController = {
  async getNotifications(req, res) {
    try {
      const user = req.user;
      const allNotifs = await firestoreService.getAll('notifications');
      const userNotifs = allNotifs
        .filter(n => !n.userId || n.userId === user.uid || n.userId === 'all')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const unreadCount = userNotifs.filter(n => !n.read).length;

      return res.json({
        success: true,
        count: userNotifs.length,
        unreadCount,
        data: userNotifs,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const notif = await firestoreService.getById('notifications', id);
      if (!notif) {
        return res.status(404).json({ success: false, message: 'Notification not found.' });
      }

      if (notif.userId && notif.userId !== 'all' && notif.userId !== req.user.uid && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized to modify this notification.' });
      }

      const updated = await firestoreService.update('notifications', id, { read: true });
      return res.json({ success: true, data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async markAllAsRead(req, res) {
    try {
      const user = req.user;
      const allNotifs = await firestoreService.getAll('notifications');
      for (const n of allNotifs.filter(n => !n.userId || n.userId === user.uid)) {
        await firestoreService.update('notifications', n.id, { read: true });
      }
      return res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
