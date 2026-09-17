import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container page center">
      <div style={{ fontSize: '3rem' }}>🧁</div>
      <h1 className="h2 mt-2">Page not found</h1>
      <p className="muted">That page doesn't exist.</p>
      <Link className="btn mt-2" to="/">Go home</Link>
    </div>
  );
}
