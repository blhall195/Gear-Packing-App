import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="header-title">Trip Packing List</Link>
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
        </nav>
      </header>
      <main className={location.pathname === '/' ? 'main' : 'main main-wide'}>
        <Outlet />
      </main>
    </div>
  );
}
