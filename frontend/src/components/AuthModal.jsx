import LogoLoader from './LogoLoader';
import { normalizeAvailability, dayRanges } from '../../../shared/availability';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  User,
  Sparkles,
  Clock,
  Calendar,
  FileCheck,
  Plus,
  Trash2,
  Lock,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Upload,
  ArrowRight
} from 'lucide-react';
import Logo from './Logo';

export default function AuthModal({ isOpen, onClose, initialRole = 'user', initialTab = 'login' }) {
  const { login, registerUser, registerInfluencer } = useAuth();
  
  const [role, setRole] = useState(initialRole); // 'user' | 'influencer'
  const [isRegister, setIsRegister] = useState(initialTab === 'register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Influencer specific
  const [specialization, setSpecialization] = useState('Tech & AI Product Advisor');
  const [category, setCategory] = useState('Technology & AI');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState(200);
  const [certificateTitle, setCertificateTitle] = useState('');
  const [certificateFile, setCertificateFile] = useState(null);

  // Day-wise availability configuration for influencer
  // Default Monday: 9-12 and 17-20 as described in prompt!
  const [availability, setAvailability] = useState(() => normalizeAvailability({
    monday: [
      { start: '09:00', end: '12:00' },
      { start: '17:00', end: '20:00' }
    ],
    tuesday: [{ start: '10:00', end: '14:00' }],
    wednesday: [{ start: '09:00', end: '12:00' }],
    thursday: [{ start: '11:00', end: '15:00' }],
    friday: [{ start: '09:00', end: '13:00' }],
    saturday: [{ start: '10:00', end: '12:00' }],
    sunday: []
  }));

  const [activeDayTab, setActiveDayTab] = useState('monday');

  if (!isOpen) return null;

  const categories = [
    'Technology & AI',
    'Health & Fitness',
    'Fashion & Lifestyle',
    'Business & Finance',
    'Content Creation & Media',
    'Design & Creative',
    'Career & Leadership'
  ];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Calculate 1-hour slots for active tab to show real-time auto-generation preview!
  const generatePreviewSlots = (ranges = []) => {
    const slots = [];
    dayRanges(ranges).forEach(r => {
      if (!r.start || !r.end) return;
      const [sh] = r.start.split(':').map(Number);
      const [eh] = r.end.split(':').map(Number);
      let curr = sh;
      while (curr < eh) {
        const next = curr + 1;
        const fmt = (h) => {
          const p = h >= 12 ? 'PM' : 'AM';
          const dh = h % 12 === 0 ? 12 : h % 12;
          return `${dh} ${p}`;
        };
        slots.push(`${fmt(curr)} - ${fmt(next)}`);
        curr++;
      }
    });
    return slots;
  };

  const handleAddRange = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ranges: [...dayRanges(prev[day]), { start: '14:00', end: '17:00' }] }
    }));
  };

  const handleRemoveRange = (day, index) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ranges: dayRanges(prev[day]).filter((_, idx) => idx !== index) }
    }));
  };

  const handleRangeChange = (day, index, field, value) => {
    setAvailability(prev => {
      const updated = [...dayRanges(prev[day])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [day]: { ranges: updated } };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (role === 'influencer') {
          const formData = new FormData();
          formData.append('name', name);
          formData.append('email', email);
          formData.append('phone', phone);
          formData.append('password', password);
          formData.append('specialization', specialization);
          formData.append('category', category);
          formData.append('bio', bio);
          formData.append('hourlyRate', hourlyRate);
          formData.append('certificateTitle', certificateTitle);
          formData.append('availability', JSON.stringify(availability));
          if (certificateFile) {
            formData.append('certificateFile', certificateFile);
          }

          await registerInfluencer(formData);
          // Modal will close and status popup will trigger
          onClose();
        } else {
          // User registration
          await registerUser({ name, email, phone, password });
          onClose();
        }
      } else {
        // Login
        await login(email, password, role);
        onClose();
      }
    } catch (err) {
      setError(err.message || err.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins
  const handleDemoLogin = async (demoEmail, demoRole) => {
    setRole(demoRole);
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'password123', demoRole);
      onClose();
    } catch (err) {
      setError(err.message || err.error || 'Demo login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <Logo size="md" />
          </div>
          <h2 className="text-2xl font-black text-white mt-2">
            {isRegister ? 'Join MeetFame' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isRegister
              ? 'Connect directly with fans or book top category leaders'
              : 'Sign in to access your dashboard and 1-hour sessions'}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setRole('user'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              role === 'user'
                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>User / Fan</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('influencer'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              role === 'influencer'
                ? 'bg-gradient-to-r from-brand-purple to-brand-coral text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Influencer / Creator</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Registration Fields */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  required={role === 'influencer'}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          {/* INFLUENCER REGISTRATION SPECIFIC DETAILS */}
          {isRegister && role === 'influencer' && (
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-brand-purple flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span>Influencer Profile & Specialization</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple"
                  >
                    {categories.map(c => (
                      <option key={c} value={c} className="bg-slate-900">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hourly Consultation Rate ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      min="50"
                      step="10"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full bg-slate-950/70 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Specialization / Expertise</label>
                <input
                  type="text"
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. AI Strategy, Venture Capital, Fitness Coaching"
                  className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple"
                />
              </div>

              {/* Certification Upload for Verified Badge */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-[#0095F6]" />
                    <span>Specialization Certification (For Blue Verified Badge)</span>
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                    Instagram Style Badge
                  </span>
                </div>
                <input
                  type="text"
                  value={certificateTitle}
                  onChange={(e) => setCertificateTitle(e.target.value)}
                  placeholder="Certificate Name (e.g. Stanford AI Fellow, NASM Certified)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mb-2 focus:outline-none focus:border-brand-purple"
                />
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-slate-700 hover:border-brand-purple bg-slate-900/50 text-xs text-slate-400 hover:text-white transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{certificateFile ? certificateFile.name : 'Upload Certificate / Credential (PDF, PNG)'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => setCertificateFile(e.target.files[0] || null)}
                    />
                  </label>
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
                  Uploaded certificates will be reviewed by admin to grant your profile the official Blue Verified badge.
                </p>
              </div>

              {/* Day-Wise Availability & 1-Hour Slot Generator */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-coral" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Day-Wise Time Availability (1-Hour Slots)
                    </span>
                  </div>
                  <span className="text-[10px] text-brand-coral bg-brand-coral/10 px-2 py-0.5 rounded-full border border-brand-coral/20">
                    1-Hour Slots Auto-Generated
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-3">
                  Define your available time ranges per day. MeetFame will automatically slice them into 1-hour bookable appointment slots.
                </p>

                {/* Day selector pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 text-xs">
                  {days.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setActiveDayTab(d)}
                      className={`px-3 py-1.5 rounded-lg font-bold capitalize whitespace-nowrap transition-all ${
                        activeDayTab === d
                          ? 'bg-brand-coral text-white shadow'
                          : 'bg-slate-850 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d.slice(0, 3)}
                      {dayRanges(availability[d]).length > 0 && (
                        <span className="ml-1 text-[10px] opacity-75">({dayRanges(availability[d]).length})</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Time ranges for selected day */}
                <div className="space-y-2 mb-3">
                  {dayRanges(availability[activeDayTab]).length === 0 ? (
                    <div className="text-xs text-slate-500 py-3 text-center bg-slate-900/60 rounded-xl border border-slate-800/80">
                      No availability configured for {activeDayTab}. Click "Add Range" to open slots.
                    </div>
                  ) : (
                    dayRanges(availability[activeDayTab]).map((range, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-400 ml-1" />
                        <span className="text-xs text-slate-400">From</span>
                        <input
                          type="time"
                          value={range.start}
                          onChange={(e) => handleRangeChange(activeDayTab, idx, 'start', e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-purple"
                        />
                        <span className="text-xs text-slate-400">to</span>
                        <input
                          type="time"
                          value={range.end}
                          onChange={(e) => handleRangeChange(activeDayTab, idx, 'end', e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-purple"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveRange(activeDayTab, idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 ml-auto rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}

                  <button
                    type="button"
                    onClick={() => handleAddRange(activeDayTab)}
                    className="w-full py-1.5 border border-dashed border-slate-700 hover:border-brand-coral rounded-xl text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Time Window for {activeDayTab}</span>
                  </button>
                </div>

                {/* Real-time 1-hour slots generator preview */}
                <div className="bg-slate-900/70 rounded-xl p-2.5 border border-slate-800 text-xs">
                  <div className="font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Generated 1-Hour Slots for {activeDayTab.toUpperCase()}:</span>
                    <span className="text-brand-purple font-mono">
                      {generatePreviewSlots(availability[activeDayTab] || []).length} slots
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {generatePreviewSlots(availability[activeDayTab] || []).length === 0 ? (
                      <span className="text-slate-500 italic text-[11px]">No slots generated yet</span>
                    ) : (
                      generatePreviewSlots(availability[activeDayTab] || []).map((slot, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono">
                          {slot}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-coral hover:opacity-95 transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <LogoLoader variant="button" label="Processing…" />
            ) : isRegister ? (
              <>
                <span>Complete {role === 'influencer' ? 'Influencer' : 'User'} Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Sign In as {role === 'influencer' ? 'Influencer' : 'User'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch Login/Register */}
        <div className="text-center mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}
          </span>
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="font-bold text-brand-purple hover:text-brand-pink transition-colors underline"
          >
            {isRegister ? 'Sign In instead' : 'Create new account'}
          </button>
        </div>

        {/* 1-Click Demo Accounts for testing */}
        <div className="mt-5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
          <div className="font-semibold text-slate-400 mb-2 flex items-center justify-between">
            <span>Quick Test Demo Accounts:</span>
            <span className="text-[10px] text-slate-500">Auto-fill & Login</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('alex@example.com', 'user')}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-left border border-slate-800 transition-colors"
            >
              <div className="font-bold text-white text-[11px]">Alex Rivera</div>
              <div className="text-[10px] text-indigo-400">User Role (Active)</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('marcus@techcreator.io', 'influencer')}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-left border border-slate-800 transition-colors"
            >
              <div className="font-bold text-white text-[11px]">Marcus Vance</div>
              <div className="text-[10px] text-purple-400">Influencer (Approved)</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('kavita@angelvc.in', 'influencer')}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-left border border-slate-800 transition-colors"
              title="Click to see Under Review Popup"
            >
              <div className="font-bold text-white text-[11px]">Kavita Patel</div>
              <div className="text-[10px] text-amber-400">Pending Review (Test Popup)</div>
            </button>
          </div>
        </div>

        {/* Link to Admin Command Center on port 5174 */}
        <div className="mt-3 text-center">
          <a
            href={import.meta.env.VITE_ADMIN_PANEL_URL || (import.meta.env.PROD ? '/admin' : 'http://localhost:5174')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-indigo transition-colors"
          >
            <span>Looking for Admin Command Center?</span>
            <span className="font-bold underline">Open Admin Panel (Port 5174) &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
