import { FiArrowUpRight, FiInstagram, FiUsers } from "react-icons/fi";

const influencers = [
  {
    name: "Maya Chen",
    handle: "@mayacreates",
    initials: "MC",
    color: "from-violet-300 to-fuchsia-400",
    category: "Lifestyle · Fashion",
    followers: "128K",
    engagement: "4.8%",
  },
  {
    name: "Jordan Lee",
    handle: "@jordanlee",
    initials: "JL",
    color: "from-orange-200 to-rose-400",
    category: "Business · Coaching",
    followers: "84K",
    engagement: "6.2%",
  },
  {
    name: "Amara Okafor",
    handle: "@amara.okafor",
    initials: "AO",
    color: "from-sky-200 to-blue-500",
    category: "Art · Design",
    followers: "212K",
    engagement: "5.1%",
  },
  {
    name: "Noah Williams",
    handle: "@noahwill",
    initials: "NW",
    color: "from-emerald-200 to-teal-500",
    category: "Photography · Travel",
    followers: "67K",
    engagement: "3.9%",
  },
];

function Influencers() {
  return (
    <div className="mx-auto max-w-[1530px] px-3 pb-5 pt-6 sm:px-5 sm:pt-[30px] lg:px-[38px]">
      <section className="mb-5">
        <div className="mb-2 text-[9px] font-bold tracking-[1.1px] text-slate-400">
          YOUR CREATOR NETWORK
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-[#18213e]">
          Influencers
        </h1>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Discover and manage the creators you work with.
        </p>
      </section>

      <section
        aria-label="Influencer directory"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {influencers.map((influencer) => (
          <article
            className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02]"
            key={influencer.handle}
          >
            <div className="flex items-start justify-between">
              <div
                className={`grid size-12 place-items-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${influencer.color}`}
              >
                {influencer.initials}
              </div>
              <button
                aria-label={`Open ${influencer.name}'s profile`}
                className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-violet-700"
              >
                <FiArrowUpRight aria-hidden="true" size={17} />
              </button>
            </div>
            <h2 className="mt-4 text-sm font-semibold text-slate-800">
              {influencer.name}
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {influencer.handle}
            </p>
            <p className="mt-3 rounded-md bg-slate-50 px-2 py-1.5 text-[9px] text-slate-500">
              {influencer.category}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <div>
                <span className="flex items-center gap-1 text-[8px] text-slate-400">
                  <FiUsers aria-hidden="true" size={12} /> Followers
                </span>
                <strong className="mt-1 block text-[11px] text-slate-700">
                  {influencer.followers}
                </strong>
              </div>
              <div className="text-right">
                <span className="flex items-center justify-end gap-1 text-[8px] text-slate-400">
                  <FiInstagram aria-hidden="true" size={12} /> Engagement
                </span>
                <strong className="mt-1 block text-[11px] text-slate-700">
                  {influencer.engagement}
                </strong>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Influencers;
