import { mockListings } from '../data/mockAI';

const STORAGE_KEY = 'farmflow_published_listings';
const REMOVED_KEY = 'farmflow_removed_listing_ids';
let memoryCache = [];

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

    // Filter out any listing removed by Admin
    return combined.filter(l => !removedIds.includes(l.id));
  } catch (err) {
    console.error('Failed to load published listings from localStorage:', err);
    const removedIds = getRemovedListingIds();
    const combined = memoryCache.length > 0 ? [...memoryCache, ...mockListings] : mockListings;
    return combined.filter(l => !removedIds.includes(l.id));
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
    window.dispatchEvent(new CustomEvent('farmflow_listing_removed', { detail: { lotId, reason } }));
    window.dispatchEvent(new Event('farmflow_listings_updated'));
    return { success: true, message: `Listing ${lotId} has been removed by Admin as fraudulent.` };
  } catch (err) {
    console.error('Failed to remove listing:', err);
    return { success: false, message: 'Could not remove listing.' };
  }
}
