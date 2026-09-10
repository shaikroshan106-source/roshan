/**
 * complaintStore.js
 * 
 * Manages dispute and incident reports filed by Farmers and Buyers.
 * Persists to localStorage, syncs with backend Express/Firestore,
 * and updates the Admin Complaint Desk.
 */

import { api } from '../services/api';

const STORAGE_KEY = 'agridirect_complaints';
const SUSPENDED_USERS_KEY = 'agridirect_suspended_users';

const SEED_COMPLAINTS = [
  {
    id: 'CMP-2026-9101',
    reporterName: 'Ravi Kumar',
    reporterRole: 'Farmer',
    reporterPhone: '+91 98480 22331',
    reporterEmail: 'ravi.kumar@apfarms.in',
    category: 'Payment Delay / Non-Payment',
    counterpartyName: 'Krishna Fresh Foods',
    lotId: 'LOT_1725610001',
    severity: 'High',
    description: 'Delivered 500 kg Grade-A Tomatoes to Krishna Fresh Foods warehouse in Vijayawada 4 days ago. Payment of ₹15,250 is still pending beyond the agreed 24-hour instant escrow release.',
    status: 'Pending',
    submittedDate: '2026-09-05 14:30',
    adminNote: '',
    counterpartySuspended: false,
  },
  {
    id: 'CMP-2026-9102',
    reporterName: 'Srinivas Agro Exports',
    reporterRole: 'Buyer',
    reporterPhone: '+91 94401 88992',
    reporterEmail: 'procurement@srinivasagro.com',
    category: 'Quality Discrepancy / Spoiled Produce',
    counterpartyName: 'Suresh Babu',
    lotId: 'L003',
    severity: 'Medium',
    description: 'Received Chilli lot listed as Grade A+ with 10% moisture, but lab sample test showed 16.5% moisture with surface discolouration on 8% of bags. Requesting quality adjustment.',
    status: 'Under Investigation',
    submittedDate: '2026-09-04 11:15',
    adminNote: 'Admin team assigned field inspector in Vizianagaram mandi to re-check moisture level.',
    counterpartySuspended: false,
  },
  {
    id: 'CMP-2026-9103',
    reporterName: 'Lakshmi Devi',
    reporterRole: 'Farmer',
    reporterPhone: '+91 97012 44556',
    reporterEmail: 'lakshmi.d@farms.in',
    category: 'Logistics & Transport Delay',
    counterpartyName: 'Coastal Freight Logistics',
    lotId: 'L002',
    severity: 'Low',
    description: 'Truck arrived 5 hours late for pickup in Guntur, requiring extra labor overtime charges of ₹600.',
    status: 'Resolved',
    submittedDate: '2026-09-02 09:45',
    adminNote: 'Logistics provider refunded ₹600 compensation to farmer account on Sep 3.',
    counterpartySuspended: false,
  },
];

// Background sync on load
syncComplaintsFromBackend();

async function syncComplaintsFromBackend() {
  if (typeof window === 'undefined') return;
  try {
    const res = await api.get('/complaints');
    if (res.ok && res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.data));
      window.dispatchEvent(new Event('agridirect_complaints_updated'));
    }

    const suspRes = await api.get('/complaints/suspended-users');
    if (suspRes.ok && suspRes.data?.success && Array.isArray(suspRes.data.list)) {
      localStorage.setItem(SUSPENDED_USERS_KEY, JSON.stringify(suspRes.data.list));
      window.dispatchEvent(new Event('agridirect_user_suspended'));
    }
  } catch (e) {
    console.warn('Backend complaints sync note:', e);
  }
}

export function getComplaints() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMPLAINTS));
      return SEED_COMPLAINTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_COMPLAINTS;
  } catch (err) {
    console.error('Failed to load complaints from localStorage:', err);
    return SEED_COMPLAINTS;
  }
}

