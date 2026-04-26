import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CreatePoll from './pages/CreatePoll';
import PollDetail from './pages/PollDetail';
import AdminPanel from './pages/AdminPanel';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { Profile } from './pages/Profile';
import PaymentResult from './pages/PaymentResult';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireRole }: { children: React.ReactNode, requireRole?: string }) => {
  const { isAuthenticated, isInitializing, user } = useAuth();

  // Chờ AuthContext khởi tạo xong (sync token từ localStorage / gọi /auth/me)
  // Nếu render quá sớm, token state vẫn là null dù localStorage có token
  // → isAuthenticated = false → bị redirect sai về /login
  if (isInitializing) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Nếu route yêu cầu role cụ thể nhưng user có role khác → redirect đúng trang
  if (requireRole && user?.role !== requireRole) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user?.role === 'USER') return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public Route: redirect authenticated users away from login/register
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) return null;

  if (isAuthenticated) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const ConditionalFooter = () => {
  const location = useLocation();
  const noFooterRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/admin'];
  
  if (noFooterRoutes.includes(location.pathname)) {
    return null;
  }
  
  return <Footer />;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
          <div className="min-h-screen flex flex-col">
            <div className="flex-grow flex flex-col relative z-0">
              <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Dashboard />} />

            <Route path="/create-poll" element={
              <ProtectedRoute requireRole="USER">
                <CreatePoll />
              </ProtectedRoute>
            } />

            <Route path="/poll/:id" element={<PollDetail />} />
            <Route path="/payment-result" element={<PaymentResult />} />

            <Route path="/admin" element={
              <ProtectedRoute requireRole="ADMIN">
                <AdminPanel />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute requireRole="USER">
                <Profile />
              </ProtectedRoute>
            } />
            </Routes>
            </div>
            <ScrollToTop />
            <ConditionalFooter />
          </div>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
