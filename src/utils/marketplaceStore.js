import { mockListings } from '../data/mockAI';
import { api } from '../services/api';

const STORAGE_KEY = 'farmflow_published_listings';
const REMOVED_KEY = 'farmflow_removed_listing_ids';
let memoryCache = [];
let isInitialBackendFetchDone = false;

// Trigger background sync with backend API on module load
syncWithBackend();

async function syncWithBackend() {
  if (typeof window === 'undefined') return;
  try {
    const res = await api.get('/listings');
    if (res.ok && res.data?.success && Array.isArray(res.data.data)) {
      const backendLots = res.data.data;
      if (backendLots.length > 0) {
        memoryCache = backendLots;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(backendLots));
        } catch {}
        isInitialBackendFetchDone = true;
        window.dispatchEvent(new Event('farmflow_listings_updated'));
      }
    }
  } catch (e) {
    console.warn('Backend sync note (using local cache):', e);
  }
}

export function getRemovedListingIds() {
  try {
    const raw = localStorage.getItem(REMOVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getStoredListings() {
  try {
    const removedIds = getRemovedListingIds();
    const raw = localStorage.getItem(STORAGE_KEY);
    const custom = raw ? JSON.parse(raw) : memoryCache;
    let combined = [];

    if (Array.isArray(custom) && custom.length > 0) {
      memoryCache = custom;
      combined = [...custom, ...mockListings];
    } else {
      combined = memoryCache.length > 0 ? [...memoryCache, ...mockListings] : mockListings;
    }

    // Deduplicate by unique ID
    const uniqueMap = new Map();
    for (const item of combined) {
      if (item && item.id && !uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }
    const deduplicated = Array.from(uniqueMap.values());

    // Filter out any listing removed by Admin
    return deduplicated.filter(l => !removedIds.includes(l.id) && l.status !== 'removed_by_admin');
  } catch (err) {
    console.error('Failed to load published listings from localStorage:', err);
    const removedIds = getRemovedListingIds();
    const uniqueMap = new Map();
    const all = [...memoryCache, ...mockListings];
    for (const item of all) {
      if (item && item.id && !uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }
    return Array.from(uniqueMap.values()).filter(l => !removedIds.includes(l.id));
  }
}

export function saveNewListing(newLot) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : memoryCache;
    const custom = Array.isArray(existing) ? existing : [];
    // Ensure unique ID
    const updated = [newLot, ...custom.filter(l => l.id !== newLot.id)];
    memoryCache = updated;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (storageErr) {
      console.warn('LocalStorage save warning (kept safely in memory):', storageErr);
    }

    // Async push to backend
    api.post('/listings', newLot).then(res => {
      if (res.ok) {
        syncWithBackend();
      }
    }).catch(e => console.warn('Could not sync new lot to backend:', e));

    window.dispatchEvent(new Event('farmflow_listings_updated'));
    const removedIds = getRemovedListingIds();
    return [...updated, ...mockListings].filter(l => !removedIds.includes(l.id));
  } catch (err) {
    console.error('Failed to save published listing:', err);
    memoryCache = [newLot, ...memoryCache];
    window.dispatchEvent(new Event('farmflow_listings_updated'));
    const removedIds = getRemovedListingIds();
    return [...memoryCache, ...mockListings].filter(l => !removedIds.includes(l.id));
  }
}

export function updateProduceListing(lotId, updatedFields) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : memoryCache;
    const custom = Array.isArray(existing) ? existing : [];
    const updated = custom.map(l => l.id === lotId ? { ...l, ...updatedFields } : l);
    memoryCache = updated;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage update warning:', e);
    }

    // Async push update to backend
    api.patch(`/listings/${lotId}`, updatedFields).then(res => {
      if (res.ok) {
        syncWithBackend();
      }
    }).catch(e => console.warn('Could not sync update to backend:', e));

    window.dispatchEvent(new Event('farmflow_listings_updated'));
    const removedIds = getRemovedListingIds();
    return [...updated, ...mockListings].filter(l => !removedIds.includes(l.id));
  } catch (err) {
    console.error('Failed to update listing:', err);
    return getStoredListings();
  }
}

export function removeCustomListing(lotId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : memoryCache;
    const custom = Array.isArray(existing) ? existing : [];
    const updated = custom.filter(l => l.id !== lotId);
    memoryCache = updated;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage remove warning:', e);
    }

    // Async delete from backend
    api.delete(`/listings/${lotId}`).catch(() => {});

    window.dispatchEvent(new Event('farmflow_listings_updated'));
    const removedIds = getRemovedListingIds();
    return [...updated, ...mockListings].filter(l => !removedIds.includes(l.id));
  } catch (err) {
    console.error('Failed to remove custom listing:', err);
    memoryCache = memoryCache.filter(l => l.id !== lotId);
    window.dispatchEvent(new Event('farmflow_listings_updated'));
    const removedIds = getRemovedListingIds();
    return [...memoryCache, ...mockListings].filter(l => !removedIds.includes(l.id));
  }
}

// Admin action: remove fraudulent or suspicious listing
export function removeListing(lotId, reason = 'Fraudulent / suspicious activity') {
  try {
    const removed = getRemovedListingIds();
    if (!removed.includes(lotId)) {
      removed.push(lotId);
      localStorage.setItem(REMOVED_KEY, JSON.stringify(removed));
    }
    removeCustomListing(lotId);

    // Call backend admin purge endpoint
    api.delete(`/admin/listings/${lotId}`, { reason }).then(res => {
      syncWithBackend();
    }).catch(() => {});

    window.dispatchEvent(new CustomEvent('farmflow_listing_removed', { detail: { lotId, reason } }));
    window.dispatchEvent(new Event('farmflow_listings_updated'));
    return { success: true, message: `Listing ${lotId} has been removed by Admin as fraudulent.` };
  } catch (err) {
    console.error('Failed to remove listing:', err);
    return { success: false, message: 'Could not remove listing.' };
  }
}
