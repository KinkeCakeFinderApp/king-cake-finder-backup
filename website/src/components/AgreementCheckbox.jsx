import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Required "I have read and agree to the Privacy Policy and Terms of Service"
 * checkbox shown on the login and signup forms. The document names link to the
 * Privacy Policy / Terms pages (opened in a new tab so the form isn't lost).
 */
export default function AgreementCheckbox({ checked, onChange, error }) {
  return (
    <div className="field">
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
        />
        <span className="small muted">
          I have read and agree to the{' '}
          <Link className="link" to="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
          {' '}and{' '}
          <Link className="link" to="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link>.
        </span>
      </label>
      {error ? <div className="field-error" style={{ marginTop: 6 }}>{error}</div> : null}
    </div>
  );
}
