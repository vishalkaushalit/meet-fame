import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowUpRight,
  FiBell,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiGrid,
  FiHelpCircle,
  FiMessageCircle,
  FiMoreHorizontal,
  FiPlus,
  FiSearch,
  FiSettings,
  FiStar,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { bookings } from "./data/bookings";
import AppRoutes from "./routes/routes";

const navigation = [
  { label: "Overview", icon: "grid", path: "/overview" },
  { label: "Bookings", icon: "calendar", badge: "8", path: "/bookings" },
  { label: "Influencers", icon: "users", path: "/influencers" },
  { label: "Messages", icon: "message", badge: "3", path: "/messages" },
];

const routePages = [
  ...navigation,
  { label: "Analytics", icon: "chart", path: "/analytics" },
  { label: "Payouts", icon: "wallet", path: "/payouts" },
  { label: "Reviews", icon: "star", path: "/reviews" },
  { label: "Settings", icon: "settings", path: "/settings" },
  { label: "Help & support", icon: "help", path: "/help-support" },
];

const chartSets = {
  "7 days": {
    values: "0,130 70,105 140,117 210,69 280,89 350,48 420,66 490,24",
    amount: "$8,420",
    change: "+12.8%",
    point: "48",
  },
  "30 days": {
    values: "0,126 70,138 140,87 210,103 280,59 350,73 420,33 490,24",
    amount: "$32,680",
    change: "+18.4%",
    point: "73",
  },
  "90 days": {
    values: "0,140 70,116 140,123 210,77 280,95 350,50 420,62 490,18",
    amount: "$91,250",
    change: "+24.6%",
    point: "50",
  },
};

const icons = {
  grid: FiGrid,
  calendar: FiCalendar,
  users: FiUsers,
  message: FiMessageCircle,
  chart: FiTrendingUp,
  wallet: FiCreditCard,
  star: FiStar,
  settings: FiSettings,
  help: FiHelpCircle,
  search: FiSearch,
  bell: FiBell,
  plus: FiPlus,
  arrow: FiArrowUpRight,
  clock: FiClock,
  more: FiMoreHorizontal,
  close: FiX,
};

function Icon({ name, size = 18, className = "" }) {
  const IconComponent = icons[name];
  return (
    <IconComponent
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      size={size}
    />
  );
}

