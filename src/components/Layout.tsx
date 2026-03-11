import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const THEME_KEY = 'theme';

function getInitialTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* ignore */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function Layout() {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <Link to="/" className="header-title">Trip Packing List Generator</Link>
        </div>
        <nav className="header-nav">
          <Link
            to="/"
            className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
          >
            Pack
          </Link>
          <Link
            to="/editor"
            className={location.pathname === '/editor' ? 'nav-link active' : 'nav-link'}
          >
            Gear Editor
          </Link>
          <Link
            to="/questions"
            className={location.pathname === '/questions' ? 'nav-link active' : 'nav-link'}
          >
            Question Editor
          </Link>
          <Link
            to="/help"
            className={location.pathname === '/help' ? 'help-btn active' : 'help-btn'}
            title="Help"
          >
            ?
          </Link>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? '\u263E' : '\u2600'}
          </button>
        </nav>
      </header>
      <main className={location.pathname === '/' ? 'main' : 'main main-wide'}>
        <Outlet />
      </main>
    </div>
  );
}
