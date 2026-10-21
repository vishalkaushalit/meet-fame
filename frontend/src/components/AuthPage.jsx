import {
  registrationErrors,
  registrationStep,
  certificateError,
  introVideoError,
} from '../../../shared/registrationValidation';
import './auth-page.css';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  User,
  Sparkles,
  FileCheck,
  Lock,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Upload,
  ArrowRight,
} from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { authPath, navigate } from '../authRoutes';

export default function AuthPage({ role = 'user', tab = 'login' }) {
  const { login, registerUser, registerInfluencer, setStatusAlert } = useAuth();
  const isRegister = tab === 'register';
  const heading = useRef(null);
  useEffect(() => {
    document.title = `${isRegister ? 'Sign up' : 'Sign in'} as ${role === 'influencer' ? 'Influencer' : 'User'} | MeetFame`;
    heading.current?.focus();
    return () => {
      document.title = 'MeetFame | Connect • Book • Meet';
    };
  }, [role, isRegister]);
  const registered =
    new URLSearchParams(window.location.search).get('registered') === '1';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [step, setStep] = useState(0);
  const isInfluencerSignup = isRegister && role === 'influencer';
  const steps = ['Account details', 'Creator profile', 'Video & certification'];
  const stepHeading = useRef(null);
  useEffect(() => {
    if (isInfluencerSignup) stepHeading.current?.focus();
  }, [step, isInfluencerSignup]);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Influencer specific
  const [specialization, setSpecialization] = useState(
    'Tech & AI Product Advisor',
  );
  const [category, setCategory] = useState('Technology & AI');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState(200);
  const [certificateTitle, setCertificateTitle] = useState('');
  const [introVideoFile, setIntroVideoFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);

  const categories = [
    'Technology & AI',
    'Health & Fitness',
    'Fashion & Lifestyle',
    'Business & Finance',
    'Content Creation & Media',
    'Design & Creative',
    'Career & Leadership',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (isRegister) {
      const allErrors = registrationErrors(
        {
          name,
          email,
          phone,
          password,
          specialization,
          category,
          hourlyRate,
          certificateTitle,
          certificateFile,
          introVideoFile,
        },
        role,
      );
      const errors =
        isInfluencerSignup && step < 2
          ? Object.fromEntries(
              Object.entries(allErrors).filter(
                ([field]) => registrationStep(field) === step,
              ),
            )
          : allErrors;
      setFieldErrors(errors);
      const first = Object.keys(errors)[0];
      if (first) {
        if (isInfluencerSignup) setStep(registrationStep(first));
        requestAnimationFrame(() =>
          document.getElementById(`auth-${first}`)?.focus(),
        );
        return;
      }
      if (isInfluencerSignup && step < 2) {
        setStep(step + 1);
        return;
      }
    } else if (!email.trim() || !password) {
      setError('Enter your email address and password.');
      return;
    }
    setLoading(true);

    try {
      if (isRegister) {
        if (role === 'influencer') {
          const formData = new FormData();
          formData.append('name', name.trim());
          formData.append('email', email.trim());
          formData.append('phone', phone.trim());
          formData.append('password', password);
          formData.append('specialization', specialization);
          formData.append('category', category);
          formData.append('bio', bio);
          formData.append('hourlyRate', hourlyRate);
          formData.append('certificateTitle', certificateTitle);
          formData.append('introVideoFile', introVideoFile);
          if (certificateFile) {
            formData.append('certificateFile', certificateFile);
          }

          await registerInfluencer(formData);
          setStatusAlert(null);
          navigate('/influencer/login?registered=1', { replace: true });
        } else {
          // User registration
          await registerUser({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
          });
          navigate('/', { replace: true });
        }
      } else {
        // Login
        await login(email, password, role);
        navigate('/', { replace: true });
      }
    } catch (err) {
      setStatusAlert(null);
      setError(err.message || err.error || 'Authentication failed');
      if (err.fields) {
        setFieldErrors(err.fields);
        if (isInfluencerSignup)
          setStep(registrationStep(Object.keys(err.fields)[0]));
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins
  const handleDemoLogin = async (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'password123', demoRole);
      navigate('/', { replace: true });
    } catch (err) {
      setStatusAlert(null);
      setError(err.message || err.error || 'Demo login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen bg-[#0A0F1D] text-slate-100">
      <header className="auth-page-header">
        <Logo size="header" />
        <ThemeToggle />
      </header>
      <main className="auth-page-main">
        <div className="auth-page-card auth-form-compact relative w-full max-w-2xl p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100">
          {/* Page heading */}
          <div className="text-center mb-6">
            <h1
              ref={heading}
              tabIndex={-1}
              className="outline-none text-2xl font-black text-white mt-2"
            >
              {isRegister ? 'Join MeetFame' : 'Login'}
            </h1>
            <p className="text-slate-400 text-sm">
              {isRegister
                ? 'Connect directly with fans or book top category leaders'
                : 'Sign in to access your dashboard'}
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
            <a
              href={authPath('user', tab)}
              aria-current={role === 'user' ? 'page' : undefined}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                role === 'user'
                  ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>User / Fan</span>
            </a>

            <a
              href={authPath('influencer', tab)}
              aria-current={role === 'influencer' ? 'page' : undefined}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                role === 'influencer'
                  ? 'bg-gradient-to-r from-brand-purple to-brand-coral text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Influencer / Creator</span>
            </a>
          </div>

          {registered && (
            <p className="auth-page-notice" role="status">
              Registration submitted. Your account is pending admin approval.
              You can sign in once approved.
            </p>
          )}
          {/* Error notification */}
          {error && (
            <div
              role="alert"
              className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium"
            >
              {error}
            </div>
          )}

          {isInfluencerSignup && (
            <>
              <ol className="signup-steps" aria-label="Registration progress">
                {steps.map((label, index) => (
                  <li
                    key={label}
                    className={index <= step ? 'is-active' : ''}
                    aria-current={index === step ? 'step' : undefined}
                  >
                    <span>{index + 1}</span>
                    <strong>{label}</strong>
                  </li>
                ))}
              </ol>
              <h2
                className="signup-step-heading"
                ref={stepHeading}
                tabIndex={-1}
              >
                Step {step + 1} of {steps.length}: {steps[step]}
              </h2>
            </>
          )}
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate={isRegister}
            className="space-y-4"
          >
            <fieldset
              className="space-y-4"
              data-signup-step={isInfluencerSignup ? '0' : undefined}
              disabled={loading || (isInfluencerSignup && step !== 0)}
              hidden={isInfluencerSignup && step !== 0}
            >
              <legend className="sr-only">Account details</legend>
              {/* Registration Fields */}
              {isRegister && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    {fieldErrors.name && (
                      <p
                        id="auth-name-error"
                        className="auth-field-error"
                        role="alert"
                      >
                        {fieldErrors.name}
                      </p>
                    )}
                    <input
                      type="text"
                      required
                      id="auth-name"
                      name="name"
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={
                        fieldErrors.name ? 'auth-name-error' : undefined
                      }
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Marcus Vance"
                      className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  {fieldErrors.email && (
                    <p
                      id="auth-email-error"
                      className="auth-field-error"
                      role="alert"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                  <input
                    type="email"
                    required
                    id="auth-email"
                    name="email"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={
                      fieldErrors.email ? 'auth-email-error' : undefined
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950/70 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </div>

              {/* Phone (required for influencer, optional for user) */}
              {isRegister && (
                <div>
                  <label
                    htmlFor="auth-phone"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    {fieldErrors.phone && (
                      <p
                        id="auth-phone-error"
                        className="auth-field-error"
                        role="alert"
                      >
                        {fieldErrors.phone}
                      </p>
                    )}
                    <input
                      type="tel"
                      required={role === 'influencer'}
                      id="auth-phone"
                      name="phone"
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={
                        fieldErrors.phone ? 'auth-phone-error' : undefined
                      }
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-950/70 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  {fieldErrors.password && (
                    <p
                      id="auth-password-error"
                      className="auth-field-error"
                      role="alert"
                    >
                      {fieldErrors.password}
                    </p>
                  )}
                  <input
                    type="password"
                    required
                    id="auth-password"
                    name="password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={
                      fieldErrors.password ? 'auth-password-error' : undefined
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/70 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </div>
            </fieldset>
            {/* INFLUENCER REGISTRATION SPECIFIC DETAILS */}
            {isRegister && role === 'influencer' && (
              <div>
                <fieldset
                  className="space-y-4"
                  data-signup-step="1"
                  hidden={step !== 1}
                  disabled={loading || step !== 1}
                >
                  <legend className="sr-only">Creator profile</legend>
                  <h4 className="text-sm font-bold text-brand-purple flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span>Influencer Profile & Specialization</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="auth-category"
                        className="block text-xs font-semibold text-slate-300 mb-1"
                      >
                        Category
                      </label>
                      {fieldErrors.category && (
                        <p
                          id="auth-category-error"
                          className="auth-field-error"
                          role="alert"
                        >
                          {fieldErrors.category}
                        </p>
                      )}
                      <select
                        id="auth-category"
                        name="category"
                        aria-invalid={Boolean(fieldErrors.category)}
                        aria-describedby={
                          fieldErrors.category
                            ? 'auth-category-error'
                            : undefined
                        }
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c} className="bg-slate-900">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="auth-hourlyRate"
                        className="block text-xs font-semibold text-slate-300 mb-1"
                      >
                        Hourly Consultation Rate ($)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        {fieldErrors.hourlyRate && (
                          <p
                            id="auth-hourlyRate-error"
                            className="auth-field-error"
                            role="alert"
                          >
                            {fieldErrors.hourlyRate}
                          </p>
                        )}
                        <input
                          type="number"
                          required
                          min="50"
                          step="10"
                          id="auth-hourlyRate"
                          name="hourlyRate"
                          aria-invalid={Boolean(fieldErrors.hourlyRate)}
                          aria-describedby={
                            fieldErrors.hourlyRate
                              ? 'auth-hourlyRate-error'
                              : undefined
                          }
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                          className="w-full bg-slate-950/70 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-specialization"
                      className="block text-xs font-semibold text-slate-300 mb-1"
                    >
                      Specialization / Expertise
                    </label>
                    {fieldErrors.specialization && (
                      <p
                        id="auth-specialization-error"
                        className="auth-field-error"
                        role="alert"
                      >
                        {fieldErrors.specialization}
                      </p>
                    )}
                    <input
                      type="text"
                      required
                      id="auth-specialization"
                      name="specialization"
                      aria-invalid={Boolean(fieldErrors.specialization)}
                      aria-describedby={
                        fieldErrors.specialization
                          ? 'auth-specialization-error'
                          : undefined
                      }
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. AI Strategy, Venture Capital, Fitness Coaching"
                      className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </fieldset>
                <fieldset
                  className="space-y-4"
                  data-signup-step="2"
                  hidden={step !== 2}
                  disabled={loading || step !== 2}
                >
                  <legend className="sr-only">Certification</legend>
                  <p className="text-xs text-slate-400">
                    Upload your required introduction video. Certification is optional and can be added later from your dashboard.
                  </p>
                  <div className="space-y-2">
                    <label htmlFor="auth-introVideoFile" className="text-sm font-semibold text-slate-200">Introduction video (required)</label>
                    <p id="intro-video-help" className="text-xs text-slate-400">Introduce yourself and what you offer. Users can watch this on your card before booking. MP4 or WebM, up to 5 MB and 15 seconds.</p>
                    <input id="auth-introVideoFile" type="file" accept=".mp4,.webm,video/mp4,video/webm"
                      aria-required="true" aria-invalid={Boolean(fieldErrors.introVideoFile)}
                      aria-describedby="intro-video-help auth-introVideoFile-error"
                      className="w-full text-sm text-slate-300"
                      onChange={async (e) => {
                        const input = e.currentTarget;
                        const file = input.files?.[0] || null;
                        setIntroVideoFile(null);
                        let issue = introVideoError(file);
                        if (!issue) {
                          const url = URL.createObjectURL(file);
                          try {
                            const duration = await new Promise((resolve, reject) => {
                              const video = document.createElement('video');
                              const timeout = setTimeout(() => { video.removeAttribute('src'); reject(); }, 10000);
                              video.preload = 'metadata';
                              video.onloadedmetadata = () => { clearTimeout(timeout); resolve(video.duration); video.removeAttribute('src'); };
                              video.onerror = () => { clearTimeout(timeout); reject(); };
                              video.src = url;
                            });
                            if (!Number.isFinite(duration) || duration <= 0 || duration > 15)
                              issue = 'Introduction video must be 15 seconds or shorter.';
                          } catch { issue = 'Unable to read this video. Choose a valid MP4 or WebM.'; }
                          finally { URL.revokeObjectURL(url); }
                        }
                        if (input.files?.[0] !== file) return;
                        if (!issue) setIntroVideoFile(file);
                        setFieldErrors((current) => ({ ...current, introVideoFile: issue }));
                      }} />
                    <p id="auth-introVideoFile-error" className="auth-field-error" role="alert">{fieldErrors.introVideoFile}</p>
                  </div>
                  {/* Certification Upload for Verified Badge */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-[#0095F6]" />
                        <span>
                          Specialization Certification (For Blue Verified Badge)
                        </span>
                      </label>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                        Instagram Style Badge
                      </span>
                    </div>
                    {fieldErrors.certificateTitle && (
                      <p
                        id="auth-certificateTitle-error"
                        className="auth-field-error"
                        role="alert"
                      >
                        {fieldErrors.certificateTitle}
                      </p>
                    )}
                    <input
                      type="text"
                      id="auth-certificateTitle"
                      name="certificateTitle"
                      aria-invalid={Boolean(fieldErrors.certificateTitle)}
                      aria-describedby={
                        fieldErrors.certificateTitle
                          ? 'auth-certificateTitle-error'
                          : undefined
                      }
                      value={certificateTitle}
                      onChange={(e) => setCertificateTitle(e.target.value)}
                      placeholder="Certificate Name (e.g. Stanford AI Fellow, NASM Certified)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mb-2 focus:outline-none focus:border-brand-purple"
                    />
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-slate-700 hover:border-brand-purple bg-slate-900/50 text-xs text-slate-400 hover:text-white transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {certificateFile
                            ? certificateFile.name
                            : 'Upload Certificate / Credential (PDF, PNG)'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          id="auth-certificateFile"
                          aria-invalid={Boolean(fieldErrors.certificateFile)}
                          aria-describedby={
                            fieldErrors.certificateFile
                              ? 'auth-certificateFile-error'
                              : undefined
                          }
                          onChange={(e) => {
                            const file = e.target.files[0] || null;
                            const issue = certificateError(file);
                            setFieldErrors((prev) => ({
                              ...prev,
                              certificateFile: issue,
                            }));
                            setCertificateFile(issue ? null : file);
                            if (issue) e.target.value = '';
                          }}
                        />
                      </label>
                      {fieldErrors.certificateFile && (
                        <p
                          id="auth-certificateFile-error"
                          className="auth-field-error"
                          role="alert"
                        >
                          {fieldErrors.certificateFile}
                        </p>
                      )}
                      {certificateFile && (
                        <button
                          type="button"
                          onClick={() => setCertificateFile(null)}
                          className="text-xs text-rose-400 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Uploaded certificates will be reviewed by admin to grant
                      your profile the official Blue Verified badge.
                    </p>
                  </div>
                </fieldset>
              </div>
            )}

            {/* Step navigation and final registration */}
            <div className="signup-form-actions">
              {isInfluencerSignup && step > 0 && (
                <button
                  type="button"
                  disabled={loading}
                  className="signup-back"
                  onClick={() => {
                    setError('');
                    setStep(step - 1);
                  }}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-coral hover:opacity-95 transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : isInfluencerSignup && step < steps.length - 1 ? (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : isRegister ? (
                  <>
                    <span>
                      Complete {role === 'influencer' ? 'Influencer' : 'User'}{' '}
                      Registration
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>
                      Sign In as {role === 'influencer' ? 'Influencer' : 'User'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch Login/Register */}
          <div className="text-center mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              {isRegister
                ? 'Already have an account?'
                : "Don't have an account yet?"}
            </span>
            <a
              href={authPath(role, isRegister ? 'login' : 'register')}
              className="font-bold text-brand-purple hover:text-brand-pink transition-colors underline"
            >
              {isRegister ? 'Sign In instead' : 'Create new account'}
            </a>
          </div>

          {/* 1-Click Demo Accounts for testing */}
          <div className="mt-5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
            <div className="font-semibold text-slate-400 mb-2 flex items-center justify-between">
              <span>Quick Test Demo Accounts:</span>
              <span className="text-[10px] text-slate-500">
                Auto-fill & Login
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('alex@example.com', 'user')}
                className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-left border border-slate-800 transition-colors"
              >
                <div className="font-bold text-white text-[11px]">
                  Alex Rivera
                </div>
                <div className="text-[10px] text-indigo-400">
                  User Role (Active)
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDemoLogin('marcus@techcreator.io', 'influencer')
                }
                className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-left border border-slate-800 transition-colors"
              >
                <div className="font-bold text-white text-[11px]">
                  Marcus Vance
                </div>
                <div className="text-[10px] text-purple-400">
                  Influencer (Approved)
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDemoLogin('kavita@angelvc.in', 'influencer')
                }
                className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-left border border-slate-800 transition-colors"
                title="Click to see Under Review Popup"
              >
                <div className="font-bold text-white text-[11px]">
                  Kavita Patel
                </div>
                <div className="text-[10px] text-amber-400">
                  Pending Review (Test Popup)
                </div>
              </button>
            </div>
          </div>

          {/* Link to Admin Command Center on port 5174 */}
          <div className="mt-3 text-center">
            <a
              href={
                import.meta.env.VITE_ADMIN_PANEL_URL ||
                (import.meta.env.PROD ? '/admin' : 'http://localhost:5174')
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-indigo transition-colors"
            >
              <span>Looking for Admin Command Center?</span>
              <span className="font-bold underline">
                Open Admin Panel &rarr;
              </span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
