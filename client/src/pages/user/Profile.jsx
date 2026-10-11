import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '../../hooks/useAuth.js';
import { accountApi } from '../../api/account.api.js';
import { errorMessage } from '../../api/axios.js';
import ErrorState from '../../components/ErrorState.jsx';
import Loader from '../../components/Loader.jsx';

function AccountForm({ title, description, fields, button, action, onSuccess }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return (
    <section className="card account-section">
      <h2>{title}</h2>
      <p>{description}</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = Object.fromEntries(new FormData(form));
          setError('');
          setMessage('');
          if ('confirm' in values && values.password !== values.confirm) {
            setError('Passwords do not match');
            return;
          }
          delete values.confirm;
          setBusy(true);
          try {
            const result = await action(values);
            setMessage(result.message || 'Changes saved');
            onSuccess?.(result);
            form.reset();
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        {fields.map(({ name, label, type = 'text', value, ...rest }) => (
          <div className="field" key={name}>
            <label htmlFor={`${button.replaceAll(' ', '-')}-${name}`}>{label}</label>
            <input
              id={`${button.replaceAll(' ', '-')}-${name}`}
              name={name}
              type={type}
              defaultValue={value}
              required
              {...rest}
            />
          </div>
        ))}
        {message && <p role="status">{message}</p>}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? 'Saving…' : button}
        </button>
      </form>
    </section>
  );
}

function ProfilePhoto({ user, updateUser }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl;
    setUrl('');
    if (user.hasAvatar)
      accountApi
        .avatar(controller.signal)
        .then((blob) => {
          if (controller.signal.aborted) return;
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError('Could not load your photo. Try uploading it again.');
        });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user.hasAvatar, version]);
  const change = async (action) => {
    setBusy(true);
    setError('');
    try {
      updateUser(await action());
      setVersion((v) => v + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card account-section">
      <h2>Profile photo</h2>
      {url ? (
        <img className="profile-photo" src={url} alt="Your profile" />
      ) : (
        <span className="avatar">{user.name.slice(0, 1)}</span>
      )}
      <p>JPEG, PNG, WebP, or GIF. Maximum 2 MB. Visible in your account settings.</p>
      <label htmlFor="profile-photo">Choose a profile photo</label>
      <input
        id="profile-photo"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files[0];
          event.target.value = '';
          if (!file) return;
          if (file.size > 2 * 1024 * 1024) {
            setError('Choose an image no larger than 2 MB');
            return;
          }
          change(() => accountApi.uploadAvatar(file));
        }}
      />
      {user.hasAvatar && (
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => change(accountApi.deleteAvatar)}
        >
          Remove photo
        </button>
      )}
      {busy && <p role="status">Updating photo…</p>}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </section>
  );
}

export default function Profile() {
  const { user, updateUser, clearSession } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const sessions = useQuery({ queryKey: ['account', 'sessions'], queryFn: accountApi.sessions });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const signedOut = () => {
    clearSession();
    navigate('/login', { replace: true });
  };
  const run = async (action) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await action();
      setMessage(result.message || 'Session signed out');
      if (result.signedOut) signedOut();
      else client.invalidateQueries({ queryKey: ['account', 'sessions'] });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const currentPassword = {
    name: 'currentPassword',
    label: 'Current password',
    type: 'password',
    autoComplete: 'current-password',
    maxLength: 72,
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your account</p>
          <h1>Account settings</h1>
          <p>Manage your profile, email, password, and signed-in devices.</p>
        </div>
      </div>
      <section className="card account-section">
        <h2>Email verification</h2>
        <p>{user.email}</p>
        <span className="badge">
          {user.emailVerified ? 'Email verified' : 'Email not yet verified'}
        </span>
        <p>
          Verification confirms that this email belongs to you. You can continue using your account
          while you verify it.
        </p>
        <div className="account-actions">
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => run(accountApi.resend)}
          >
            Send verification email
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => run(accountApi.cancelEmail)}
          >
            Cancel pending email change
          </button>
        </div>
        {message && <p role="status">{message}</p>}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </section>
      <div className="account-grid">
        <AccountForm
          title="Your details"
          description="Choose the name shown in your workspace."
          button="Save name"
          action={accountApi.profile}
          onSuccess={updateUser}
          fields={[
            {
              name: 'name',
              label: 'Full name',
              value: user.name,
              autoComplete: 'name',
              minLength: 2,
              maxLength: 80,
            },
          ]}
        />
        <ProfilePhoto user={user} updateUser={updateUser} />
        <AccountForm
          title="Change email"
          description="Your old address stays active until you confirm the link sent to the new one. Confirmation signs out all devices."
          button="Send confirmation"
          action={accountApi.email}
          fields={[
            {
              name: 'email',
              label: 'New email address',
              type: 'email',
              autoComplete: 'email',
              maxLength: 254,
            },
            currentPassword,
          ]}
        />
        <AccountForm
          title="Change password"
          description="Changing your password signs out every device, including this one."
          button="Change password"
          action={accountApi.password}
          onSuccess={signedOut}
          fields={[
            currentPassword,
            {
              name: 'password',
              label: 'New password',
              type: 'password',
              autoComplete: 'new-password',
              minLength: 8,
              maxLength: 72,
            },
            {
              name: 'confirm',
              label: 'Confirm new password',
              type: 'password',
              autoComplete: 'new-password',
              minLength: 8,
              maxLength: 72,
            },
          ]}
        />
      </div>
      <section className="card account-section">
        <h2>Signed-in devices</h2>
        <p>
          Device descriptions come from the browser and may not identify a physical device exactly.
          Last active shows the latest login or session refresh.
        </p>
        <button
          className="button secondary"
          disabled={busy || sessions.isPending}
          onClick={() => run(accountApi.revokeOthers)}
        >
          Sign out other devices
        </button>
        {sessions.isPending ? (
          <Loader />
        ) : sessions.isError ? (
          <ErrorState error={sessions.error} retry={sessions.refetch} />
        ) : (
          <ul className="session-list">
            {sessions.data.map((session) => (
              <li key={session._id}>
                <div>
                  <strong>{session.current ? 'This device' : 'Other device'}</strong>
                  <p>{session.userAgent}</p>
                  <small>
                    Signed in {new Date(session.createdAt).toLocaleString()} · Last active{' '}
                    {new Date(session.lastUsedAt).toLocaleString()}
                  </small>
                </div>
                <button
                  className="button secondary small"
                  disabled={busy}
                  onClick={() => run(() => accountApi.revoke(session._id))}
                >
                  {session.current ? 'Sign out this device' : 'Sign out device'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
