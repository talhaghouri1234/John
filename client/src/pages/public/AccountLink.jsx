import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { accountApi } from '../../api/account.api.js';
import { errorMessage } from '../../api/axios.js';
import useAuth from '../../hooks/useAuth.js';
import { authApi } from '../../api/auth.api.js';

export default function AccountLink({ mode }) {
  const location = useLocation();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const token = new URLSearchParams(location.hash.slice(1)).get('token') || '';
  const validLink = /^[a-f0-9]{64}$/.test(token);
  const title = mode === 'forgot' ? 'Forgot your password?' : mode === 'reset' ? 'Choose a new password' : 'Verify your email';
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    if (mode === 'reset' && data.get('password') !== data.get('confirm')) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const result = await accountApi[mode](mode === 'forgot' ? { email: data.get('email') } :
        { token, ...(mode === 'reset' ? { password: data.get('password') } : {}) });
      setMessage(result.message);
      setDone(true);
      if (mode === 'reset' || result.signedOut) auth.clearSession();
      else if (mode === 'verify' && auth.user) authApi.me().then(auth.updateUser).catch(() => {});
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  return <main className="recovery-shell"><section className="card account-section">
    <p className="eyebrow">Account security</p><h1>{title}</h1>
    {mode === 'forgot' && <p>Enter your account email and we will send a link to reset your password.</p>}
    {mode === 'verify' && <p>Press the button below to confirm your email address.</p>}
    {message && <p role="status">{message}</p>}
    {error && <p className="field-error" role="alert">{error}</p>}
    {!done && (mode === 'forgot' || validLink) ? <form onSubmit={submit}>
      {mode === 'forgot' && <div className="field"><label htmlFor="recovery-email">Email address</label>
        <input id="recovery-email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>}
      {mode === 'reset' && <>
        <div className="field"><label htmlFor="new-password">New password</label><input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></div>
        <div className="field"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></div>
      </>}
      <button className="button" disabled={busy}>{busy ? 'Please wait…' : mode === 'forgot' ? 'Send reset link' : mode === 'reset' ? 'Reset password' : 'Verify email'}</button>
    </form> : !done && <p role="alert">This link is missing or invalid. Request a new email.</p>}
    <p><Link to="/login">Back to sign in</Link> · <Link to="/forgot-password">Request a reset link</Link></p>
    {mode === 'verify' && <p>To request another verification email, sign in and open Account settings.</p>}
  </section></main>;
}
