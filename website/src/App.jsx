import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { isFirebaseConfigured } from './firebase';

import Navbar from './components/Navbar';
import SponsorBar from './components/SponsorBar';
import Footer from './components/Footer';
import AppDownloadPopup from './components/AppDownloadPopup';
import CookieConsent from './components/CookieConsent';
import AdsenseLoader from './components/AdsenseLoader';

import Home from './pages/Home';
import Search from './pages/Search';
import MapPage from './pages/Map';
import BakeryDetail from './pages/BakeryDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Favorites from './pages/Favorites';
import ToTaste from './pages/ToTaste';
import Account from './pages/Account';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function ConfigNotice() {
  return (
    <div className="container page center" style={{ maxWidth: 560 }}>
      <div style={{ fontSize: '3rem' }}>⚙️</div>
      <h1 className="h2 mt-2">One quick setup step</h1>
      <p className="muted">
        Paste your Firebase web config into <code>src/firebase.js</code> (use the same project as
        the mobile app), then reload. Everything else is ready.
      </p>
    </div>
  );
}

export default function App() {
  if (!isFirebaseConfigured()) return <ConfigNotice />;

  return (
    <AuthProvider>
      <DataProvider>
        <ScrollToTop />
        <AdsenseLoader />
        <SponsorBar />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/bakery/:id" element={<BakeryDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/to-taste" element={<ToTaste />} />
            <Route path="/account" element={<Account />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <CookieConsent />
        <AppDownloadPopup />
      </DataProvider>
    </AuthProvider>
  );
}
