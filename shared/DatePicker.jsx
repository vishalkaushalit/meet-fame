import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from './dateFormat';
import './date-picker.css';
const today = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
const keyOf = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parse = (value) => new Date(`${value}T12:00:00`);
export default function DatePicker({
  value = '',
  onChange,
  min,
  max,
  disabled,
  required,
  id,
  className = '',
  'aria-label': ariaLabel,
}) {
  const uid = useId();
  const inputId = id || uid;
  const spacingClasses = className
    .split(/\s+/)
    .filter((name) => /^(?:[\w-]+:)*m[trblxy]?-/.test(name));
  const inputClasses = className
    .split(/\s+/)
    .filter((name) => !spacingClasses.includes(name))
    .join(' ');
  const root = useRef(null),
    popup = useRef(null),
    input = useRef(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => parse(value || today()));
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const allowed = (key) => (!min || key >= min) && (!max || key <= max);
  const close = () => {
    setOpen(false);
    input.current?.focus();
  };
  const show = () => {
    if (disabled) return;
    setMonth(parse(value || (min && today() < min ? min : today())));
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = root.current.getBoundingClientRect();
      const height = popup.current?.offsetHeight || 350;
      setPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 312)),
        top: Math.max(
          8,
          rect.bottom + height + 8 <= window.innerHeight
            ? rect.bottom + 6
            : rect.top - height - 6,
        ),
      });
    };
    place();
    const outside = (event) => {
      if (
        !root.current?.contains(event.target) &&
        !popup.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    popup.current
      ?.querySelector(
        '[data-selected="true"]:not(:disabled), [data-today="true"]:not(:disabled), .date-picker-day:not(:disabled)',
      )
      ?.focus();
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (start.getDay() + 6) % 7;
  const days = Array.from(
    { length: 42 },
    (_, index) =>
      new Date(month.getFullYear(), month.getMonth(), index - offset + 1),
  );
  const select = (key) => {
    onChange?.({ target: { value: key } });
    close();
  };
  const move = (delta) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  return (
    <span
      className={`date-picker-field ${spacingClasses.join(' ')}`}
      ref={root}
    >
      <input
        id={inputId}
        ref={input}
        type="text"
        inputMode="none"
        autoComplete="off"
        value={value ? formatDate(value) : ''}
        placeholder="DD MMM, YYYY"
        required={required}
        disabled={disabled}
        className={inputClasses}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${uid}-calendar` : undefined}
        onChange={() => {}}
        onClick={show}
        onInvalid={() => show()}
        onKeyDown={(event) => {
          if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
            event.preventDefault();
            show();
          }
        }}
      />
      <button
        type="button"
        className="date-picker-trigger"
        disabled={disabled}
        aria-label={
          ariaLabel ? `Choose ${ariaLabel.toLowerCase()}` : 'Choose date'
        }
        onClick={() => (open ? close() : show())}
      >
        <Calendar size={18} aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            ref={popup}
            id={`${uid}-calendar`}
            role="dialog"
            aria-label="Choose date"
            className="date-picker-popup"
            style={position}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                close();
              }
            }}
          >
            <div className="date-picker-heading">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => move(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span aria-live="polite">
                {month.toLocaleDateString('en-GB', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => move(1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="date-picker-grid">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <span className="date-picker-weekday" key={day}>
                  {day}
                </span>
              ))}
              {days.map((date) => {
                const key = keyOf(date);
                return (
                  <button
                    type="button"
                    className={`date-picker-day ${date.getMonth() !== month.getMonth() ? 'is-outside' : ''}`}
                    key={key}
                    disabled={!allowed(key)}
                    data-selected={key === value}
                    data-today={key === today()}
                    aria-label={formatDate(key)}
                    aria-pressed={key === value}
                    onClick={() => select(key)}
                    onKeyDown={(event) => {
                      const delta = {
                        ArrowLeft: -1,
                        ArrowRight: 1,
                        ArrowUp: -7,
                        ArrowDown: 7,
                      }[event.key];
                      if (!delta) return;
                      event.preventDefault();
                      const next = new Date(date);
                      next.setDate(next.getDate() + delta);
                      const index = days.findIndex(
                        (item) => keyOf(item) === keyOf(next),
                      );
                      if (index >= 0)
                        popup.current
                          .querySelectorAll('.date-picker-day')
                          [index]?.focus();
                    }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="date-picker-footer">
              <button
                type="button"
                disabled={!allowed(today())}
                onClick={() => select(today())}
              >
                Today
              </button>
              {!required && (
                <button type="button" onClick={() => select('')}>
                  Clear
                </button>
              )}
              <button type="button" onClick={close}>
                Close
              </button>
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
