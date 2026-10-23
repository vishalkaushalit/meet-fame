import React from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import './filter-select.css';

export default function FilterSelect({
  label,
  children,
  className = '',
  ...props
}) {
  return (
    <label className={`filter-select ${className}`}>
      <span className="sr-only">{label}</span>
      <Filter className="filter-select-icon" size={18} aria-hidden="true" />
      <select {...props} aria-label={label}>
        {children}
      </select>
      <ChevronDown
        className="filter-select-chevron"
        size={18}
        aria-hidden="true"
      />
    </label>
  );
}
