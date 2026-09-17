import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateSignup, friendlyAuthError } from '../lib/validation';
import { isUsernameTaken } from '../services/users';
import AgreementCheckbox from '../components/AgreementCheckbox';

// Module-scoped so it isn't remounted (and doesn't lose focus) on each keystroke.
function Field({ id, label, type = 'text', value, onChange, placeholder, autoComplete, error }) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} className="input" type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} />
      {error ? <div className="field-error">{error}</div> : null}
    </div>
  );
}

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [topError, setTopError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setTopError(null);
    const v = validateSignup(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    if (!agreed) return setTopError('Please read and agree to the Privacy Policy and Terms of Service to continue.');
    setLoading(true);
    try {
      const taken = await isUsernameTaken(form.username).catch(() => false);
      if (taken) { setErrors((x) => ({ ...x, username: 'That username is already taken.' })); setLoading(false); return; }
      await signUp(form);
      navigate('/');
    } catch (err) {
      setTopError(friendlyAuthError(err));
      setLoading(false);
    }
  };

  return (
    <div className="container page" style={{ maxWidth: 480 }}>
      <h1 className="h1">Create your account</h1>
      <p className="muted mb-3">One account works on the website and the app.</p>
      <form onSubmit={submit} className="card">
        <Field id="u" label="Username" value={form.username} onChange={set('username')} placeholder="kingcakefan" autoComplete="username" error={errors.username} />
        <div className="row gap-1 wrap">
          <div style={{ flex: 1, minWidth: 140 }}>
            <Field id="fn" label="First name" value={form.firstName} onChange={set('firstName')} placeholder="Marie" autoComplete="given-name" error={errors.firstName} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Field id="ln" label="Last name" value={form.lastName} onChange={set('lastName')} placeholder="Laveau" autoComplete="family-name" error={errors.lastName} />
          </div>
        </div>
        <Field id="e" label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" error={errors.email} />
        <Field id="p" label="Password" type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" autoComplete="new-password" error={errors.password} />
        <Field id="cp" label="Confirm password" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter your password" autoComplete="new-password" error={errors.confirmPassword} />
        <AgreementCheckbox checked={agreed} onChange={setAgreed} />
        {topError ? <div className="field-error mb-2">{topError}</div> : null}
        <button className="btn block" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="center mt-3 muted">Already have one? <Link className="link" to="/login">Log in</Link></p>
    </div>
  );
}
