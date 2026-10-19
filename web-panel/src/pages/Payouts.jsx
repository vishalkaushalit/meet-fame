import { FiCreditCard, FiDownload, FiInfo } from "react-icons/fi";

const payouts = [
  {
    id: "PO-2048",
    date: "Oct 14, 2026",
    method: "Bank account •••• 4821",
    amount: "$1,240.00",
    status: "Paid",
  },
  {
    id: "PO-2047",
    date: "Oct 07, 2026",
    method: "Bank account •••• 4821",
    amount: "$980.00",
    status: "Paid",
  },
  {
    id: "PO-2046",
    date: "Sep 30, 2026",
    method: "Bank account •••• 4821",
    amount: "$1,560.00",
    status: "Paid",
  },
];

const panelClass =
  "min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5";

function Payouts() {
  return (
    <div className="mx-auto max-w-[1530px] px-3 pb-5 pt-6 sm:px-5 sm:pt-[30px] lg:px-[38px]">
      <section className="mb-5">
        <div className="mb-2 text-[9px] font-bold tracking-[1.1px] text-slate-400">
          YOUR EARNINGS
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-[#18213e]">
          Payouts
        </h1>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Review your available balance and payout history.
        </p>
      </section>

      <section aria-label="Payout balance" className="mb-4 grid gap-3 md:grid-cols-2">
        <article className="rounded-xl bg-gradient-to-br from-[#18213e] to-violet-800 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 text-[10px] text-violet-100">
            <FiCreditCard aria-hidden="true" size={16} />
            Available balance
          </div>
          <strong className="mt-4 block text-3xl font-bold">$2,840.50</strong>
          <p className="mt-2 text-[9px] text-violet-100">
            Your earnings available for your next payout.
          </p>
        </article>
        <article className={`${panelClass} flex flex-col justify-center`}>
          <span className="text-[10px] font-medium text-slate-500">
            Next scheduled payout
          </span>
          <strong className="mt-2 text-lg text-slate-800">Oct 21, 2026</strong>
          <span className="mt-1 text-[9px] text-slate-400">
            Payouts are sent to your linked bank account.
          </span>
        </article>
      </section>

      <section className={`${panelClass} mb-4`}>
        <div className="flex items-start gap-2">
          <FiInfo
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-violet-500"
            size={15}
          />
          <p className="text-[9px] leading-relaxed text-slate-500">
            Payout details shown here are sample dashboard data. Connect your
            payment provider to view and manage real transfers.
          </p>
        </div>
      </section>

      <section className={panelClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Payout history
            </h2>
            <p className="mt-1 text-[9px] text-slate-400">
              Recent transfers to your account
            </p>
          </div>
          <button
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[9px] font-semibold text-slate-600 transition hover:bg-slate-50"
            onClick={() => window.print()}
            type="button"
          >
            <FiDownload aria-hidden="true" size={13} />
            Print
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-y border-slate-100 text-[8px] font-bold tracking-wider text-slate-400">
                <th className="py-3 pr-3">PAYOUT</th>
                <th className="px-3 py-3">DATE</th>
                <th className="px-3 py-3">METHOD</th>
                <th className="px-3 py-3">AMOUNT</th>
                <th className="py-3 pl-3">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr className="border-b border-slate-100 last:border-0" key={payout.id}>
                  <td className="py-3 pr-3 text-[10px] font-semibold text-slate-700">
                    {payout.id}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-[10px] text-slate-500">
                    {payout.date}
                  </td>
                  <td className="px-3 py-3 text-[10px] text-slate-500">
                    {payout.method}
                  </td>
                  <td className="px-3 py-3 text-[10px] font-semibold text-slate-700">
                    {payout.amount}
                  </td>
                  <td className="py-3 pl-3">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                      {payout.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Payouts;
