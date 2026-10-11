import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import PasswordField from '../../components/PasswordField.jsx';
import { accountApi } from '../../api/account.api.js';
import { errorMessage } from '../../api/axios.js';
import useAuth from '../../hooks/useAuth.js';
import { authApi } from '../../api/auth.api.js';

export default function AccountLink({ mode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    if (!resendAt) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);
  const startCooldown = (seconds = 60) => {
    setSecondsLeft(seconds);
    setResendAt(Date.now() + seconds * 1000);
  };
  const resend = async () => {
    if (busy || secondsLeft > 0) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await accountApi.forgot({ email });
      setMessage(result.message);
      startCooldown();
    } catch (err) {
      setError(errorMessage(err));
      if (err.response?.status === 429) {
        const retryAfter = Number(err.response.headers?.['retry-after']);
        startCooldown(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter) : 60);
      }
    } finally { setBusy(false); }
  };
  const token = new URLSearchParams(location.hash.slice(1)).get('token') || '';
  const validLink = /^[a-f0-9]{64}$/.test(token);
  const title = done
    ? mode === 'forgot'
      ? 'Check your inbox'
      : 'Email verified'
    : mode === 'forgot'
      ? 'Forgot your password?'
      : mode === 'reset'
        ? 'Choose a new password'
        : 'Verify your email';
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
      const result = await accountApi[mode](
        mode === 'forgot'
          ? { email: data.get('email') }
          : { token, ...(mode === 'reset' ? { password: data.get('password') } : {}) },
      );
      if (mode === 'reset' || result.signedOut) {
        auth.clearSession();
        navigate('/login', {
          replace: true,
          state: { accountNotice: mode === 'reset' ? 'password-reset' : 'email-changed' },
        });
        return;
      }
      setMessage(result.message);
      setDone(true);
      if (mode === 'forgot') {
        setEmail(data.get('email').trim());
        startCooldown();
      }
      if (mode === 'verify' && auth.user)
        authApi
          .me()
          .then(auth.updateUser)
          .catch(() => {});
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="recovery-shell">
      <section className="card account-section recovery-card" aria-labelledby="recovery-title">
        <div className="recovery-icon" aria-hidden="true">
          {done ? <CheckCircle2 size={26} /> : <LockKeyhole size={26} />}
        </div>
        <p className="eyebrow">Account security</p>
        <h1 id="recovery-title">{title}</h1>
        {!done && mode === 'forgot' && (
          <p>Enter your account email and we will send a link to reset your password.</p>
        )}
        {!done && mode === 'verify' && <p>Press the button below to confirm your email address.</p>}
        {!done && mode === 'reset' && validLink && (
          <p id="password-help">Use 8–72 characters. Choose a password you do not use elsewhere.</p>
        )}
        {message && (
          <p className="recovery-notice" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {!done && (mode === 'forgot' || validLink) ? (
          <form onSubmit={submit}>
            {mode === 'forgot' && (
              <div className="field">
                <label htmlFor="recovery-email">Email address</label>
                <input
                  id="recovery-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </div>
            )}
            {mode === 'reset' && (
              <>
                <PasswordField
                  label="New password"
                  id="new-password"
                  name="password"
                  aria-describedby="password-help"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                />
                <PasswordField
                  label="Confirm new password"
                  id="confirm-password"
                  name="confirm"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                />
              </>
            )}
            <button className="button recovery-submit" disabled={busy}>
              {busy
                ? 'Please wait…'
                : mode === 'forgot'
                  ? 'Send reset link'
                  : mode === 'reset'
                    ? 'Reset password'
                    : 'Verify email'}
            </button>
          </form>
        ) : (
          !done && <p role="alert">This link is missing or invalid. Request a new email.</p>
        )}
        <nav className="recovery-actions" aria-label="Account recovery options">
          {mode === 'forgot' && done && (
            <button type="button" className="button" disabled={busy || secondsLeft > 0} onClick={resend}>
              {busy ? 'Sending…' : secondsLeft > 0 ? `Resend reset link in ${secondsLeft}s` : 'Resend reset link'}
            </button>
          )}
          <Link className={`button ${done && mode !== 'forgot' ? '' : 'secondary'}`} to="/login">
            Back to sign in
          </Link>
          {mode === 'reset' && (
            <Link className="button secondary" to="/forgot-password">
              Request a new reset link
            </Link>
          )}
          {mode === 'forgot' && done && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => {
                setDone(false);
                setMessage('');
                setError('');
              }}
            >
              Try another email
            </button>
          )}
        </nav>
        {mode === 'verify' && (
          <p>To request another verification email, sign in and open Account settings.</p>
        )}
      </section>
    </main>
  );
}
