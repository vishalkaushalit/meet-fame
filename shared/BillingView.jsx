import React, { useCallback, useEffect, useState } from 'react';
import './billing.css';
import FilterSelect from './FilterSelect';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  Clock,
  ReceiptText,
  Wallet,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { formatDate } from './dateFormat';

const money = (amount, currency) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(amount / 100);
const reportingAmount = (item) =>
  Number.isSafeInteger(item.usdAmount)
    ? { amount: item.usdAmount, currency: 'USD' }
    : { amount: item.amount, currency: item.currency };
const statusLabel = {
  pending: 'Awaiting payment',
  paid: 'Paid',
  refund_pending: 'Refund requested',
  refunded: 'Refunded',
};
export default function BillingView({
  loadTransactions,
  admin = false,
  refreshKey = 0,
  headerTarget = null,
  showRefresh = true,
  showSummary = true,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    loadTransactions()
      .then((result) => {
        if (active) {
          setTransactions(result.transactions || []);
          setError('');
        }
      })
      .catch(() => {
        if (active)
          setError('Unable to load billing history. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadTransactions, revision, refreshKey]);
  useEffect(() => {
    window.addEventListener('meetfame-bookings-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('meetfame-bookings-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);
  const query = search.trim().toLowerCase();
  const filtered = transactions.filter(
    (item) =>
      (status === 'all' || item.status === status) &&
      [
        item.influencerName,
        item.userName,
        item.bookingId,
        item.paymentId,
        item.orderId,
        item.refundId,
        item.date,
        item.slot,
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query),
      ),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  const totals = transactions.reduce((result, item) => {
    const { amount, currency } = reportingAmount(item);
    if (item.status === 'paid')
      result[currency] = (result[currency] || 0) + amount;
    return result;
  }, {});
  const billingToolbar = (
    <div className="billing-toolbar">
      <div className="billing-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          aria-label="Search transactions"
          placeholder={
            admin
              ? 'Search by influencer, user, transaction ID...'
              : 'Search by influencer, booking, transaction ID...'
          }
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>
      <FilterSelect
        label="Filter by payment status"
        value={status}
        onChange={(event) => {
          setStatus(event.target.value);
          setPage(1);
        }}
      >
        <option value="all">All statuses</option>
        {Object.entries(statusLabel).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </FilterSelect>
    </div>
  );
  const billingHeading = (
    <div className="billing-heading">
      <div>
        <h2>Billing & transactions</h2>
        <p>
          {admin
            ? 'Payment history across the platform.'
            : 'Your session payments and refunds.'}
        </p>
      </div>
      {showRefresh && (
        <button type="button" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      )}
    </div>
  );
  return (
    <section className="billing-view" aria-label="Billing">
      {!admin &&
        (headerTarget
          ? createPortal(
              <div className="billing-pinned-controls">
                {billingHeading}
                {billingToolbar}
              </div>,
              headerTarget,
            )
          : billingHeading)}
      {error && (
        <p role="alert" className="billing-error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading transactions…</p>
      ) : (
        !error && (
          <>
            {showSummary && (
              <div className="billing-totals">
                <div className="billing-summary-card">
                  <div className="billing-summary-top">
                    <span className="billing-summary-label">Transactions</span>
                    <span className="billing-summary-icon">
                      <ReceiptText size={20} aria-hidden="true" />
                    </span>
                  </div>
                  <strong>{transactions.length.toLocaleString()}</strong>
                  <p className="billing-summary-caption">All payment records</p>
                </div>
                {Object.entries(totals).map(([currency, amount]) => (
                  <div
                    key={currency}
                    className="billing-summary-card billing-summary-collected"
                  >
                    <div className="billing-summary-top">
                      <span className="billing-summary-label">
                        {admin ? 'Collected' : 'Paid'}{' '}
                        <span className="billing-summary-currency">
                          {currency}
                        </span>
                      </span>
                      <span className="billing-summary-icon">
                        <Wallet size={20} aria-hidden="true" />
                      </span>
                    </div>
                    <strong>{money(amount, currency)}</strong>
                    <p className="billing-summary-caption">
                      <CheckCircle2 size={13} aria-hidden="true" />
                      {currency === 'USD' &&
                      transactions.some(
                        (item) =>
                          item.currency !== 'USD' &&
                          Number.isSafeInteger(item.usdAmount),
                      )
                        ? 'Includes USD equivalents'
                        : 'Confirmed payments'}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {!headerTarget && billingToolbar}
            {filtered.length ? (
              <>
                <div className="billing-table-scroll">
                  <table
                    className="billing-table"
                    style={{ minWidth: admin ? 1380 : 1200 }}
                  >
                    <colgroup>
                      <col style={{ width: 60 }} />
                      <col style={{ width: 140 }} />
                      {admin && <col style={{ width: 180 }} />}
                      <col style={{ width: 240 }} />
                      <col style={{ width: 200 }} />
                      <col style={{ width: 140 }} />
                      <col style={{ width: 190 }} />
                      <col style={{ width: 230 }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th scope="col">S.No.</th>
                        <th scope="col">Date</th>
                        {admin && <th scope="col">Customer</th>}
                        <th scope="col">Session</th>
                        <th scope="col">Booking ID</th>
                        <th scope="col">Amount</th>
                        <th scope="col">Status</th>
                        <th scope="col">Transaction ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered
                        .slice((currentPage - 1) * 10, currentPage * 10)
                        .map((item, index) => (
                          <tr key={item.id}>
                            <td>{(currentPage - 1) * 10 + index + 1}</td>
                            <td className="billing-created-date">
                              {formatDate(item.createdAt)}
                            </td>
                            {admin && <td>{item.userName || item.userId}</td>}
                            <td className="billing-session-cell">
                              <div className="billing-session">
                                <strong className="billing-session-name">
                                  {item.influencerName || item.influencerId}
                                </strong>
                                <div className="billing-session-schedule">
                                  <span className="billing-session-date">
                                    <CalendarDays
                                      size={14}
                                      aria-hidden="true"
                                    />
                                    {formatDate(item.date)}
                                  </span>
                                  <span className="time-slot-badge">
                                    <Clock size={13} aria-hidden="true" />
                                    {item.slot || 'Time unavailable'}
                                    {item.slot && (
                                      <span className="billing-timezone">
                                        IST
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="billing-booking-id">
                              {item.bookingId ? (
                                <span>{item.bookingId}</span>
                              ) : (
                                <span aria-label="No linked booking">—</span>
                              )}
                            </td>
                            <td className="billing-amount">
                              {money(
                                reportingAmount(item).amount,
                                reportingAmount(item).currency,
                              )}
                              {item.currency !== 'USD' &&
                                Number.isSafeInteger(item.usdAmount) && (
                                  <small>
                                    Originally charged{' '}
                                    {money(item.amount, item.currency)}
                                  </small>
                                )}
                            </td>
                            <td>
                              <span
                                className={`billing-status is-${item.status}`}
                              >
                                {statusLabel[item.status] || item.status}
                              </span>
                            </td>
                            <td className="billing-reference">
                              {item.paymentId || 'Payment not confirmed'}
                              <small>Order ID: {item.orderId}</small>
                              {item.refundId && (
                                <small>Refund: {item.refundId}</small>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {pages > 1 && (
                  <div className="billing-pagination">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      Page {currentPage} of {pages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === pages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="billing-empty">
                {transactions.length
                  ? 'No transactions match your search or status.'
                  : 'No transactions yet. Your payments will appear here.'}
              </p>
            )}
          </>
        )
      )}
    </section>
  );
}
