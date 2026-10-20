import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Words from "./Words";
import Quiz from "./Quiz";
import Home from "./Home";
import Login from "./Login";
import Migration from "./Migration";
import SiteHeader from "./SiteHeader";
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
      <SiteHeader user={user} isAuthenticated={isAuthenticated} darkMode={darkMode}
        onToggleTheme={toggleDarkMode} onLogout={handleLogout}
        onLogin={() => setShowLoginModal(true)} />

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/words" element={<Words onRequestLogin={() => setShowLoginModal(true)} />} />
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
