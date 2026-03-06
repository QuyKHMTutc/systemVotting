import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreatePoll from './pages/CreatePoll';
import PollDetail from './pages/PollDetail';
import AdminPanel from './pages/AdminPanel';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireRole }: { children: React.ReactNode, requireRole?: string }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // If the route requires a specific role (like USER) but the user has a different role (like ADMIN)
  if (requireRole && user?.role !== requireRole) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user?.role === 'USER') return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={
              <ProtectedRoute requireRole="USER">
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/create-poll" element={
              <ProtectedRoute requireRole="USER">
                <CreatePoll />
              </ProtectedRoute>
            } />

            <Route path="/poll/:id" element={
              <ProtectedRoute requireRole="USER">
                <PollDetail />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute requireRole="ADMIN">
                <AdminPanel />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
