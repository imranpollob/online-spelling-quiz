import React, { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import ToolsLauncher from './ToolsLauncher';
import brandLogo from '../assets/brand-logo.png';
import './SiteHeader.css';

export default function SiteHeader({ user, isAuthenticated, darkMode, onToggleTheme, onLogout, onLogin }) {
  const accountRef = useRef(null);
  const location = useLocation();
  const name = user?.displayName || user?.email?.split('@')[0] || 'Guest';
  const isAdmin = user?.email === 'polboy777@gmail.com';

  useEffect(() => {
    if (accountRef.current) accountRef.current.open = false;
  }, [location.pathname]);

  useEffect(() => {
    const dismiss = event => {
      const account = accountRef.current;
      if (!account?.open) return;
      if (event.type === 'keydown' && event.key === 'Escape') {
        account.open = false;
        account.querySelector('summary').focus();
      } else if (event.type === 'pointerdown' && !account.contains(event.target)) account.open = false;
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismiss);
    };
  }, []);

  return <header className="site-header">
    <div className="site-header-inner">
      <Link to="/" className="site-brand" aria-label="SpellingQuiz home">
        <img src={brandLogo} alt="" width="40" height="40" />
        <span>Spelling<span>Quiz</span></span>
      </Link>
      <nav className="site-navigation" aria-label="Main navigation">
        <NavLink end to="/">Home</NavLink>
        <NavLink to="/quiz">Practice</NavLink>
        <NavLink to="/words">Word library</NavLink>
      </nav>
      <div className="site-utilities">
        <button className="site-icon-button" type="button" onClick={onToggleTheme}
          aria-label="Toggle dark mode" aria-pressed={darkMode} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {darkMode ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />}
          </svg>
        </button>
        {isAuthenticated ? <details className="site-account" ref={accountRef}>
          <summary aria-label={`Account: ${name}`} title="Your account">
            <span className="site-avatar">{name[0].toUpperCase()}</span>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
          </summary>
          <div className="site-account-panel">
            <div className="site-account-info"><strong>{name}</strong><span>{isAdmin ? 'Administrator' : user?.isAnonymous ? 'Guest account' : 'Your account'}</span></div>
            {isAdmin && <Link to="/admin">Manage library <span aria-hidden="true">↗</span></Link>}
            <button type="button" onClick={() => { accountRef.current.open = false; onLogout(); }}>Sign out</button>
          </div>
        </details> : <button className="site-sign-in" type="button" onClick={onLogin}>Sign in</button>}
        <span className="site-utility-divider" aria-hidden="true" />
        <ToolsLauncher />
      </div>
    </div>
  </header>;
}
