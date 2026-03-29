import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import API from "./api";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddQuestion from "./pages/AddQuestion";
import StatsPage from "./pages/StatsPage";
import History from "./pages/History";
import SettingsPage from "./pages/SettingsPage";
import ExtensionPage from "./pages/ExtensionPage";
import ExtensionAuth from "./pages/ExtensionAuth";
import logoImage from './assets/logo.png';

import { Home, Plus, BarChart3, History as HistoryIcon, Settings, ChevronDown, LogOut, Menu, X, Puzzle } from 'lucide-react';

function App() {
  const { user, logout, loading } = useAuth();
  const [userName, setUserName] = useState("User");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const response = await API.get("/profile");
        setUserName(response.data.name);
        localStorage.setItem("userName", response.data.name);
      } catch (err) {
        // silently ignore profile fetch errors
      }
    };

    if (user) {
      fetchUserName();
    }
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-xl text-gray-200">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<Register goToLogin={() => navigate("/login")} />} />
        <Route path="/login" element={<Login goToRegister={() => navigate("/register")} />} />
        {/* Public route — opened by the Chrome extension for OAuth handoff */}
        <Route path="/extension-auth" element={<ExtensionAuth />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const navigation = [
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: Home },
    { id: 'add', path: '/add', label: 'Add Question', icon: Plus },
    { id: 'stats', path: '/stats', label: 'Stats', icon: BarChart3 },
    { id: 'history', path: '/history', label: 'History', icon: HistoryIcon },
    { id: 'extension', path: '/extension', label: 'Extension', icon: Puzzle },
    { id: 'settings', path: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="hidden lg:flex w-64 bg-gray-900 border-r border-gray-800 flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <img
              src={logoImage}
              alt="CodeRecall Logo"
              className="h-15 w-auto"
            />
            <span className="text-2xl font-bold text-white">CodeRecall</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{userName}</div>
                  <div className="text-xs text-gray-400">Member</div>
                </div>
              </div>
              <ChevronDown className="text-gray-400" size={20} />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-700 transition"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`fixed inset-y-0 left-0 w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-50 transform transition-transform duration-300 lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={logoImage}
                alt="CodeRecall Logo"
                className="h-15 w-auto"
              />
              <span className="text-2xl font-bold text-white">CodeRecall</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{userName}</div>
                  <div className="text-xs text-gray-400">Member</div>
                </div>
              </div>
              <ChevronDown className="text-gray-400" size={20} />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-700 transition"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="lg:hidden bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <img
                src={logoImage}
                alt="CodeRecall Logo"
                className="h-8 w-auto"
              />
              <span className="text-lg font-bold text-white">CodeRecall</span>
            </div>
            <div className="w-6" />
          </div>
        </div>

        <Routes>
          <Route path="/" element={<Dashboard userName={userName} />} />
          <Route path="/add" element={<AddQuestion />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/history" element={<History />} />
          <Route path="/extension" element={<ExtensionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Also accessible when logged in (user may already be signed in) */}
          <Route path="/extension-auth" element={<ExtensionAuth />} />
          <Route path="/revise" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;