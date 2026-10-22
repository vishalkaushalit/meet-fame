import { useDeferredValue, useMemo, useState } from "react";
import { FiCalendar, FiPlus, FiSearch, FiX } from "react-icons/fi";

const panelClass =
  "min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5";

/* ---------- helpers ---------- */

// Highlight the first occurrence of each search term inside text
const highlight = (text, terms) => {
  if (!terms.length || text == null) return text;
  const str = String(text);
  const escaped = terms
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return text;
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = str.split(re);
  return parts.map((part, i) =>
    re.test(part) ? (
      <mark key={i} className="rounded bg-violet-100 px-0.5 text-violet-800">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
};

// Return true if EVERY term appears somewhere in the searchable fields
const matchesAllTerms = (booking, terms) => {
  if (!terms.length) return true;
  const haystack = [
    booking.name,
    booking.handle,
    booking.service,
    booking.status,
    booking.date,
    booking.amount,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return terms.every((t) => haystack.includes(t));
};

/* ---------- component ---------- */

const Bookings = ({
  search: controlledSearch,
  onSearchChange: controlledOnChange,
  bookings,
  loading,
  errorMessage,
  onCreateBooking,
}) => {
  // Allow the component to work with or without parent state
  const [internalSearch, setInternalSearch] = useState("");
  const search = controlledSearch ?? internalSearch;
  const setSearch = controlledOnChange ?? setInternalSearch;

  // Keep typing snappy on large lists
  const deferredSearch = useDeferredValue(search);
  const isStale = search !== deferredSearch;

  const terms = useMemo(
    () => deferredSearch.toLowerCase().trim().split(/\s+/).filter(Boolean),
    [deferredSearch],
  );

  const filteredBookings = useMemo(
    () => bookings.filter((b) => matchesAllTerms(b, terms)),
    [bookings, terms],
  );

  const confirmedCount = useMemo(
    () => bookings.filter((b) => b.status === "Confirmed").length,
    [bookings],
  );

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === "Pending").length,
    [bookings],
  );

  return (
    <div className="mx-auto max-w-[1530px] px-3 pb-5 pt-6 sm:px-5 sm:pt-[30px] lg:px-[38px]">
      {/* ---------- Page header ---------- */}
      <section className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 text-[9px] font-bold tracking-[1.1px] text-slate-400">
            YOUR SCHEDULE
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-[#18213e]">
            Bookings
          </h1>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Manage upcoming sessions and keep your schedule on track.
          </p>
        </div>
        <button
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-3.5 text-[11px] font-semibold text-white shadow-md shadow-violet-600/20 transition hover:-translate-y-px"
          onClick={onCreateBooking}
          type="button"
        >
          <FiPlus aria-hidden="true" size={16} /> Create booking
        </button>
      </section>

      {/* ---------- Summary cards ---------- */}
      <section
        aria-label="Booking summary"
        className="mb-4 grid gap-3 sm:grid-cols-3"
      >
        {[
          [
            "Upcoming",
            loading ? "—" : bookings.length,
            "bg-violet-50 text-violet-600",
          ],
          [
            "Confirmed",
            loading ? "—" : confirmedCount,
            "bg-emerald-50 text-emerald-600",
          ],
          [
            "Awaiting response",
            loading ? "—" : pendingCount,
            "bg-amber-50 text-amber-600",
          ],
        ].map(([label, value, color]) => (
          <article className={panelClass} key={label}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-500">
                {label}
              </span>
              <span
                className={`grid size-8 place-items-center rounded-lg ${color}`}
              >
                <FiCalendar aria-hidden="true" size={16} />
              </span>
            </div>
            <strong className="mt-3 block text-2xl text-slate-800">
              {value}
            </strong>
          </article>
        ))}
      </section>

      {/* ---------- Sessions table ---------- */}
      <section className={panelClass}>
        {/* Header + search bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Upcoming sessions
            </h2>
            <p className="mt-1 text-[10px] text-slate-400">
              {loading
                ? "Loading sessions…"
                : search.trim()
                  ? `${filteredBookings.length} of ${bookings.length} sessions shown`
                  : `${bookings.length} sessions`}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <FiSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              aria-label="Search bookings"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-200"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by client, service, date, or status…"
              type="search"
              value={search}
            />
            {search && (
              <button
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                onClick={() => setSearch("")}
                type="button"
              >
                <FiX size={12} />
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <p className="mb-4 text-[10px] text-rose-600" role="alert">
            {errorMessage}
          </p>
        )}

        <div
          aria-busy={isStale}
          className={`overflow-hidden rounded-xl border border-slate-200 bg-white transition-opacity ${
            isStale ? "opacity-60" : "opacity-100"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="py-3 pl-4 pr-3">
                    Client
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Session
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Date &amp; Time
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Amount
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Certification
                  </th>
                  <th scope="col" className="px-3 py-3 text-center">
                    Blocking remark
                  </th>
                  <th scope="col" className="py-3 pl-3 pr-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  // Assuming "Confirmed" means the application is approved/active
                  const isConfirmed = booking.status === "Confirmed";

                  return (
                    <tr
                      className="border-b border-slate-100 align-top transition-colors last:border-0 hover:bg-slate-50/60"
                      key={booking.id}
                    >
                      {/* 1. CLIENT */}
                      <td className="py-4 pl-4 pr-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-bold ring-1 ring-slate-200 ${booking.color}`}
                          >
                            {booking.initials}
                          </span>
                          <div className="min-w-0">
                            <strong className="block truncate text-[12px] font-semibold text-slate-800">
                              {highlight(booking.name, terms)}
                            </strong>
                            <small className="block truncate text-[11px] text-slate-400">
                              {highlight(booking.handle, terms)}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* 2. SESSION */}
                      <td className="px-3 py-4 text-[11px] text-slate-500">
                        {highlight(booking.service, terms)}
                      </td>

                      {/* 3. DATE & TIME */}
                      <td className="whitespace-nowrap px-3 py-4 text-[11px] text-slate-600">
                        {highlight(booking.date, terms)}
                      </td>

                      {/* 4. AMOUNT */}
                      <td className="whitespace-nowrap px-3 py-4 text-[11px] font-semibold tabular-nums text-slate-700">
                        {highlight(booking.amount, terms)}
                      </td>

                      {/* 5. STATUS */}
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            isConfirmed
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                              : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {booking.status === "Pending"
                            ? "Pending Review"
                            : booking.status}
                        </span>
                      </td>

                      {/* 6. CERTIFICATION CARD */}
                      <td className="px-3 py-4">
                        {booking.certification ? (
                          <div className="flex w-full max-w-[340px] flex-col gap-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5">
                            <div className="flex items-start gap-2">
                              <svg
                                className="mt-0.5 shrink-0 text-indigo-500"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <div className="text-[11px] leading-relaxed text-slate-500">
                                Credential:{" "}
                                <strong className="font-semibold text-slate-900">
                                  {booking.certification.name}
                                </strong>
                              </div>
                            </div>

                            <a
                              href={booking.certification.url || "#"}
                              className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-violet-600 hover:text-violet-800"
                            >
                              Preview Document
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>

                            {booking.certification.status === "Verified" ? (
                              <button className="inline-flex w-fit items-center justify-center rounded-lg border border-rose-200 bg-rose-100 px-3 py-1.5 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-200">
                                Revoke Blue Badge
                              </button>
                            ) : (
                              <button className="inline-flex w-fit items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-indigo-500">
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Verify Certificate
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="mt-2 block text-[11px] text-slate-400">
                            —
                          </span>
                        )}
                      </td>

                      {/* 7. BLOCKING REMARK */}
                      <td className="px-3 py-4 text-center text-[11px] text-slate-400">
                        {booking.remark || "—"}
                      </td>

                      {/* 8. ACTIONS */}
                      <td className="py-4 pl-3 pr-4">
                        <div className="flex flex-col items-end gap-2">
                          {/* Top Row */}
                          <div className="flex items-center gap-2">
                            <button className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>

                            {isConfirmed ? (
                              <>
                                <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-500/20">
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                  </svg>
                                  Active for Login
                                </button>
                                <button className="grid size-8 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100">
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <line
                                      x1="4.93"
                                      y1="4.93"
                                      x2="19.07"
                                      y2="19.07"
                                    />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <button className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-[11px] font-semibold text-white hover:bg-emerald-600 shadow-sm">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                  <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                Approve Application
                              </button>
                            )}
                          </div>

                          {/* Bottom Row (Only for Pending) */}
                          {!isConfirmed && (
                            <div className="flex items-center gap-2 pr-[42px]">
                              <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[11px] font-semibold text-rose-600 hover:bg-rose-100">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="15" y1="9" x2="9" y2="15" />
                                  <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                Decline
                              </button>
                              <button className="grid size-8 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line
                                    x1="4.93"
                                    y1="4.93"
                                    x2="19.07"
                                    y2="19.07"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && !errorMessage && filteredBookings.length === 0 && (
                  <tr>
                    <td
                      className="p-6 text-center text-[11px] text-slate-400"
                      colSpan="8"
                    >
                      {search.trim()
                        ? `No bookings match “${search.trim()}”.`
                        : "No bookings have been created yet."}
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      className="p-6 text-center text-[11px] text-slate-400"
                      colSpan="8"
                    >
                      Loading bookings…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Bookings;
