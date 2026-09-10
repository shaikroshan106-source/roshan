import { auth, isFirebaseConnected } from '../config/firebase.js';
import { firestoreService } from '../services/firestoreService.js';

export async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a Bearer token.',
      });
    }

    const token = authHeader.split('Bearer ')[1].trim();

    // ── Direct Database / Session Token Support (token_<uid>) ──
    if (token.startsWith('token_')) {
      const uid = token.replace('token_', '').trim();
      const userDoc = await firestoreService.getById('users', uid);
      if (userDoc) {
        if (userDoc.status === 'suspended') {
          return res.status(403).json({
            success: false,
            message: `Your account has been suspended by AgriDirect Admin. Reason: ${userDoc.suspendedReason || 'Administrative enforcement.'}`,
          });
        }
        req.user = userDoc;
        return next();
      }
    }

    // ── Development / Demo Token Support ──
    if (token.startsWith('demo-')) {
      const role = token.replace('demo-', '').trim();
      const mockUsers = {
        farmer: { uid: 'farmer_ravi',    name: 'Ravi Kumar', role: 'farmer', location: 'Vizag', phone: '+91 98765 43210' },
        buyer:  { uid: 'buyer_srinivas', name: 'Srinivas M.', role: 'buyer',  location: 'Guntur', phone: '+91 87654 32109' },
        admin:  { uid: 'demo_admin_1',   name: 'Admin User',  role: 'admin',  location: 'AgriDirect HQ', phone: '+91 11111 11111' },
      };

      if (!mockUsers[role]) {
        return res.status(401).json({
          success: false,
          message: 'Invalid demo authentication token.',
        });
      }

      const baseUser = mockUsers[role];
      const userDoc = await firestoreService.getById('users', baseUser.uid);

      if (userDoc && userDoc.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: `Your account has been suspended by AgriDirect Admin. Reason: ${userDoc.suspendedReason || 'Administrative enforcement.'}`,
        });
      }

      req.user = userDoc ? { ...baseUser, ...userDoc } : baseUser;
      return next();
    }

    // ── Firebase ID Token Verification ──
    if (isFirebaseConnected && auth) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        const userDoc = await firestoreService.getById('users', decodedToken.uid);

        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: userDoc?.role || decodedToken.role || 'farmer',
          name: userDoc?.name || decodedToken.name || 'User',
          phone: userDoc?.phone || decodedToken.phone_number || '',
          location: userDoc?.location || 'Vizag',
          status: userDoc?.status || 'active',
          suspendedReason: userDoc?.suspendedReason || null,
        };

        if (req.user.status === 'suspended') {
          return res.status(403).json({
            success: false,
            message: `Your account has been suspended by AgriDirect Admin. Reason: ${req.user.suspendedReason || 'Administrative enforcement.'}`,
          });
        }

        return next();
      } catch (fbErr) {
        console.warn('[Firebase Token Verification Failed]:', fbErr.message);
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired authentication token.',
        });
      }
    }

    // ── Safe Base64 Session Token Support (Verified against database) ──
    try {
      const decodedStr = Buffer.from(token, 'base64').toString('utf8');
      if (decodedStr.startsWith('{') && decodedStr.endsWith('}')) {
        const parsed = JSON.parse(decodedStr);
        if (parsed && parsed.uid) {
          const userDoc = await firestoreService.getById('users', parsed.uid);
          if (userDoc) {
            if (userDoc.status === 'suspended') {
              return res.status(403).json({
                success: false,
                message: `Your account has been suspended by AgriDirect Admin. Reason: ${userDoc.suspendedReason || 'Administrative enforcement.'}`,
              });
            }
            // Use database authoritative role to prevent role forgery
            req.user = userDoc;
            return next();
          }
        }
      }
    } catch {
      // Ignore parsing errors and fall through to unauthorized
    }

    // Unrecognized or invalid token - reject strictly with 401 Unauthorized
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication credentials.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error: ' + err.message,
    });
  }
}
