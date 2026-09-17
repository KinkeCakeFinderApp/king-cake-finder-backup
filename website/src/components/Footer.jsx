import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_NAME } from '../config';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="cols">
          <div style={{ maxWidth: 280 }}>
            <div className="brand" style={{ marginBottom: 8 }}>
              <img src="/favicon.svg" alt="" className="logo" />
              <span>{SITE_NAME}</span>
            </div>
            <p className="small muted">Find the best king cakes near you — a Louisiana tradition. Rate, review, and save your favorites.</p>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Explore</div>
            <Link to="/">Home</Link>
            <Link to="/search">Search bakeries</Link>
            <Link to="/favorites">Your favorites</Link>
            <Link to="/about">About</Link>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Account</div>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
            <Link to="/account">Manage account</Link>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Legal</div>
            <Link to="/privacy">Privacy policy</Link>
            <Link to="/terms">Terms of service</Link>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Support</div>
            <a href="mailto:Kingcakeknives@gmail.com">Kingcakeknives@gmail.com</a>
          </div>
        </div>
        <div className="small faint mt-3">© {new Date().getFullYear()} {SITE_NAME}. Ads on this site help keep it free.</div>
      </div>
    </footer>
  );
}
