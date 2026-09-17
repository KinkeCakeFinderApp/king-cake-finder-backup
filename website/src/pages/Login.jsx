import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, friendlyAuthError } from '../lib/validation';
import AgreementCheckbox from '../components/AgreementCheckbox';

export default function Login() {
  const { logIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleForgot = async () => {
    setError(null); setNotice(null);
    if (!isValidEmail(email)) return setError('Type your email above first, then click "Forgot password?".');
    const sent = () => setNotice(`If an account exists for ${email.trim()}, a password reset link is on its way. Check your spam folder too.`);
    try {
      await resetPassword(email);
      sent();
    } catch (err) {
      if (err && err.code === 'auth/user-not-found') sent();
      else setError(friendlyAuthError(err));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    if (!agreed) return setError('Please read and agree to the Privacy Policy and Terms of Service to continue.');
    setLoading(true);
    try {
      await logIn(email, password);
      navigate('/');
    } catch (err) {
      setError(friendlyAuthError(err));
      setLoading(false);
    }
  };

  return (
    <div className="container page" style={{ maxWidth: 440 }}>
      <h1 className="h1">Welcome back</h1>
      <p className="muted mb-3">Log in to keep finding great king cakes.</p>
      <form onSubmit={submit} className="card">
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </div>
        <div className="field">
          <label className="label" htmlFor="pw">Password</label>
          <input id="pw" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" />
        </div>
        <div style={{ textAlign: 'right', marginBottom: 10 }}>
          <button type="button" className="link" onClick={handleForgot} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: 700 }}>
            Forgot password?
          </button>
        </div>
        <AgreementCheckbox checked={agreed} onChange={setAgreed} />
        {notice ? <div className="small mb-2" style={{ color: 'var(--green)' }}>{notice}</div> : null}
        {error ? <div className="field-error mb-2">{error}</div> : null}
        <button className="btn block" type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="center mt-3 muted">New here? <Link className="link" to="/signup">Create an account</Link></p>
    </div>
  );
}
