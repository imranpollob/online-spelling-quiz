import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
} from "react-router-dom";
import Words from "./Words";
import Quiz from "./Quiz";
import Home from "./Home";
import Login from "./Login";
import Migration from "./Migration";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { logOut } from "../services/authService";

// Component to protect routes that require authentication
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-gradient">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return children;
}

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Apply dark mode class and data-theme to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    // Save preference
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    // Close mobile menu when navigating
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = async () => {
    await logOut();
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Professional Navigation */}
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <img
                  src={`${process.env.PUBLIC_URL}/brand-logo.png`}
                  alt="IP Logo"
                  className="w-9 h-9 object-contain transition-transform group-hover:scale-105 drop-shadow-sm"
                />
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
                  Spelling<span className="text-primary-600 dark:text-primary-400">Quiz</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-brand-100/70 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300 font-semibold shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-brand-50/70 dark:hover:bg-brand-950/50 hover:text-brand-700 dark:hover:text-brand-300'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/quiz"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-brand-100/70 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300 font-semibold shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-brand-50/70 dark:hover:bg-brand-950/50 hover:text-brand-700 dark:hover:text-brand-300'
                  }`
                }
              >
                Quiz
              </NavLink>
              <NavLink
                to="/words"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-brand-100/70 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300 font-semibold shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-brand-50/70 dark:hover:bg-brand-950/50 hover:text-brand-700 dark:hover:text-brand-300'
                  }`
                }
              >
                Words
              </NavLink>

              {/* Admin-only link to migration page */}
              {isAuthenticated && user?.email === 'polboy777@gmail.com' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                      : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`
                  }
                >
                  🔧 Admin
                </NavLink>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="ml-2 p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* User Menu */}
              <div className="ml-4 pl-4 border-l border-slate-200 dark:border-slate-700 flex items-center gap-3">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-semibold">
                          {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'G'}
                        </span>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {user?.displayName || user?.email?.split('@')[0] || 'Guest'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {user?.email === 'polboy777@gmail.com' ? 'Admin' : (user?.isAnonymous ? 'Guest' : 'User')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-md shadow-brand-600/20"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            </div>

            {/* Mobile controls */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 dark:border-slate-700 pt-3 pb-4 space-y-3">
              <div className="flex flex-col gap-2">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium ${isActive
                      ? 'bg-brand-100/70 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300 font-semibold shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-brand-50/70 dark:hover:bg-brand-950/50 hover:text-brand-700 dark:hover:text-brand-300'
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/quiz"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium ${isActive
                      ? 'bg-brand-100/70 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300 font-semibold shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-brand-50/70 dark:hover:bg-brand-950/50 hover:text-brand-700 dark:hover:text-brand-300'
                    }`
                  }
                >
                  Quiz
                </NavLink>
                <NavLink
                  to="/words"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium ${isActive
                      ? 'bg-brand-100/70 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300 font-semibold shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-brand-50/70 dark:hover:bg-brand-950/50 hover:text-brand-700 dark:hover:text-brand-300'
                    }`
                  }
                >
                  Words
                </NavLink>

                {/* Admin-only link to migration page */}
                {isAuthenticated && user?.email === 'polboy777@gmail.com' && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                        : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                      }`
                    }
                  >
                    🔧 Admin
                  </NavLink>
                )}
              </div>

              <div className="flex items-center justify-between px-2 pt-2">
                <div className="flex items-center gap-3">
                  {isAuthenticated ? (
                    <>
                      <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-semibold">
                          {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'G'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {user?.displayName || user?.email?.split('@')[0] || 'Guest'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {user?.email === 'polboy777@gmail.com' ? 'Admin' : (user?.isAnonymous ? 'Guest' : 'User')}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Welcome!</p>
                  )}
                </div>
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-md shadow-brand-600/20"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/words" element={<Words />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Migration />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Home />} />
        </Routes>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseLogin}>
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <Login onClose={handleCloseLogin} />
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename={process.env.PUBLIC_URL}>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
