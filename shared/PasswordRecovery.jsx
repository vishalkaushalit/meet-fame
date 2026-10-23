import React, { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import SecureInput from './SecureInput';
import AuthSocialBackground from './AuthSocialBackground';
import './password-recovery.css';

export default function PasswordRecovery({
  role,
  reset = false,
  requestReset,
  verifyOtp,
  savePassword,
  loginUrl,
  header,
}) {
  const [step, setStep] = useState(reset ? 'otp' : 'email');
  const [resetToken, setResetToken] = useState('');
  const [otp, setOtp] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [testCode, setTestCode] = useState('');
  useEffect(() => {
    document.title = `${step === 'password' ? 'Reset password' : step === 'otp' ? 'Verify OTP' : 'Forgot password'} | MeetFame`;
    return () => {
      document.title = 'MeetFame | Connect • Book • Meet';
    };
  }, [step]);
  useEffect(() => {
    if (!resendSeconds) return;
    const timer = setTimeout(
      () => setResendSeconds((value) => value - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [resendSeconds]);
  const sendCode = async () => {
    const result = await requestReset({ role, email: email.trim() });
    setNotice(result.message);
    setTestCode(result.developmentOtp || '');
    setStep('otp');
    setResetToken('');
    setOtp('');
    setResendSeconds(60);
  };
  const resend = async () => {
    if (busy || resendSeconds) return;
    setBusy(true);
    setError('');
    try {
      await sendCode();
    } catch (err) {
      setError(err.message || 'Unable to send your OTP. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (step === 'password' && password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      if (step === 'password') {
        const result = await savePassword({
          role,
          email: email.trim(),
          resetToken,
          password,
        });
        setMessage(result.message);
        setPassword('');
        setConfirmation('');
        setOtp('');
        setResetToken('');
      } else if (step === 'otp') {
        const result = await verifyOtp({ role, email: email.trim(), otp });
        setResetToken(result.resetToken);
        setStep('password');
        setNotice('');
        setTestCode('');
        setOtp('');
      } else await sendCode();
    } catch (err) {
      setError(
        err.message || 'Unable to complete the request. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="password-recovery-page">
      <header className="password-recovery-header">{header}</header>
      <main className="password-recovery-content">
        <AuthSocialBackground />
        <section className="password-recovery-card">
          <div className="recovery-heading">
            <h1>
              {step === 'password'
                ? 'Reset your password'
                : step === 'otp'
                  ? 'Verify your OTP'
                  : 'Forgot your password?'}
            </h1>
          </div>
          <p className="recovery-description">
            {step === 'password'
              ? 'Your email is verified. Choose a new password to secure your account.'
              : step === 'otp'
                ? 'Enter the code from your email. Your OTP expires in 10 minutes.'
                : `Enter your ${role} account email and we’ll send you an OTP.`}
          </p>
          {error && (
            <p role="alert" className="recovery-error">
              {error}
            </p>
          )}
          {notice && !message && (
            <p role="status" className="recovery-success">
              {notice}
            </p>
          )}
          {testCode && !message && (
            <p className="recovery-description">
              Test OTP: <strong>{testCode}</strong>
            </p>
          )}
          {message ? (
            <div role="status" className="recovery-success">
              <p>{message}</p>
              <a href={loginUrl}>Return to sign in</a>
            </div>
          ) : (
            <form onSubmit={submit}>
              {step !== 'password' && (
                <>
                  <label htmlFor="recovery-email">Email address</label>
                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setOtp('');
                    }}
                    placeholder="Enter your email address"
                  />
                </>
              )}
              {step === 'otp' && (
                <>
                  <label htmlFor="recovery-otp">Email OTP</label>
                  <input
                    className="recovery-otp"
                    id="recovery-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern={testCode ? '[0-9]{4}' : '[0-9]{4,6}'}
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder={
                      testCode ? '4-digit test code' : 'Enter your OTP'
                    }
                  />
                </>
              )}
              {step === 'password' && (
                <>
                  <label htmlFor="recovery-password">New password</label>
                  <SecureInput
                    label="new password"
                    id="recovery-password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <small>Use at least 8 characters.</small>
                  <label htmlFor="recovery-confirm">Confirm new password</label>
                  <SecureInput
                    label="confirm new password"
                    id="recovery-confirm"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                  />
                </>
              )}
              <button className="recovery-submit" type="submit" disabled={busy}>
                {step === 'email' && <Mail size={17} />}
                {busy
                  ? 'Please wait…'
                  : step === 'password'
                    ? 'Reset password'
                    : step === 'otp'
                      ? 'Verify OTP'
                      : 'Send OTP'}
              </button>
              {step === 'otp' && (
                <button
                  className="recovery-resend"
                  type="button"
                  disabled={busy || resendSeconds > 0 || !email.trim()}
                  onClick={resend}
                >
                  {resendSeconds
                    ? `Resend OTP in ${resendSeconds}s`
                    : 'Resend OTP'}
                </button>
              )}
              {step === 'password' && (
                <button
                  type="button"
                  className="recovery-resend"
                  disabled={busy}
                  onClick={() => {
                    setStep('email');
                    setResetToken('');
                    setPassword('');
                    setConfirmation('');
                    setError('');
                  }}
                >
                  Request a new OTP
                </button>
              )}
              <a href={loginUrl}>Return to sign in</a>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