export function submitComplaint(complaintData) {
  try {
    const existing = getComplaints();
    const newComplaint = {
      id: `CMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Pending',
      submittedDate: new Date().toLocaleString('en-IN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).replace(',', ''),
      adminNote: '',
      counterpartySuspended: false,
      ...complaintData,
    };

    const updated = [newComplaint, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Post to backend API
    api.post('/complaints', complaintData).then(res => {
      if (res.ok) syncComplaintsFromBackend();
    }).catch(() => {});

    window.dispatchEvent(new Event('agridirect_complaints_updated'));
    return { success: true, complaint: newComplaint };
  } catch (err) {
    console.error('Failed to submit complaint:', err);
    return { success: false, error: err.message };
  }
}

export function updateComplaintStatus(id, newStatus, adminNote = '') {
  try {
    const existing = getComplaints();
    const updated = existing.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: newStatus,
          adminNote: adminNote || item.adminNote,
          updatedDate: new Date().toLocaleString('en-IN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          }),
        };
      }
      return item;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Patch to backend
    api.patch(`/complaints/${id}/status`, { status: newStatus, adminNote }).then(() => {
      syncComplaintsFromBackend();
    }).catch(() => {});

    window.dispatchEvent(new Event('agridirect_complaints_updated'));
    return { success: true, updated };
  } catch (err) {
    console.error('Failed to update complaint:', err);
    return { success: false, error: err.message };
  }
}

// ─── ADMIN SUSPENSION OF REPORTED COUNTERPARTIES ─────────────────────────────
export function getSuspendedUsers() {
  try {
    const raw = localStorage.getItem(SUSPENDED_USERS_KEY);
    return raw ? JSON.parse(raw) : ['Kiran Traders'];
  } catch {
    return ['Kiran Traders'];
  }
}

export function isUserSuspended(userName) {
  if (!userName) return false;
  const list = getSuspendedUsers();
  const clean = userName.toLowerCase().trim();
  return list.some(u => u.toLowerCase().trim() === clean);
}

export function toggleSuspendReportedUser(complaintId, counterpartyName, reason = '') {
  try {
    if (!counterpartyName) return { success: false, error: 'No reported counterparty specified.' };
    const cleanName = counterpartyName.trim();
    const list = getSuspendedUsers();
    const alreadySuspended = isUserSuspended(cleanName);

    let updatedList;
    let isNowSuspended;

    if (alreadySuspended) {
      updatedList = list.filter(u => u.toLowerCase().trim() !== cleanName.toLowerCase());
      isNowSuspended = false;
    } else {
      updatedList = [...list, cleanName];
      isNowSuspended = true;
    }

    localStorage.setItem(SUSPENDED_USERS_KEY, JSON.stringify(updatedList));

    if (complaintId) {
      const existing = getComplaints();
      const actionTag = isNowSuspended
        ? `⛔ Reported party "${cleanName}" was SUSPENDED by Admin. (${reason || 'Enforced by Complaint Desk'})`
        : `Admin revoked suspension for "${cleanName}".`;

      const updatedComplaints = existing.map(item => {
        if (item.id === complaintId) {
          return {
            ...item,
            counterpartySuspended: isNowSuspended,
            adminNote: item.adminNote ? `${item.adminNote} | ${actionTag}` : actionTag,
          };
        }
        return item;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedComplaints));
    }

    // Call backend API suspension endpoint
    if (complaintId) {
      api.post(`/complaints/${complaintId}/suspend-counterparty`, { counterpartyName: cleanName, reason }).catch(() => {});
    }

    window.dispatchEvent(new CustomEvent('agridirect_user_suspended', { detail: { counterpartyName: cleanName, isNowSuspended } }));
    window.dispatchEvent(new Event('agridirect_complaints_updated'));

    return {
      success: true,
      isSuspended: isNowSuspended,
      message: isNowSuspended
        ? `⛔ Reported party "${cleanName}" has been SUSPENDED from Agri Direct.`
        : `✅ Account for "${cleanName}" has been reinstated.`,
    };
  } catch (err) {
    console.error('Failed to toggle suspension:', err);
    return { success: false, error: err.message };
  }
}
