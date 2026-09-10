import { useState, useEffect, createContext, useContext } from 'react';
import { BASE_URL } from '../services/api';

// ─── Auth Context ────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export const roles = {
  farmer: { id: 'farmer', label: 'Farmer', emoji: '👨‍🌾', color: '#4CAF50' },
  buyer:  { id: 'buyer',  label: 'Buyer',  emoji: '🏪',  color: '#F5A623' },
  admin:  { id: 'admin',  label: 'Admin',  emoji: '⚙️',  color: '#7C5CFF' },
};

// Fallback seed profiles
export const mockUsers = {
  farmer: { uid: 'farmer_ravi', name: 'Ravi Kumar',  location: 'Vizag',  phone: '+91 98765 43210', email: 'ravi.kumar@apfarms.in', verified: true, totalLots: 12, revenue: '₹2,45,000', role: 'farmer' },
  buyer:  { uid: 'buyer_srinivas', name: 'Srinivas M.', location: 'Guntur', phone: '+91 87654 32109', email: 'procurement@srinivasagro.com', verified: true, totalPurchases: 28, spent: '₹8,50,000', role: 'buyer' },
  admin:  { uid: 'demo_admin_hq', name: 'Admin User',  location: 'AgriDirect HQ', phone: '+91 11111 11111', email: 'admin@agridirect.com', verified: true, accessLevel: 'Full System Access', role: 'admin' },
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
  const [authToken, setAuthToken]   = useState(session?.token || null);

  const user = authUser || { ...mockUsers[role], role };

  // Validate session against backend on mount
  useEffect(() => {
    if (isLoggedIn && authToken) {
      fetch(`${BASE_URL}/auth/session`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.user) {
          setAuthUser(res.user);
          setRoleState(res.role || res.user.role);
          persist(res.role || res.user.role, true, res.user, authToken);
        } else if (res.status === 403) {
          // Account was suspended while logged in
          logout();
          alert(res.message || 'Your account has been suspended by Admin.');
        }
      })
      .catch(() => {
        // Offline / dev fallback: continue with existing cached user
      });
    }
  }, []);

  // ── register ─────────────────────────────────────────────────────────────
  async function register({ role = 'farmer', name, email, password, phone, location, companyName, businessType }) {
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          name,
          email,
          password,
          phone,
          location,
          companyName,
          businessType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Registration failed' };
      }

      const u = data.user;
      const targetRole = data.role || role;
      const token = data.token || `token_${u.uid}`;

      persist(targetRole, true, u, token);
      setRoleState(targetRole);
      setIsLoggedIn(true);
      setAuthUser(u);
      setAuthToken(token);

      return { success: true, role: targetRole, user: u, message: data.message };
    } catch (err) {
      // Local fallback in offline mode
      const targetRole = role.toLowerCase();
      const u = {
        uid: `user_${targetRole}_${Date.now()}`,
        name: name || 'User',
        email,
        phone: phone || '+91 98765 00000',
        role: targetRole,
        location: location || 'Vizag',
        verified: true,
      };
      persist(targetRole, true, u, `demo-${targetRole}`);
      setRoleState(targetRole);
      setIsLoggedIn(true);
      setAuthUser(u);
      setAuthToken(`demo-${targetRole}`);
      return { success: true, role: targetRole, user: u };
    }
  }

  // ── login ────────────────────────────────────────────────────────────────
  async function login({ roleId = 'farmer', name, phone, email, password }) {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId,
          email,
          phone,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Login failed' };
      }

      const u = data.user;
      const targetRole = data.role || roleId;
      const token = data.token || `token_${u.uid}`;

      persist(targetRole, true, u, token);
      setRoleState(targetRole);
      setIsLoggedIn(true);
      setAuthUser(u);
      setAuthToken(token);

      return { success: true, role: targetRole, user: u, message: data.message };
    } catch (err) {
      // Local fallback
      const targetRole = roleId === 'admin' ? 'admin' : roleId === 'buyer' ? 'buyer' : 'farmer';
      const u = { ...mockUsers[targetRole], role: targetRole, email: email || mockUsers[targetRole].email };
      persist(targetRole, true, u, `demo-${targetRole}`);
      setRoleState(targetRole);
      setIsLoggedIn(true);
      setAuthUser(u);
      setAuthToken(`demo-${targetRole}`);
      return { success: true, role: targetRole, user: u };
    }
  }

  // ── 1-Click Demo Login ───────────────────────────────────────────────────
  async function demoLogin(targetRole = 'farmer') {
    const r = targetRole === 'admin' ? 'admin' : targetRole === 'buyer' ? 'buyer' : 'farmer';
    const u = { ...mockUsers[r], role: r };
    const token = `demo-${r}`;

    persist(r, true, u, token);
    setRoleState(r);
    setIsLoggedIn(true);
    setAuthUser(u);
    setAuthToken(token);

    try {
      fetch(`${BASE_URL}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: r }),
      }).then(res => res.json()).then(data => {
        if (data.success && data.user) {
          setAuthUser(data.user);
          persist(r, true, data.user, data.token || token);
        }
      }).catch(() => {});
    } catch {}

    return { success: true, role: r, user: u };
  }

  // ── setRole (Backward compatibility) ─────────────────────────────────────
  function setRole(newRole) {
    if (!roles[newRole]) return;
    setRoleState(newRole);
    const u = { ...(mockUsers[newRole] || mockUsers.farmer), role: newRole };
    setAuthUser(u);
    if (isLoggedIn) {
      persist(newRole, true, u, authToken);
    }
  }

  // ── logout ───────────────────────────────────────────────────────────────
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
    setAuthToken(null);
    return true;
  }

  function persist(roleId, loggedIn, u, token) {
    try {
      const data = JSON.stringify({
        role: roleId,
        isLoggedIn: loggedIn,
        user: u,
        token: token || `demo-${roleId}`,
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
      token: authToken,
      roles,
      register,
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
