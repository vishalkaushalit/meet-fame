import React, { useEffect, useState } from 'react';
import { Mail, Eye, EyeOff } from 'lucide-react';
import AuthSocialBackground from './AuthSocialBackground';
import './password-recovery.css';

export default function PasswordRecovery({ role, reset = false, requestReset, savePassword, loginUrl, header }) {
  const [enterCode, setEnterCode] = useState(reset);
  const [otp, setOtp] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [testCode, setTestCode] = useState('');
  useEffect(() => {
    document.title = `${reset ? 'Reset password' : 'Forgot password'} | MeetFame`;
    return () => { document.title = 'MeetFame | Connect • Book • Meet'; };
  }, [reset]);
  useEffect(() => {
    if (!resendSeconds) return;
    const timer = setTimeout(() => setResendSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);
  const sendCode = async () => {
    const result = await requestReset({ role, email: email.trim() });
    setNotice(result.message);
    setTestCode(result.developmentOtp || '');
    setEnterCode(true);
    setOtp('');
    setResendSeconds(60);
  };
  const resend = async () => {
    if (busy || resendSeconds) return;
    setBusy(true); setError('');
    try { await sendCode(); }
    catch (err) { setError(err.message || 'Unable to send your OTP. Please try again.'); }
    finally { setBusy(false); }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (enterCode && password !== confirmation) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      if (enterCode) {
        const result = await savePassword({ role, email: email.trim(), otp, password });
        setMessage(result.message);
        setPassword(''); setConfirmation(''); setOtp('');
      } else await sendCode();
    } catch (err) { setError(err.message || 'Unable to complete the request. Please try again.'); }
    finally { setBusy(false); }
  };
  return <div className="password-recovery-page">
    <header className="password-recovery-header">{header}</header>
    <main className="password-recovery-content">
    <AuthSocialBackground />
    <section className="password-recovery-card">
      <div className="recovery-heading">
        <h1>{enterCode ? 'Reset your password' : 'Forgot your password?'}</h1>
      </div>
      <p className="recovery-description">{enterCode ? 'Enter the code from your email and choose a new password. Your OTP expires in 10 minutes.' : `Enter your ${role} account email and we’ll send you a 6-digit OTP.`}</p>
      {error && <p role="alert" className="recovery-error">{error}</p>}
      {notice && !message && <p role="status" className="recovery-success">{notice}</p>}
      {testCode && !message && <p className="recovery-description">Test OTP: <strong>{testCode}</strong></p>}
      {message ? <div role="status" className="recovery-success"><p>{message}</p><a href={loginUrl}>Return to sign in</a></div> : <form onSubmit={submit}>
        <label htmlFor="recovery-email">Email address</label><input id="recovery-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => { setEmail(event.target.value); setOtp(''); }} placeholder="Enter your email address" />
        {enterCode && <>
          <label htmlFor="recovery-otp">Email OTP</label>
          <input className="recovery-otp" id="recovery-otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern={testCode ? '[0-9]{4}' : '[0-9]{4,6}'} maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={testCode ? '4-digit test code' : 'Enter your OTP'} />
          <label htmlFor="recovery-password">New password</label>
          <div className="recovery-password-field"><input id="recovery-password" autoComplete="new-password" type={visible ? 'text' : 'password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          <small>Use at least 8 characters.</small>
          <label htmlFor="recovery-confirm">Confirm new password</label>
          <input id="recovery-confirm" autoComplete="new-password" type={visible ? 'text' : 'password'} required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </>}
        <button className="recovery-submit" type="submit" disabled={busy}>{!enterCode && <Mail size={17} />}{busy ? 'Please wait…' : enterCode ? 'Verify OTP & reset password' : 'Send OTP'}</button>
        {enterCode && <button className="recovery-resend" type="button" disabled={busy || resendSeconds > 0 || !email.trim()} onClick={resend}>{resendSeconds ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}</button>}
        <a href={loginUrl}>Return to sign in</a>
      </form>}
    </section>
    </main>
  </div>;
}
