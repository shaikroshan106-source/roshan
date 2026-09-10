import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FarmAIChat from './components/FarmAIChat';
import GoogleVoiceAssistant from './components/GoogleVoiceAssistant';

import Home           from './pages/Home';
import Problem        from './pages/Problem';
import Marketplace    from './pages/Marketplace';
import Dashboard      from './pages/Dashboard';
import Bidding        from './pages/Bidding';
import Logistics      from './pages/Logistics';
import Report         from './pages/Report';
import Login          from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* ── Public routes ───────────────────────────── */}
          <Route path="/"        element={<Home />} />
          <Route path="/problem" element={<Problem />} />
          <Route path="/ai"      element={<Navigate to="/marketplace" replace />} />
          <Route path="/login"   element={<Login />} />

          {/* ── Protected (Farmer & Buyer) ──────────────── */}
          <Route path="/report"      element={<ProtectedRoute allowedRoles={['farmer', 'buyer']}><Report /></ProtectedRoute>} />
          <Route path="/marketplace" element={<ProtectedRoute allowedRoles={['farmer', 'buyer']}><Marketplace /></ProtectedRoute>} />
          <Route path="/dashboard"   element={<ProtectedRoute allowedRoles={['farmer', 'buyer']}><Dashboard /></ProtectedRoute>} />
          <Route path="/bidding"     element={<ProtectedRoute allowedRoles={['farmer', 'buyer']}><Bidding /></ProtectedRoute>} />
          <Route path="/logistics"   element={<ProtectedRoute allowedRoles={['farmer', 'buyer']}><Logistics /></ProtectedRoute>} />

          {/* ── Admin only ──────────────────────────────── */}
          <Route path="/admin" element={<ProtectedRoute adminOnly allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        </Routes>
        <Footer />
        <FarmAIChat />
        <GoogleVoiceAssistant />
      </BrowserRouter>
    </AuthProvider>
  );
}
