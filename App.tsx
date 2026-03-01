import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Settings, Plus, LogOut, Disc, Users, Building2, MessageSquare, StickyNote, CreditCard } from 'lucide-react';
import { TourProvider } from './context/TourContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import Logistics from './pages/Logistics';
import TransportDetails from './pages/TransportDetails';
import VenueDetails from './pages/VenueDetails';
import Team from './pages/Team';
import Login from './pages/Login';
import TourCities from './pages/TourCities';
import Venues from './pages/Venues';
import VenueProfile from './pages/VenueProfile';
import Messages from './pages/Messages';
import Events from './pages/Events';
import SettingsPage from './pages/Settings';
import Notes from './pages/Notes';
import Billing from './pages/Billing';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen bg-background text-text">Cargando...</div>;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};


const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logOut } = useAuth();

  const handleLogout = async () => {
    await logOut();
    navigate('/');
  };

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Panel', path: '/dashboard' },
    { icon: <Calendar size={20} />, label: 'Eventos', path: '/events' },
    { icon: <Building2 size={20} />, label: 'Recintos', path: '/venues' },
    { icon: <Users size={20} />, label: 'Equipo', path: '/team' },
    { icon: <StickyNote size={20} />, label: 'Tareas', path: '/notes' },
    { icon: <MessageSquare size={20} />, label: 'Mensajes', path: '/messages' },
    { icon: <CreditCard size={20} />, label: 'Suscripción', path: '/billing' },
    { icon: <Settings size={20} />, label: 'Ajustes', path: '/settings' },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col bg-surface border-r border-border h-full shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
          <Disc className="text-text animate-spin-slow" size={20} />
        </div>
        <span className="font-bold text-lg tracking-tight text-text">TourCommand</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 px-4">Menú</div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-medium text-sm group ${isActive
                ? 'bg-primary text-text shadow-lg shadow-primary/20'
                : 'text-muted hover:text-text hover:bg-surface'
                }`}
            >
              <span className={`transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-background rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors border border-border">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
            alt="User"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}
            </p>
            <p className="text-xs text-muted truncate">
              {user?.user_metadata?.role || 'Tour Manager'}
            </p>
          </div>
          <button onClick={handleLogout} title="Cerrar Sesión">
            <LogOut size={16} className="text-muted hover:text-text transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  );
};

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide bottom nav on specific flows like "Create Event" or Login
  if (location.pathname === '/create') return null;

  const navItems = [
    { icon: <LayoutDashboard size={24} />, label: 'Panel', path: '/dashboard' },
    { icon: <Calendar size={24} />, label: 'Eventos', path: '/events' },
    { icon: <StickyNote size={24} />, label: 'Tareas', path: '/notes' },
    { icon: <MessageSquare size={24} />, label: 'Mensajes', path: '/messages' },
    { icon: <Users size={24} />, label: 'Equipo', path: '/team' },
  ];

  return (
    <>
      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-24 right-4 z-30 md:hidden">
        <button
          onClick={() => navigate('/create')}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-text shadow-lg shadow-blue-900/40 hover:bg-blue-600 transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={32} />
        </button>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border pb-safe pt-2">
        <div className="flex justify-around items-center pb-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-gray-300'
                  }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-background text-text">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
    </div>;
  }

  // If user is authenticated and tries to access login, redirect to dashboard
  if (user && location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  // Simple layout logic: if user is logged in, show sidebar (except on mobile create)
  const isLoginPage = !user;

  return (
    <div className="flex h-screen w-full bg-background text-text overflow-hidden font-sans">
      {!isLoginPage && <Sidebar />}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth bg-background">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
            <Route path="/cities" element={<ProtectedRoute><TourCities /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/logistics" element={<ProtectedRoute><Logistics /></ProtectedRoute>} />
            <Route path="/transport/:id" element={<ProtectedRoute><TransportDetails /></ProtectedRoute>} />
            <Route path="/venue" element={<ProtectedRoute><VenueDetails /></ProtectedRoute>} />
            <Route path="/venues" element={<ProtectedRoute><Venues /></ProtectedRoute>} />
            <Route path="/venues/:id" element={<ProtectedRoute><VenueProfile /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        {!isLoginPage && <MobileNav />}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TourProvider>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </TourProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;