function BrandMark() {
  return (
    <div className="mb-7 flex h-9 items-center gap-2 lg:mb-7">
      <span
        aria-hidden="true"
        className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 bg-clip-text text-4xl font-bold leading-none text-transparent"
      >
        ∞
      </span>
      <span className="hidden text-xl font-extrabold text-white lg:block">
        Meet
        <span className="bg-gradient-to-r from-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
          Fame
        </span>
      </span>
    </div>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [range, setRange] = useState("7 days");
  const [search, setSearch] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [notice, setNotice] = useState("");
  const routePage = routePages.find(
    (item) => item.path === location.pathname,
  )?.label;
  const activePage = routePage ?? "Overview";
  const chart = chartSets[range];
  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        `${booking.name} ${booking.handle} ${booking.service}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [search],
  );

  function submitBooking(event) {
    event.preventDefault();
    setShowBookingForm(false);
    setNotice("Your booking has been created.");
    window.setTimeout(() => setNotice(""), 3500);
  }

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  const navClass = (label) =>
    `group flex min-h-10 w-full items-center justify-center gap-3 rounded-lg px-0 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white lg:justify-start lg:px-3 ${activePage === label ? "bg-violet-500/20 text-white shadow-[inset_2px_0_#a78bfa] hover:bg-violet-500/20" : ""}`;
  const panelClass =
    "min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5";
  const sectionLabelClass =
    "mb-1 text-[8px] font-bold tracking-[1.1px] text-slate-400";
  const panelTitleClass =
    "flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-800";
  const iconButtonClass =
    "relative grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700";
  const fieldClass =
    "min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100";
  const primaryButtonClass =
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-3.5 text-[11px] font-semibold text-white shadow-md shadow-violet-600/20 transition hover:-translate-y-px hover:shadow-lg hover:shadow-violet-600/25";

  return (
    <div className="min-h-screen bg-slate-50 text-[#1b2340]">
      <aside className="fixed inset-y-0 left-0 z-10 flex w-14 flex-col items-center overflow-y-auto overscroll-contain bg-[#101a3a] px-1.5 py-4 text-white sm:w-[68px] sm:px-2 lg:w-[252px] lg:items-stretch lg:px-[17px] lg:py-[25px]">
        <BrandMark />
        <div className="mb-7 hidden items-center gap-2.5 rounded-xl border border-white/10 bg-white/[.06] p-2.5 lg:flex">
          <div className="grid size-[33px] shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-rose-500 text-sm font-bold">
            S
          </div>
          <div className="grid min-w-0 gap-0.5">
            <strong className="text-[11px] font-semibold">
              Studio account
            </strong>
            <span className="text-[10px] text-slate-400">Admin workspace</span>
          </div>
          <span className="ml-auto -translate-y-0.5 text-lg text-slate-400">
            ⌄
          </span>
        </div>

        <div className="mb-2 hidden px-2.5 text-[9px] font-bold tracking-[1.2px] text-slate-500 lg:block">
          WORKSPACE
        </div>
        <nav aria-label="Main navigation" className="grid w-full gap-1">
          {navigation.map((item) => (
            <Link
              className={navClass(item.label)}
              key={item.label}
              to={item.path}
              title={item.label}
            >
              <Icon
                name={item.icon}
                className={
                  activePage === item.label
                    ? "text-violet-300"
                    : "text-slate-400"
                }
              />
              <span className="hidden flex-1 text-left lg:block">
                {item.label}
              </span>
              {item.badge && (
                <span className="hidden rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-200 lg:block">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mb-2 mt-7 hidden px-2.5 text-[9px] font-bold tracking-[1.2px] text-slate-500 lg:block">
          MANAGE
        </div>
        <nav
          aria-label="Management navigation"
          className="mt-1 grid w-full gap-1"
        >
          {routePages.slice(4, 7).map((item) => (
            <Link
              className={navClass(item.label)}
              key={item.label}
              to={item.path}
              title={item.label}
            >
              <Icon
                name={item.icon}
                className={
                  activePage === item.label
                    ? "text-violet-300"
                    : "text-slate-400"
                }
              />
              <span className="hidden flex-1 text-left lg:block">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="grid w-full gap-1">
          {routePages.slice(7).map((item) => (
            <Link
              className={navClass(item.label)}
              key={item.label}
              to={item.path}
              title={item.label}
            >
              <Icon
                name={item.icon}
                className={
                  activePage === item.label
                    ? "text-violet-300"
                    : "text-slate-400"
                }
              />
              <span className="hidden flex-1 text-left lg:block">
                {item.label}
              </span>
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-center border-t border-white/10 pt-3 lg:justify-start lg:gap-2.5 lg:px-1">
            <div className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-white/80 bg-gradient-to-br from-orange-200 to-fuchsia-400 text-[10px] font-bold text-white">
              SK
            </div>
            <div className="hidden min-w-0 flex-1 gap-0.5 lg:grid">
              <strong className="text-[11px] font-semibold">Samira Khan</strong>
              <span className="text-[10px] text-slate-400">
                Creator account
              </span>
            </div>
            <button
              className={`${iconButtonClass} hidden text-slate-400 hover:bg-white/10 hover:text-white lg:grid`}
              aria-label="Profile options"
            >
              <Icon name="more" />
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-14 min-h-screen sm:ml-[68px] lg:ml-[252px]">
        <header className="sticky top-0 z-[5] flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur sm:h-[68px] sm:px-5 lg:px-[38px]">
          <div className="flex items-center gap-2 text-[10px] sm:gap-2.5 sm:text-[11px]">
            <span className="text-slate-400">Workspace</span>
            <span className="text-slate-300">/</span>
            <strong className="font-semibold text-slate-700">
              {activePage}
            </strong>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-4">
            <label className="flex size-8 items-center justify-center gap-2 rounded-lg text-slate-400 sm:h-9 sm:w-[210px] sm:justify-start sm:border sm:border-slate-200 sm:bg-slate-50 sm:px-2.5 lg:w-[235px]">
              <Icon name="search" size={17} />
              <input
                aria-label="Search dashboard"
                className="hidden min-w-0 flex-1 bg-transparent text-[10px] text-slate-700 outline-none placeholder:text-slate-400 sm:block"
                placeholder="Search anything..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd className="hidden rounded border border-slate-200 bg-white px-1 py-0.5 text-[9px] text-slate-400 sm:block">
                ⌘ K
              </kbd>
            </label>
            <button
              className={iconButtonClass}
              aria-label="Notifications"
              onClick={() => showNotice("You’re all caught up!")}
            >
              <Icon name="bell" />
              <i className="absolute right-1.5 top-1.5 size-1.5 rounded-full border border-white bg-rose-400" />
            </button>
            <div className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-orange-200 to-fuchsia-400 text-[9px] font-bold text-white sm:size-[30px]">
              SK
            </div>
          </div>
        </header>

        <AppRoutes
          overview={
            <div className="mx-auto max-w-[1530px] px-3 pb-5 pt-6 sm:px-5 sm:pt-[30px] lg:px-[38px]">
              <section className="mb-5 flex flex-col items-start justify-between gap-3 sm:mb-[22px] sm:flex-row sm:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[9px] font-bold tracking-[1.1px] text-slate-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 ring-[3px] ring-emerald-50" />{" "}
                    THURSDAY, OCTOBER 15, 2026
                  </div>
                  <h1 className="text-[22px] font-bold tracking-[-1px] text-[#18213e] sm:text-[26px] lg:text-[29px]">
                    Good afternoon, Samira{" "}
                    <span className="pl-0.5 text-base text-amber-400">✦</span>
                  </h1>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Here’s what’s happening with your creator business today.
                  </p>
                </div>
                <button
                  className={primaryButtonClass}
                  onClick={() => setShowBookingForm(true)}
                >
                  <Icon name="plus" size={17} /> Create booking
                </button>
              </section>

              <section
                aria-label="Business overview"
                className="mb-4 grid grid-cols-2 gap-2.5 xl:grid-cols-4"
              >
                <article className="relative min-h-[130px] overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/[.02] sm:min-h-[140px] sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium text-slate-500 sm:text-[10px]">
                      Total earnings
                    </span>
                    <span className="grid size-7 place-items-center rounded-lg bg-violet-50 text-violet-600">
                      <Icon name="wallet" size={17} />
                    </span>
                  </div>
                  <div className="mt-3 text-[16px] font-bold leading-none tracking-tight text-[#19213e] sm:text-[25px]">
                    $12,840
                    <span className="text-[14px] font-medium text-slate-400">
                      .50
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600">
                      <Icon name="arrow" size={13} /> 12.8%
                    </span>
                    vs. last month
                  </div>
                  <div className="absolute bottom-0 right-4 flex h-8 items-end gap-1 opacity-80">
                    {[
                      "h-3",
                      "h-4",
                      "h-3.5",
                      "h-5",
                      "h-4",
                      "h-6",
                      "h-4",
                      "h-7",
                      "h-5",
                      "h-8",
                      "h-6",
                      "h-8",
                    ].map((height, index) => (
                      <i
                        className={`w-1 rounded-t bg-gradient-to-t from-violet-200 to-violet-400 ${height}`}
                        key={index}
                      />
                    ))}
                  </div>
                </article>
                <article className="min-h-[130px] rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/[.02] sm:min-h-[140px] sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium text-slate-500 sm:text-[10px]">
                      Upcoming bookings
                    </span>
                    <span className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-500">
                      <Icon name="calendar" size={17} />
                    </span>
                  </div>
                  <div className="mt-3 text-[16px] font-bold leading-none tracking-tight text-[#19213e] sm:text-[25px]">
                    08
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className="size-1.5 rounded-full bg-orange-400" />3
                    new this week
                  </div>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-violet-50">
                    <span className="block h-full w-2/3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[8px] text-slate-400">
                    <span>Weekly goal</span>
                    <strong className="font-semibold text-slate-500">
                      8 of 12
                    </strong>
                  </div>
                </article>
                <article className="relative min-h-[130px] overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/[.02] sm:min-h-[140px] sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium text-slate-500 sm:text-[10px]">
                      Profile visitors
                    </span>
                    <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon name="users" size={17} />
                    </span>
                  </div>
                  <div className="mt-3 text-[16px] font-bold leading-none tracking-tight text-[#19213e] sm:text-[25px]">
                    2,486
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600">
                      <Icon name="arrow" size={13} /> 8.2%
                    </span>
                    vs. last month
                  </div>
                  <svg
                    className="absolute bottom-3 right-3 w-20 sm:right-4 sm:w-[84px]"
                    viewBox="0 0 130 32"
                    role="img"
                    aria-label="Visitor trend"
                  >
                    <path
                      d="M1 27 15 22 27 24 40 14 53 19 66 11 79 15 92 7 105 10 118 3 129 5"
                      fill="none"
                      stroke="#71a2ed"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </article>
                <article className="min-h-[130px] rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/[.02] sm:min-h-[140px] sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium text-slate-500 sm:text-[10px]">
                      Average rating
                    </span>
                    <span className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-500">
                      <Icon name="star" size={17} />
                    </span>
                  </div>
                  <div className="mt-3 text-[16px] font-bold leading-none tracking-tight text-[#19213e] sm:text-[25px]">
                    4.9
                    <span className="text-[14px] font-medium text-slate-400">
                      /5
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className="tracking-wider text-amber-400">★★★★★</span>
                    from 128 reviews
                  </div>
                  <div className="mt-3 h-[3px] rounded-full bg-amber-50">
                    <span className="block h-full w-[94%] rounded-full bg-gradient-to-r from-amber-400 to-amber-200" />
                  </div>
                </article>
              </section>

              <section className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1.68fr)_minmax(280px,.92fr)]">
                <article className={panelClass}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className={sectionLabelClass}>YOUR PERFORMANCE</div>
                      <h2 className={panelTitleClass}>Earnings over time</h2>
                    </div>
                    <div
                      aria-label="Earnings chart range"
                      className="flex gap-0.5 rounded-lg border border-slate-100 bg-slate-50 p-0.5"
                      role="group"
                    >
                      {Object.keys(chartSets).map((option) => (
                        <button
                          className={`rounded-md px-1.5 py-1 text-[8px] transition sm:px-2 sm:text-[9px] ${range === option ? "bg-white text-violet-700 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
                          key={option}
                          onClick={() => setRange(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <strong className="text-xl font-bold tracking-tight text-slate-800">
                      {chart.amount}
                    </strong>
                    <span className="rounded-md bg-emerald-50 px-1.5 py-1 text-[9px] font-bold text-emerald-600">
                      ↗ {chart.change}
                    </span>
                    <span className="hidden text-[9px] text-slate-400 sm:inline">
                      compared to previous period
                    </span>
                  </div>
                  <div className="relative ml-8 mt-3 h-32 sm:h-[139px]">
                    <div className="absolute -left-8 inset-y-0 flex flex-col justify-between pb-px text-[8px] text-slate-400">
                      <span>$10k</span>
                      <span>$7.5k</span>
                      <span>$5k</span>
                      <span>$2.5k</span>
                      <span>$0</span>
                    </div>
                    <svg
                      className="size-full overflow-visible"
                      viewBox="0 0 500 160"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label={`Earnings chart for the last ${range}`}
                    >
                      <defs>
                        <linearGradient
                          id="chartFill"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#7947f7"
                            stopOpacity=".18"
                          />
                          <stop
                            offset="100%"
                            stopColor="#7947f7"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 20H500M0 55H500M0 90H500M0 125H500M0 159H500"
                        fill="none"
                        stroke="#f0f2f6"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                      />
                      <polygon
                        points={`0,160 ${chart.values} 490,160`}
                        fill="url(#chartFill)"
                      />
                      <polyline
                        points={chart.values}
                        fill="none"
                        stroke="#8155ed"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <circle
                        cx="350"
                        cy={chart.point}
                        r="4"
                        fill="white"
                        stroke="#8155ed"
                        strokeWidth="2.5"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                  <div className="flex justify-between pl-8 pt-2 text-[7px] text-slate-400 sm:text-[8px]">
                    <span>Oct 09</span>
                    <span>Oct 10</span>
                    <span>Oct 11</span>
                    <span>Oct 12</span>
                    <span>Oct 13</span>
                    <span>Oct 14</span>
                    <span>Oct 15</span>
                  </div>
                </article>

                <article className={panelClass}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={sectionLabelClass}>AT A GLANCE</div>
                      <h2 className={panelTitleClass}>Booking overview</h2>
                    </div>
                    <button
                      className={iconButtonClass}
                      aria-label="Booking overview options"
                    >
                      <Icon name="more" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-4 py-6 sm:gap-6">
                    <div className="grid size-28 shrink-0 place-items-center rounded-full bg-[conic-gradient(#8054ed_0%_65%,#f1a184_65%_85%,#e9edf5_85%_100%)] sm:size-[126px]">
                      <div className="flex size-[81px] flex-col items-center justify-center rounded-full bg-white sm:size-[91px]">
                        <strong className="text-[23px] font-bold leading-tight text-slate-800">
                          24
                        </strong>
                        <span className="text-[9px] text-slate-400">Total</span>
                      </div>
                    </div>
                    <div className="grid min-w-[105px] gap-3">
                      {[
                        ["bg-violet-500", "Confirmed", "16"],
                        ["bg-orange-300", "Pending", "5"],
                        ["bg-slate-200", "Completed", "3"],
                      ].map(([color, label, count]) => (
                        <div
                          className="grid grid-cols-[8px_1fr_auto] items-center gap-2 text-[9px] text-slate-500"
                          key={label}
                        >
                          <span className={`size-2 rounded-full ${color}`} />
                          <span>{label}</span>
                          <strong className="text-[10px] font-semibold text-slate-700">
                            {count}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex items-center gap-2.5 pt-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600">
                      <Icon name="clock" size={17} />
                    </div>
                    <div className="grid min-w-0 gap-0.5">
                      <span className="text-[7px] font-bold tracking-wider text-slate-400">
                        UP NEXT
                      </span>
                      <strong className="truncate text-[9px] font-semibold text-slate-700">
                        Brand strategy call
                      </strong>
                      <small className="text-[8px] text-slate-400">
                        with Maya Chen · 2:30 PM
                      </small>
                    </div>
                    <button
                      className="ml-auto grid size-7 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                      aria-label="View upcoming booking"
                      onClick={() => navigate("/bookings")}
                    >
                      <Icon name="arrow" size={16} />
                    </button>
                  </div>
                </article>
              </section>

              <section className="grid gap-4 xl:grid-cols-[minmax(0,1.68fr)_minmax(280px,.92fr)]">
                <article className={`${panelClass} pb-2`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className={sectionLabelClass}>
                        DON’T MISS A MOMENT
                      </div>
                      <h2 className={panelTitleClass}>
                        Upcoming bookings{" "}
                        <span className="rounded-md bg-violet-50 px-1.5 py-1 text-[9px] font-semibold text-violet-700">
                          08
                        </span>
                      </h2>
                    </div>
                    <button
                      className="shrink-0 text-[9px] font-semibold text-violet-700 hover:text-violet-900"
                      onClick={() => navigate("/bookings")}
                    >
                      View all <span className="pl-1">→</span>
                    </button>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left">
                      <thead>
                        <tr className="border-y border-slate-100 text-[7px] font-bold tracking-wider text-slate-400">
                          <th className="py-2.5 pr-2">CLIENT</th>
                          <th className="px-2 py-2.5">SESSION</th>
                          <th className="px-2 py-2.5">DATE & TIME</th>
                          <th className="px-2 py-2.5">AMOUNT</th>
                          <th className="px-2 py-2.5">STATUS</th>
                          <th className="py-2.5 pl-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((booking) => (
                          <tr
                            className="border-b border-slate-100 last:border-0"
                            key={booking.name}
                          >
                            <td className="py-2.5 pr-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`grid size-7 shrink-0 place-items-center rounded-full text-[8px] font-bold ${booking.color}`}
                                >
                                  {booking.initials}
                                </div>
                                <div className="grid gap-0.5">
                                  <strong className="text-[9px] font-semibold text-slate-700">
                                    {booking.name}
                                  </strong>
                                  <span className="text-[8px] text-slate-400">
                                    {booking.handle}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-2.5 text-[9px] text-slate-500">
                              {booking.service}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2.5 text-[9px] text-slate-600">
                              {booking.date}
                            </td>
                            <td className="px-2 py-2.5 text-[9px] font-semibold text-slate-700">
                              {booking.amount}
                            </td>
                            <td className="px-2 py-2.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-semibold ${booking.status === "Confirmed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                              >
                                <i
                                  className={`size-1.5 rounded-full ${booking.status === "Confirmed" ? "bg-emerald-500" : "bg-amber-500"}`}
                                />
                                {booking.status}
                              </span>
                            </td>
                            <td className="py-2.5 pl-2">
                              <button
                                className={iconButtonClass}
                                aria-label={`Options for ${booking.name}`}
                              >
                                <Icon name="more" size={17} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredBookings.length === 0 && (
                          <tr>
                            <td
                              className="p-6 text-center text-[10px] text-slate-400"
                              colSpan="6"
                            >
                              No bookings match “{search}”.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
                <article className={panelClass}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={sectionLabelClass}>THE LATEST</div>
                      <h2 className={panelTitleClass}>Recent activity</h2>
                    </div>
                    <button
                      className={iconButtonClass}
                      aria-label="Activity options"
                    >
                      <Icon name="more" />
                    </button>
                  </div>
                  <div className="mt-4 grid">
                    {[
                      {
                        icon: "calendar",
                        color: "bg-violet-50 text-violet-600",
                        line: (
                          <>
                            <strong className="font-semibold text-slate-700">
                              Maya Chen
                            </strong>{" "}
                            booked a session
                          </>
                        ),
                        info: "Brand strategy call · 12 min ago",
                      },
                      {
                        icon: "star",
                        color: "bg-amber-50 text-amber-600",
                        line: (
                          <>
                            New{" "}
                            <strong className="font-semibold text-slate-700">
                              5-star review
                            </strong>{" "}
                            received
                          </>
                        ),
                        info: "“Such a valuable conversation!” · 1 hr ago",
                      },
                      {
                        icon: "wallet",
                        color: "bg-emerald-50 text-emerald-600",
                        line: (
                          <>
                            <strong className="font-semibold text-slate-700">
                              $320.00
                            </strong>{" "}
                            payment received
                          </>
                        ),
                        info: "Creative direction · 3 hrs ago",
                      },
                    ].map((item, index) => (
                      <div
                        className={`flex items-start gap-2.5 ${index ? "border-t border-slate-100 pt-3" : ""} pb-3`}
                        key={item.info}
                      >
                        <div
                          className={`grid size-7 shrink-0 place-items-center rounded-lg ${item.color}`}
                        >
                          <Icon name={item.icon} size={15} />
                        </div>
                        <div>
                          <p className="mt-0.5 text-[9px] text-slate-500">
                            {item.line}
                          </p>
                          <span className="mt-1 block text-[8px] text-slate-400">
                            {item.info}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full border-t border-slate-100 pt-2.5 text-left text-[9px] font-semibold text-violet-700 hover:text-violet-900"
                    onClick={() =>
                      showNotice("You’re viewing your latest activity.")
                    }
                  >
                    View activity <span className="pl-1">→</span>
                  </button>
                </article>
              </section>
              <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 px-0.5 pt-5 text-[8px] text-slate-400">
                <span>© 2026 MeetFame</span>
                <span className="sm:ml-auto">
                  Made for creators, with <b className="text-rose-400">♥</b>
                </span>
                <a
                  className="text-slate-500 hover:text-violet-700"
                  href="#support"
                  onClick={(event) => {
                    event.preventDefault();
                    showNotice("Help center is coming soon.");
                  }}
                >
                  Need help?
                </a>
              </footer>
            </div>
          }
          search={search}
          onCreateBooking={() => setShowBookingForm(true)}
        />
      </main>

      {notice && (
        <div
          className="fixed bottom-5 right-5 z-20 flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-700 shadow-xl shadow-slate-900/10"
          role="status"
        >
          {notice}
          <button
            className="text-slate-400 hover:text-slate-700"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
      {showBookingForm && (
        <div
          className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setShowBookingForm(false)}
        >
          <section
            className="my-auto w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className={sectionLabelClass}>NEW SESSION</div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-800">
                  Create a booking
                </h2>
              </div>
              <button
                className={iconButtonClass}
                aria-label="Close"
                onClick={() => setShowBookingForm(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <form className="grid gap-3.5" onSubmit={submitBooking}>
              <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
                Client name
                <input
                  className={fieldClass}
                  required
                  placeholder="e.g. Alex Morgan"
                />
              </label>
              <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
                Session type
                <select className={fieldClass} defaultValue="" required>
                  <option value="" disabled>
                    Select a service
                  </option>
                  <option>Brand strategy call</option>
                  <option>1:1 coaching session</option>
                  <option>Creative direction</option>
                  <option>Portfolio review</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
                  Date
                  <input className={fieldClass} required type="date" />
                </label>
                <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
                  Time
                  <input className={fieldClass} required type="time" />
                </label>
              </div>
              <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
                Price
                <input
                  className={fieldClass}
                  required
                  type="number"
                  min="1"
                  placeholder="$ 0.00"
                />
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  className="min-h-9 rounded-lg border border-slate-200 px-3.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                >
                  Cancel
                </button>
                <button className={primaryButtonClass} type="submit">
                  <Icon name="plus" size={16} /> Create booking
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
