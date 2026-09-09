import { useState, createContext, useContext } from 'react';

// ─── Auth Context ────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export const roles = {
  farmer: { id: 'farmer', label: 'Farmer', emoji: '👨‍🌾', color: '#4CAF50' },
  buyer:  { id: 'buyer',  label: 'Buyer',  emoji: '🏪',  color: '#F5A623' },
  admin:  { id: 'admin',  label: 'Admin',  emoji: '⚙️',  color: '#7C5CFF' },
};

// Mock credentials
export const mockCredentials = {
  farmer: { password: 'farmer123' },
  buyer:  { password: 'buyer123' },
  admin:  { email: 'admin@agridirect.com', password: 'admin@123' },
};

export const mockUsers = {
  farmer: { name: 'Ravi Kumar',  location: 'Vizag',  phone: '+91 98765 43210', verified: true, totalLots: 12, revenue: '₹2,45,000' },
  buyer:  { name: 'Srinivas M.', location: 'Guntur', phone: '+91 87654 32109', verified: true, totalPurchases: 28, spent: '₹8,50,000' },
  admin:  { name: 'Admin User',  location: 'AgriDirect HQ', phone: '+91 11111 11111', verified: true, accessLevel: 'Full System Access' },
};

// Restore session from localStorage or sessionStorage
function getSession() {
  try {
    const raw = localStorage.getItem('agridirect_session') || sessionStorage.getItem('agridirect_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const session = getSession();
  const [role, setRoleState]        = useState(session?.role || 'farmer');
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(session?.isLoggedIn));
  const [authUser, setAuthUser]     = useState(session?.user || null);

  const user = authUser || { ...mockUsers[role], role };

  // ── login ────────────────────────────────────────────────────────────────
  function login({ roleId = 'farmer', name, phone, email, password }) {
    // ── Admin Login ──
    if (roleId === 'admin') {
      const trimmedEmail = (email || '').trim().toLowerCase();
      const trimmedPass  = (password || '').trim();

      const isValidAdmin = (
        (trimmedEmail === 'admin@agridirect.com' || trimmedEmail.includes('admin')) &&
        (trimmedPass === 'admin@123' || trimmedPass === 'admin' || trimmedPass === 'admin123')
      );

      if (!isValidAdmin) {
        return {
          success: false,
          message: 'Invalid admin credentials. Use admin@agridirect.com and admin@123 (or click 1-Click Demo Admin).',
        };
      }

      const u = { ...mockUsers.admin, email: trimmedEmail, role: 'admin' };
      persist('admin', true, u);
      setRoleState('admin');
      setIsLoggedIn(true);
      setAuthUser(u);
      return { success: true, role: 'admin', user: u };
    }

    // ── Farmer / Buyer Login (Merged) ──
    const targetRole = roleId === 'buyer' ? 'buyer' : 'farmer';
    const trimmedPass = (password || '').trim();

    if (trimmedPass && trimmedPass !== 'farmer123' && trimmedPass !== 'buyer123' && trimmedPass.length < 3) {
      return { success: false, message: 'Password must be at least 3 characters.' };
    }

    const displayName = (name && name.trim().length >= 2)
      ? name.trim()
      : mockUsers[targetRole].name;

    const displayPhone = (phone && phone.trim())
      ? phone.trim()
      : mockUsers[targetRole].phone;

    const u = {
      ...mockUsers[targetRole],
      name: displayName,
      phone: displayPhone,
      role: targetRole,
    };

    persist(targetRole, true, u);
    setRoleState(targetRole);
    setIsLoggedIn(true);
    setAuthUser(u);
    return { success: true, role: targetRole, user: u };
  }

  // ── 1-Click Demo Login ───────────────────────────────────────────────────
  function demoLogin(targetRole = 'farmer') {
    const r = targetRole === 'admin' ? 'admin' : targetRole === 'buyer' ? 'buyer' : 'farmer';
    const u = { ...mockUsers[r], role: r };
    persist(r, true, u);
    setRoleState(r);
    setIsLoggedIn(true);
    setAuthUser(u);
    return { success: true, role: r, user: u };
  }

  // ── setRole (Backward compatibility + manual switch) ─────────────────────
  function setRole(newRole) {
    if (!roles[newRole]) return;
    setRoleState(newRole);
    const u = { ...(mockUsers[newRole] || mockUsers.farmer), role: newRole };
    setAuthUser(u);
    if (isLoggedIn) {
      persist(newRole, true, u);
    }
  }

  // ── logout (Completely and reliably clears state & storage) ──────────────
  function logout() {
    try {
      localStorage.removeItem('agridirect_session');
      sessionStorage.removeItem('agridirect_session');
    } catch (e) {
      console.warn('Storage cleanup error', e);
    }
    setRoleState('farmer');
    setIsLoggedIn(false);
    setAuthUser(null);
    return true;
  }

  function persist(roleId, loggedIn, u) {
    try {
      const data = JSON.stringify({
        role: roleId,
        isLoggedIn: loggedIn,
        user: u,
      });
      localStorage.setItem('agridirect_session', data);
      sessionStorage.setItem('agridirect_session', data);
    } catch (e) {
      console.warn('Storage persist error', e);
    }
  }

  return (
    <AuthContext.Provider value={{
      role,
      isLoggedIn,
      user,
      roles,
      login,
      demoLogin,
      logout,
      setRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
