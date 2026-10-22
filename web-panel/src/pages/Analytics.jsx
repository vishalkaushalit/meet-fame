import { useState } from "react";
import { FiArrowUpRight, FiCalendar, FiUsers } from "react-icons/fi";

const analytics = {
  "7 days": {
    earnings: "$8,420",
    bookings: "24",
    visitors: "2,486",
    bars: [35, 52, 44, 69, 58, 82, 70, 95, 76, 100, 84, 91],
  },
  "30 days": {
    earnings: "$32,680",
    bookings: "96",
    visitors: "9,820",
    bars: [42, 33, 57, 49, 72, 63, 55, 81, 70, 94, 78, 100],
  },
  "90 days": {
    earnings: "$91,250",
    bookings: "284",
    visitors: "28,640",
    bars: [28, 44, 39, 61, 52, 73, 66, 84, 71, 91, 82, 100],
  },
};

const panelClass =
  "min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5";

const Analytics = () => {
  const [period, setPeriod] = useState("7 days");
  const current = analytics[period];

  return (
    <div className="mx-auto max-w-[1530px] px-3 pb-5 pt-6 sm:px-5 sm:pt-[30px] lg:px-[38px]">
      <section className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 text-[9px] font-bold tracking-[1.1px] text-slate-400">
            GROW YOUR BUSINESS
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-[#18213e]">
            Analytics
          </h1>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Track earnings, bookings, and audience activity.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
          <FiCalendar aria-hidden="true" size={15} />
          <span className="sr-only">Analytics time range</span>
          <select
            className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] text-slate-700 outline-none focus:border-violet-400"
            onChange={(event) => setPeriod(event.target.value)}
            value={period}
          >
            {Object.keys(analytics).map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </section>

      <section
        aria-label="Performance summary"
        className="mb-4 grid gap-3 sm:grid-cols-3"
      >
        {[
          ["Total earnings", current.earnings, "+12.8%"],
          ["Bookings", current.bookings, "+8.4%"],
          ["Profile visitors", current.visitors, "+6.2%"],
        ].map(([label, value, change]) => (
          <article className={panelClass} key={label}>
            <span className="text-[10px] font-medium text-slate-500">
              {label}
            </span>
            <strong className="mt-3 block text-2xl text-slate-800">
              {value}
            </strong>
            <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
              <FiArrowUpRight aria-hidden="true" size={13} />
              {change} <span className="font-normal text-slate-400">vs. previous period</span>
            </span>
          </article>
        ))}
      </section>

      <section className={`${panelClass} mb-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Earnings trend
            </h2>
            <p className="mt-1 text-[9px] text-slate-400">
              Revenue performance over the last {period}
            </p>
          </div>
          <strong className="text-sm text-slate-700">{current.earnings}</strong>
        </div>
        <div
          aria-label={`Earnings bar chart for ${period}`}
          className="mt-6 flex h-48 items-end gap-2 border-b border-slate-100 px-1 sm:gap-4"
          role="img"
        >
          {current.bars.map((height, index) => (
            <div
              aria-hidden="true"
              className="flex-1 rounded-t-md bg-gradient-to-t from-violet-500 to-fuchsia-400 opacity-80 transition hover:opacity-100"
              key={`${period}-${index}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between pt-2 text-[8px] text-slate-400">
          <span>Start</span>
          <span>Mid-period</span>
          <span>Today</span>
        </div>
      </section>

      <section aria-label="Audience insights" className="grid gap-3 sm:grid-cols-2">
        <article className={panelClass}>
          <div className="flex items-center gap-2 text-violet-600">
            <FiUsers aria-hidden="true" size={17} />
            <h2 className="text-sm font-semibold text-slate-800">
              Audience growth
            </h2>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
            Your profile attracted {current.visitors} visitors during this
            period. Keep your services up to date to turn visits into bookings.
          </p>
        </article>
        <article className={panelClass}>
          <div className="flex items-center gap-2 text-emerald-600">
            <FiCalendar aria-hidden="true" size={17} />
            <h2 className="text-sm font-semibold text-slate-800">
              Booking activity
            </h2>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
            You received {current.bookings} bookings during this period.
            Review your schedule to prepare for upcoming sessions.
          </p>
        </article>
      </section>
    </div>
  );
};

export default Analytics;
