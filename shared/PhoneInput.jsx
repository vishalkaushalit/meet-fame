import './phone-input.css';
import React, { useEffect, useRef, useState } from 'react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js/min';
import { phoneError } from './phoneValidation';

const names = new Intl.DisplayNames(['en'], { type: 'region' });
const countries = getCountries().sort((a, b) => names.of(a).localeCompare(names.of(b)));
const flag = (country) => String.fromCodePoint(...[...country].map((letter) => letter.charCodeAt(0) + 127397));

export default function PhoneInput({ id, value, onChange, required = false, disabled = false, invalid = false, describedBy }) {
  const initial = parsePhoneNumberFromString(value || '');
  const [country, setCountry] = useState(initial?.country || (initial?.countryCallingCode === '1' ? 'US' : 'IN'));
  const input = useRef(null);
  const prefix = `+${getCountryCallingCode(country)}`;
  const compact = (value || '').replace(/[^+0-9]/g, '');
  const national = compact.startsWith(prefix) ? compact.slice(prefix.length) : compact.replace(/\D/g, '');
  const error = phoneError(value, required);
  useEffect(() => { input.current?.setCustomValidity(error); }, [error]);
  return (
    <div className="phone-input flex w-full items-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950/70 text-sm text-white focus-within:border-brand-purple">
      <div className="phone-country relative flex w-16 shrink-0 items-center justify-center self-stretch border-r border-slate-700">
        <span aria-hidden="true" className="flex items-center gap-1.5 text-base">{flag(country)}<span className="text-[10px] text-slate-400">▾</span></span>
      <select aria-label="Phone country" value={country} disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          setCountry(next);
          onChange(national ? `+${getCountryCallingCode(next)}${national}` : '');
          input.current?.focus();
        }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
        {countries.map((code) => <option key={code} value={code}>{flag(code)} {names.of(code)} (+{getCountryCallingCode(code)})</option>)}
      </select>
      </div>
      <span className="phone-prefix shrink-0 text-slate-400" aria-label={`Country calling code ${prefix}`}>{prefix}</span>
      <input ref={input} id={id} name="phone" type="tel" inputMode="numeric" pattern="[0-9]*"
        autoComplete="tel-national" required={required} disabled={disabled}
        maxLength={15 - prefix.length + 1} value={national}
        aria-invalid={invalid} aria-describedby={describedBy} placeholder="Enter your phone number"
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 15 - prefix.length + 1);
          onChange(digits ? `${prefix}${digits}` : '');
        }} className="phone-national min-w-0 flex-1 rounded-r-xl border-0 bg-transparent px-3 py-2.5 text-sm text-white outline-none" />
    </div>
  );
}
