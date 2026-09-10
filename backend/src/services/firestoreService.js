import fs from 'fs';
import path from 'path';
import { db, isFirebaseConnected } from '../config/firebase.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getLocalFilePath(collectionName) {
  return path.join(DATA_DIR, `${collectionName}.json`);
}

function readLocalCollection(collectionName) {
  const filePath = getLocalFilePath(collectionName);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error(`Error reading local collection ${collectionName}:`, e.message);
    return [];
  }
}

function writeLocalCollection(collectionName, items) {
  const filePath = getLocalFilePath(collectionName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8');
  } catch (e) {
    console.error(`Error writing local collection ${collectionName}:`, e.message);
  }
}

export const firestoreService = {
  async getAll(collectionName) {
    if (isFirebaseConnected && db) {
      try {
        const fetchPromise = db.collection(collectionName).get();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firestore operation timeout')), 500)
        );
        const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
        if (snapshot && !snapshot.empty) {
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        // Fallback directly to local collection without waiting
      }
    }
    return readLocalCollection(collectionName);
  },

  async getById(collectionName, docId) {
    if (isFirebaseConnected && db) {
      try {
        const fetchPromise = db.collection(collectionName).doc(docId).get();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firestore operation timeout')), 500)
        );
        const doc = await Promise.race([fetchPromise, timeoutPromise]);
        if (doc && doc.exists) {
          return { id: doc.id, ...doc.data() };
        }
      } catch (err) {
        // Fallback directly to local collection
      }
    }
    const items = readLocalCollection(collectionName);
    return items.find(item => item.id === docId) || null;
  },

  async set(collectionName, docId, data) {
    const record = { ...data, id: docId, updatedAt: new Date().toISOString() };
    if (!record.createdAt) {
      record.createdAt = new Date().toISOString();
    }

    if (isFirebaseConnected && db) {
      try {
        await db.collection(collectionName).doc(docId).set(record, { merge: true });
      } catch (err) {
        console.warn(`[Firestore Set Warning for ${collectionName}/${docId}]:`, err.message);
      }
    }

    // Also persist locally for fast cache & fallback
    const items = readLocalCollection(collectionName);
    const index = items.findIndex(i => i.id === docId);
    if (index >= 0) {
      items[index] = { ...items[index], ...record };
    } else {
      items.unshift(record);
    }
    writeLocalCollection(collectionName, items);
    return record;
  },

  async update(collectionName, docId, updates) {
    const existing = await this.getById(collectionName, docId);
    if (!existing) {
      return null;
    }
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    if (isFirebaseConnected && db) {
      try {
        await db.collection(collectionName).doc(docId).update(updates);
      } catch (err) {
        console.warn(`[Firestore Update Warning for ${collectionName}/${docId}]:`, err.message);
      }
    }

    const items = readLocalCollection(collectionName);
    const index = items.findIndex(i => i.id === docId);
    if (index >= 0) {
      items[index] = updated;
    }
    writeLocalCollection(collectionName, items);
    return updated;
  },

  async delete(collectionName, docId) {
    if (isFirebaseConnected && db) {
      try {
        await db.collection(collectionName).doc(docId).delete();
      } catch (err) {
        console.warn(`[Firestore Delete Warning for ${collectionName}/${docId}]:`, err.message);
      }
    }

    const items = readLocalCollection(collectionName);
    const filtered = items.filter(i => i.id !== docId);
    writeLocalCollection(collectionName, filtered);
    return true;
  },

  async query(collectionName, filterFn) {
    const items = await this.getAll(collectionName);
    return typeof filterFn === 'function' ? items.filter(filterFn) : items;
  }
};
