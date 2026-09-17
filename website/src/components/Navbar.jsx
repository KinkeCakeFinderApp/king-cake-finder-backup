import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SITE_NAME } from '../config';

export default function Navbar() {
  const { isAuthenticated, isSuperuser, profile, logOut } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  const handleLogout = async () => { await logOut(); navigate('/'); };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <img src="/favicon.svg" alt="" className="logo" />
          <span>{SITE_NAME}</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/search" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Search</NavLink>
          <NavLink to="/map" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Map</NavLink>
          {isAuthenticated && (
            <NavLink to="/favorites" className={({ isActive }) => `nav-link${isActive ? ' active' : ''} hide-mobile`}>Favorites</NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/to-taste" className={({ isActive }) => `nav-link${isActive ? ' active' : ''} hide-mobile`}>To Taste</NavLink>
          )}
          {isSuperuser && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Admin</NavLink>
          )}

          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button className="chip" onClick={() => setMenu((m) => !m)} aria-haspopup="true" aria-expanded={menu}>
                {(profile?.firstName || profile?.username || 'Account')} ▾
              </button>
              {menu && (
                <div
                  className="card"
                  style={{ position: 'absolute', right: 0, top: 46, width: 190, padding: 8, zIndex: 60 }}
                  onMouseLeave={() => setMenu(false)}
                >
                  <Link className="nav-link" style={{ display: 'block' }} to="/favorites" onClick={() => setMenu(false)}>Favorites</Link>
                  <Link className="nav-link" style={{ display: 'block' }} to="/to-taste" onClick={() => setMenu(false)}>To Taste</Link>
                  <Link className="nav-link" style={{ display: 'block' }} to="/account" onClick={() => setMenu(false)}>Account</Link>
                  <button className="nav-link" style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none' }} onClick={handleLogout}>Log out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn sm">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
