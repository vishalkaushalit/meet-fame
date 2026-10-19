import { FiCalendar, FiPlus } from "react-icons/fi";
import { bookings } from "../data/bookings";

const panelClass =
  "min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5";

function Bookings({ search, onCreateBooking }) {
  const filteredBookings = bookings.filter((booking) =>
    `${booking.name} ${booking.handle} ${booking.service} ${booking.status}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-[1530px] px-3 pb-5 pt-6 sm:px-5 sm:pt-[30px] lg:px-[38px]">
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
        >
          <FiPlus aria-hidden="true" size={16} /> Create booking
        </button>
      </section>

      <section aria-label="Booking summary" className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Upcoming", "8", "bg-violet-50 text-violet-600"],
          ["Confirmed", "5", "bg-emerald-50 text-emerald-600"],
          ["Awaiting response", "3", "bg-amber-50 text-amber-600"],
        ].map(([label, value, color]) => (
          <article className={panelClass} key={label}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-500">
                {label}
              </span>
              <span className={`grid size-8 place-items-center rounded-lg ${color}`}>
                <FiCalendar aria-hidden="true" size={16} />
              </span>
            </div>
            <strong className="mt-3 block text-2xl text-slate-800">{value}</strong>
          </article>
        ))}
      </section>

      <section className={panelClass}>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-800">
            Upcoming sessions
          </h2>
          <p className="mt-1 text-[10px] text-slate-400">
            {filteredBookings.length} sessions shown
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead>
              <tr className="border-y border-slate-100 text-[8px] font-bold tracking-wider text-slate-400">
                <th className="py-3 pr-3">CLIENT</th>
                <th className="px-3 py-3">SESSION</th>
                <th className="px-3 py-3">DATE & TIME</th>
                <th className="px-3 py-3">AMOUNT</th>
                <th className="py-3 pl-3">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr
                  className="border-b border-slate-100 last:border-0"
                  key={booking.name}
                >
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full text-[9px] font-bold ${booking.color}`}
                      >
                        {booking.initials}
                      </span>
                      <span>
                        <strong className="block text-[10px] font-semibold text-slate-700">
                          {booking.name}
                        </strong>
                        <small className="text-[9px] text-slate-400">
                          {booking.handle}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[10px] text-slate-500">
                    {booking.service}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-[10px] text-slate-600">
                    {booking.date}
                  </td>
                  <td className="px-3 py-3 text-[10px] font-semibold text-slate-700">
                    {booking.amount}
                  </td>
                  <td className="py-3 pl-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                        booking.status === "Confirmed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td
                    className="p-6 text-center text-[10px] text-slate-400"
                    colSpan="5"
                  >
                    No bookings match “{search}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Bookings;
