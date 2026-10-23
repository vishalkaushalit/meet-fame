import React, { useEffect, useState } from 'react';
import { Landmark, Save } from 'lucide-react';
import './bank-details.css';
import SecureInput from './SecureInput';

const empty = () => {
  return {
    accountHolder: '',
    bankName: '',
    country: 'IN',
    accountNumber: '',
    confirmAccountNumber: '',
    routingCode: '',
  };
};

export default function BankDetailsForm({ api, demoDetails = null }) {
  const [details, setDetails] = useState(null);
  const [values, setValues] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [saved, setSaved] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get().then((result) => {
        if (!active) {
          return;
        }
        setDetails(result.bankDetails);
        const initial = result.bankDetails || demoDetails;
        setValues(
          initial
            ? {
                ...empty(),
                ...initial,
                confirmAccountNumber: initial.accountNumber,
              }
            : empty(),
        );
        setEditing(true);
      }).catch((err) => {
        if (active) {
          setError(err.message || 'Unable to load bank details.');
        }
      }).finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [api, retry, demoDetails]);
  const submit = async (event) => {
    event.preventDefault();
    if (saving) {
      return;
    }
    setFields({});
    setError('');
    setSaved(false);
    if (values.accountNumber !== values.confirmAccountNumber) {
      setFields({ confirmAccountNumber: 'Account numbers must match.' });
      return;
    }
    setSaving(true);
    try {
      const result = await api.save(values);
      const updated = { ...values, ...result.bankDetails };
      setDetails(updated);
      setValues(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Unable to save bank details.');
      setFields(err.fields || {});
    } finally {
      setSaving(false);
    }
  };
  const field = (key, label, maxLength, placeholder = '') => {
    const Input = ['accountNumber', 'confirmAccountNumber'].includes(key)
      ? SecureInput
      : 'input';
    return (
      <label className="bank-field" key={key}>
        <span>{label}</span>
        <Input
          {...(Input === SecureInput
            ? { label: label.toLowerCase() }
            : { type: 'text' })}
          required
          value={values[key]}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          disabled={saving}
          aria-invalid={Boolean(fields[key])}
          aria-describedby={fields[key] ? `bank-${key}-error` : undefined}
          onChange={(event) => {
            setValues((current) => {
              return { ...current, [key]: event.target.value };
            });
            setFields((current) => {
              return { ...current, [key]: '' };
            });
          }}
        />
        {fields[key] && (
          <small id={`bank-${key}-error`} role="alert">
            {fields[key]}
          </small>
        )}
      </label>
    );
  };
  return (
    <section className="bank-details" aria-label="Bank details">
      <h2>
        <Landmark size={20} aria-hidden="true" />
        Bank details
      </h2>
      <p className="bank-description">
        Add the account you want to use for payouts. Saving details does not
        initiate a transfer.
      </p>
      {loading ? (
        <p role="status">Loading bank details…</p>
      ) : (
        <>
          {error && (
            <p className="bank-error" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="bank-success" role="status">
              Bank details saved. These details have not been verified by the
              bank.
            </p>
          )}
          {editing && (
            <form onSubmit={submit}>
              <div className="bank-grid">
                {field('accountHolder', 'Account holder name', 100)}
                {field('bankName', 'Bank name', 100)}
                {field('accountNumber', 'Account number / IBAN', 34)}
                {field(
                  'confirmAccountNumber',
                  'Confirm account number / IBAN',
                  34,
                )}
                {field('country', 'Bank country code', 2, 'IN, US, GB…')}
                {field(
                  'routingCode',
                  values.country.toUpperCase() === 'IN'
                    ? 'IFSC code'
                    : 'Routing code / SWIFT / BIC',
                  20,
                )}
              </div>
              <div className="bank-actions">
                <button className="bank-save" type="submit" disabled={saving}>
                  <Save size={16} />
                  {saving
                    ? details
                      ? 'Updating…'
                      : 'Saving…'
                    : details
                      ? 'Update'
                      : 'Save changes'}
                </button>
                {details && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setValues({
                        ...empty(),
                        ...details,
                        confirmAccountNumber: details.accountNumber,
                      });
                      setError('');
                      setFields({});
                      setSaved(false);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
          {!editing && !details && error && (
            <button
              type="button"
              onClick={() => {
                return setRetry((value) => {
                  return value + 1;
                });
              }}
            >
              Retry
            </button>
          )}
        </>
      )}
    </section>
  );
}
