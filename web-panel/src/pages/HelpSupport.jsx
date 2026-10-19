import { FiMail, FiMessageCircle } from "react-icons/fi";

const faqs = [
  {
    question: "How do I create a booking?",
    answer:
      "Choose Create booking from your dashboard or Bookings page, fill in the client and session details, then submit the form.",
  },
  {
    question: "When will I receive my payout?",
    answer:
      "Payout timing depends on your payment provider and account setup. Visit Payouts to review the sample schedule shown in this demo.",
  },
  {
    question: "Where can I update my profile?",
    answer:
      "Open Settings from the sidebar to edit your profile details and email notification preferences.",
  },
  {
    question: "How do I contact the MeetFame team?",
    answer:
      "Send us an email using the contact link on this page and include a description of the issue you are experiencing.",
  },
];

const panelClass =
  "rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5";

function HelpSupport() {
  return (
    <div className="mx-auto max-w-[1000px] px-3 pb-5 pt-6 sm:px-5 sm:pt-[30px] lg:px-[38px]">
      <section className="mb-5">
        <div className="mb-2 text-[9px] font-bold tracking-[1.1px] text-slate-400">
          WE’RE HERE TO HELP
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-[#18213e]">
          Help &amp; support
        </h1>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Find answers to common questions or get in touch with our team.
        </p>
      </section>

      <section className="mb-4 grid gap-3 sm:grid-cols-2">
        <article className={panelClass}>
          <span className="grid size-9 place-items-center rounded-lg bg-violet-50 text-violet-600">
            <FiMessageCircle aria-hidden="true" size={17} />
          </span>
          <h2 className="mt-3 text-[12px] font-semibold text-slate-800">
            Frequently asked questions
          </h2>
          <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
            Browse answers about bookings, payouts, and account settings below.
          </p>
        </article>
        <article className={panelClass}>
          <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
            <FiMail aria-hidden="true" size={17} />
          </span>
          <h2 className="mt-3 text-[12px] font-semibold text-slate-800">
            Contact support
          </h2>
          <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
            Need more help? Email our support team and we’ll be happy to assist.
          </p>
          <a
            className="mt-3 inline-flex min-h-8 items-center rounded-lg bg-violet-50 px-3 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100"
            href="mailto:support@meetfame.com?subject=MeetFame%20support"
          >
            Email support
          </a>
        </article>
      </section>

      <section aria-label="Frequently asked questions" className={panelClass}>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Common questions
        </h2>
        <div className="divide-y divide-slate-100">
          {faqs.map((faq) => (
            <details className="group py-3" key={faq.question}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[10px] font-semibold text-slate-700 marker:hidden">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="text-base font-normal text-violet-600 transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 pr-6 text-[10px] leading-relaxed text-slate-500">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HelpSupport;
