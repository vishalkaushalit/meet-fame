import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './secure-input.css';

export default function SecureInput({ label = 'password', ...props }) {
  const [visible, setVisible] = useState(false);
  return <div className="secure-input">
    <input {...props} type={visible ? 'text' : 'password'} />
    <button className="secure-input-toggle" type="button" disabled={props.disabled}
      aria-label={`${visible ? 'Hide' : 'Show'} ${label}`} aria-pressed={visible}
      onClick={() => setVisible((value) => !value)}>
      {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  </div>;
}
