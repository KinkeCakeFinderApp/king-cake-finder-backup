import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getConsent, setConsent } from '../lib/consent';

/** Cookie/consent notice required because the site runs ad (AdSense) cookies. */
export default function CookieConsent() {
  const [choice, setChoice] = useState(() => getConsent());
  if (choice) return null;

  const decide = (value) => { setConsent(value); setChoice(value); };

  return (
    <div className="cookie" role="region" aria-label="Cookie consent">
      <div className="txt">
        We use cookies for basic functionality and, with your consent, for ads that keep this
        site free. See our <Link to="/privacy">Privacy Policy</Link>.
      </div>
      <div className="row gap-1">
        <button className="btn ghost sm" style={{ color: '#F3EEF7', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => decide('declined')}>Decline</button>
        <button className="btn green sm" onClick={() => decide('accepted')}>Accept</button>
      </div>
    </div>
  );
}
