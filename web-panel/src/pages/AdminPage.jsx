import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowUpRight,
  FiBell,
  FiCalendar,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiEdit2,
  FiGrid,
  FiHelpCircle,
  FiLogOut,
  FiMessageCircle,
  FiMoreHorizontal,
  FiMoon,
  FiPlus,
  FiSearch,
  FiSettings,
  FiStar,
  FiSun,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import "./AdminPage.css";
import { getBookingList } from "../data/bookingUtils";
import { AdminSectionRoutes } from "../routes/routes";
import { clearAuthToken } from "../api/axiosInstance";
import { authApi, bookingsApi, statsApi } from "../api/apiServices";

const navigation = [
  { label: "Overview", icon: "grid", path: "/admin" },
  { label: "Bookings", icon: "calendar", path: "/admin/bookings" },
  { label: "Approvals", icon: "users", path: "/admin/influencers" },
  { label: "Availability", icon: "users", path: "/admin/availability" },
  { label: "Announcements", icon: "users", path: "/admin/announcements" },
  { label: "Messages", icon: "message", badge: "3", path: "/admin/messages" },
];

const routePages = [
  ...navigation,
  { label: "Analytics", icon: "chart", path: "/admin/analytics" },
  { label: "Payouts", icon: "wallet", path: "/admin/payouts" },
  { label: "Reviews", icon: "star", path: "/admin/reviews" },
  { label: "Settings", icon: "settings", path: "/admin/settings" },
  { label: "Help & support", icon: "help", path: "/admin/help-support" },
];

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
  moon: FiMoon,
  sun: FiSun,
};

const Icon = ({ name, size = 18, className = "" }) => {
  const IconComponent = icons[name];
  return (
    <IconComponent
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      size={size}
    />
  );
};

const BrandMark = () => {
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
};

const readTheme = () => {
  try {
    return window.localStorage.getItem("meetfame-theme") === "dark"
      ? "dark"
      : "light";
  } catch (error) {
    console.error("Unable to load the saved theme.", error);
    return "light";
  }
};

const getProfileFromResponse = (response) => {
  const user =
    response?.user ?? response?.data?.user ?? response?.data ?? response;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const name = user?.name ?? user?.fullName ?? (fullName || user?.email);
  const role = user?.role
    ?.toString()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const initials =
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") ?? "";

  return {
    name: name || "Admin",
    role: role || "Super Admin",
    initials: initials || "A",
  };
};

const getBookingDateKey = (booking) => {
  const value =
    booking?.scheduledAt ??
    booking?.scheduledDate ??
    booking?.bookingDate ??
    booking?.date ??
    booking?.startTime;

  if (typeof value !== "string" && !(value instanceof Date)) {
    return null;
  }

  const dateString =
    typeof value === "string" ? value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] : null;
  const date = dateString
    ? new Date(`${dateString}T00:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AdminPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(readTheme);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(false);
  const [overviewStats, setOverviewStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [bookingActivity, setBookingActivity] = useState([]);
  const [bookingActivityLoading, setBookingActivityLoading] = useState(true);
  const [bookingActivityError, setBookingActivityError] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingFormError, setBookingFormError] = useState("");
  const [activityRange, setActivityRange] = useState(7);
  const [search, setSearch] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [notice, setNotice] = useState("");
  const routePage = routePages.find(
    (item) => item.path === location.pathname,
  )?.label;
  const activePage = routePage ?? "Overview";
  const filteredBookings = useMemo(
    () =>
      bookingActivity.filter((booking) =>
        `${booking.name} ${booking.handle} ${booking.service} ${booking.status}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [bookingActivity, search],
  );
  const activityRows = useMemo(() => {
    const today = new Date();
    const rows = Array.from({ length: activityRange }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - activityRange + index + 1);
      return {
        date,
        dateKey: getDateKey(date),
        count: 0,
      };
    });
    const rowByDate = new Map(rows.map((row) => [row.dateKey, row]));

    bookingActivity.forEach((booking) => {
      const row = rowByDate.get(getBookingDateKey(booking));
      if (row) {
        row.count += 1;
      }
    });

    return rows;
  }, [activityRange, bookingActivity]);
  const activityTotal = activityRows.reduce(
    (total, row) => total + row.count,
    0,
  );
  const activityMaximum = Math.max(...activityRows.map((row) => row.count), 1);
  const refreshOverviewStats = async () => {
    setStatsLoading(true);
    setStatsError("");

    try {
      const stats = await statsApi.getOverview();
      setOverviewStats(stats);
      setStatsError("");
    } catch (error) {
      console.error("Unable to load admin overview stats.", error);
      setStatsError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load overview stats.",
      );
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    try {
      window.localStorage.setItem("meetfame-theme", theme);
    } catch (error) {
      console.error("Unable to save the selected theme.", error);
    }
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    authApi
      .getMe()
      .then((response) => {
        if (isMounted) {
          setProfile(getProfileFromResponse(response));
          setProfileError(false);
        }
      })
      .catch((error) => {
        console.error("Unable to load the admin profile.", error);
        if (isMounted) {
          setProfileError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    bookingsApi
      .getAll()
      .then((response) => {
        const list = getBookingList(response);
        if (isMounted) {
          setBookingActivity(list);
          setBookingActivityError("");
        }
      })
      .catch((error) => {
        console.error("Unable to load booking activity.", error);
        if (isMounted) {
          setBookingActivityError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load booking activity.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setBookingActivityLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    statsApi
      .getOverview()
      .then((stats) => {
        if (isMounted) {
          setOverviewStats(stats);
          setStatsError("");
        }
      })
      .catch((error) => {
        console.error("Unable to load admin overview stats.", error);
        if (isMounted) {
          setStatsError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load overview stats.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setStatsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const submitBooking = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const date = formData.get("date");
    const time = formData.get("time");

    setBookingFormError("");
    setBookingSubmitting(true);

    try {
      await bookingsApi.create({
        clientName: formData.get("clientName"),
        service: formData.get("service"),
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        amount: Number(formData.get("amount")),
      });

      setShowBookingForm(false);
      setNotice("Your booking has been created.");
      window.setTimeout(() => setNotice(""), 3500);

      try {
        const bookingsResponse = await bookingsApi.getAll();
        setBookingActivity(getBookingList(bookingsResponse));
        setBookingActivityError("");
      } catch (error) {
        console.error(
          "Booking was created, but the list could not refresh.",
          error,
        );
        setBookingActivityError(
          error.response?.data?.message ||
            error.message ||
            "Booking created, but the list could not be refreshed.",
        );
      }
    } catch (error) {
      console.error("Unable to create booking.", error);
      setBookingFormError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Unable to create booking. Please try again.",
      );
    } finally {
      setBookingSubmitting(false);
    }
  };

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const signOut = () => {
    clearAuthToken();
    navigate("/login", { replace: true });
  };

  const navClass = (label) => {
    const isActive = activePage === label;
    const darkMode = theme === "dark";
    const colorClasses = darkMode
      ? isActive
        ? "bg-violet-500/20 text-white shadow-[inset_2px_0_#a78bfa] hover:bg-violet-500/20"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
      : isActive
        ? "bg-violet-50 text-violet-700 shadow-[inset_2px_0_#7c3aed] hover:bg-violet-50"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
    return `group flex min-h-10 w-full items-center justify-center gap-3 rounded-lg px-0 text-xs transition lg:justify-start lg:px-3 ${colorClasses}`;
  };
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
    <div
      className="app-shell min-h-screen bg-slate-50 text-[#1b2340]"
      data-theme={theme}
    >
      <aside
        className={`fixed inset-y-0 left-0 z-10 flex w-14 flex-col items-center overflow-y-auto overscroll-contain border-r border-slate-200 bg-white px-1.5 py-4 text-slate-800 sm:w-[68px] sm:px-2 lg:w-[252px] lg:items-stretch lg:px-[17px] lg:py-[25px] ${theme === "dark" ? "border-slate-800 bg-[#080e1b] text-white" : ""}`}
      >
        <BrandMark />
        <div
          className={`mb-7 hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 lg:flex ${theme === "dark" ? "border-white/10" : ""}`}
        >
          <div className="grid size-[33px] shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-rose-500 text-sm font-bold">
            S
          </div>
          <div className="grid min-w-0 gap-0.5">
            <strong className="text-[11px] font-semibold">
              Studio account
            </strong>
            <span className="text-[10px] text-slate-500">Admin workspace</span>
          </div>
          <span className="ml-auto -translate-y-0.5 text-lg text-slate-500">
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
                    ? theme === "dark"
                      ? "text-violet-300"
                      : "text-violet-600"
                    : theme === "dark"
                      ? "text-slate-400"
                      : "text-slate-500"
                }
              />
              <span className="hidden flex-1 text-left lg:block">
                {item.label}
              </span>
              {item.badge && (
                <span className="hidden rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 lg:block">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
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
            <button
              className={iconButtonClass}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-pressed={theme === "dark"}
              onClick={() =>
                setTheme((currentTheme) =>
                  currentTheme === "dark" ? "light" : "dark",
                )
              }
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              type="button"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
            <details className="group relative">
              <summary className="flex min-h-[45px] cursor-pointer list-none items-center gap-3 rounded-xl border border-slate-200 px-2.5 py-2 text-left transition hover:border-violet-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 [&::-webkit-details-marker]:hidden">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-violet-400/50 bg-violet-500/15 text-xs font-bold text-violet-700">
                  {profile?.initials ?? "…"}
                </span>
                <span className="hidden min-w-0 sm:grid">
                  <strong className="truncate text-[11px] font-semibold text-slate-800">
                    {profileError
                      ? "Profile unavailable"
                      : profile
                        ? `${profile.name} (${profile.role})`
                        : "Loading profile…"}
                  </strong>
                  <span className="text-[10px] text-slate-500">
                    {profile?.role ?? "Admin"}
                  </span>
                </span>
                <FiChevronDown
                  aria-hidden="true"
                  className="hidden size-4 shrink-0 text-slate-500 transition group-open:rotate-180 sm:block"
                />
              </summary>
              <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/15">
                <Link
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                  to="/admin/settings"
                >
                  <FiUser
                    aria-hidden="true"
                    className="size-[18px] text-slate-500"
                  />
                  Profile
                </Link>
                <Link
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                  to="/admin/settings"
                >
                  <FiEdit2
                    aria-hidden="true"
                    className="size-[18px] text-slate-500"
                  />
                  Edit profile
                </Link>
                <div className="my-1 border-t border-slate-200" />
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-rose-500 transition hover:bg-rose-50"
                  onClick={signOut}
                  type="button"
                >
                  <FiLogOut aria-hidden="true" className="size-[18px]" />
                  Sign out
                </button>
              </div>
            </details>
          </div>
        </header>

        <AdminSectionRoutes
          overview={
            <div className="mx-auto max-w-[1530px] px-3 pb-5 pt-6 sm:px-5 sm:pt-[30px] lg:px-[38px]">
              <section className="mb-5 flex flex-col items-start justify-between gap-3 sm:mb-[22px] sm:flex-row sm:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[9px] font-bold tracking-[1.1px] text-slate-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 ring-[3px] ring-emerald-50" />
                    MEETFAME ADMIN
                  </div>
                  <h1 className="text-[22px] font-bold tracking-[-1px] text-[#18213e] sm:text-[26px] lg:text-[29px]">
                    Platform overview
                  </h1>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    A clear view of your platform, all in one place.
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  disabled={statsLoading}
                  onClick={refreshOverviewStats}
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                  {statsLoading ? "Refreshing…" : "Refresh data"}
                </button>
              </section>

              <section
                aria-label="Business overview"
                className="mb-4 grid grid-cols-2 gap-2.5 xl:grid-cols-4"
              >
                <article className="relative min-h-[130px] overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/[.02] sm:min-h-[140px] sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium text-slate-500 sm:text-[10px]">
                      Total creators
                    </span>
                    <span className="grid size-7 place-items-center rounded-lg bg-violet-50 text-violet-600">
                      <Icon name="star" size={17} />
                    </span>
                  </div>
                  <div className="mt-3 text-[16px] font-bold leading-none tracking-tight text-[#19213e] sm:text-[25px]">
                    {statsLoading
                      ? "—"
                      : (overviewStats?.totalInfluencers ?? "—")}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600">
                      {statsLoading
                        ? "Loading stats…"
                        : `${overviewStats?.verifiedInfluencers ?? "—"} verified creators`}
                    </span>
                  </div>
                </article>

                <article className="min-h-[130px] rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/[.02] sm:min-h-[140px] sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium text-slate-500 sm:text-[10px]">
                      Total bookings
                    </span>
                    <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon name="calendar" size={17} />
                    </span>
                  </div>
                  <div className="mt-3 text-[16px] font-bold leading-none tracking-tight text-[#19213e] sm:text-[25px]">
                    {statsLoading ? "—" : (overviewStats?.totalBookings ?? "—")}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {statsLoading
                      ? " Loading stats…"
                      : ` ${overviewStats?.confirmedBookings ?? "—"} confirmed sessions`}
                  </div>
                </article>

                <article className="relative min-h-[130px] overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/[.02] sm:min-h-[140px] sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium text-slate-500 sm:text-[10px]">
                      Platform volume
                    </span>
                    <span className="grid size-7 place-items-center rounded-lg bg-green-50 text-green-600">
                      <Icon name="wallet" size={17} />
                    </span>
                  </div>
                  <div className="mt-3 text-[16px] font-bold leading-none tracking-tight text-[#19213e] sm:text-[25px]">
                    {statsLoading
                      ? "—"
                      : `$${(overviewStats?.totalVolume ?? 0).toLocaleString()}`}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600">
                      All-time booking value
                    </span>
                  </div>
                </article>

                <article className="min-h-[130px] rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/[.02] sm:min-h-[140px] sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium text-slate-500 sm:text-[10px]">
                      Total clients
                    </span>
                    <span className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                      <Icon name="users" size={17} />
                    </span>
                  </div>
                  <div className="mt-3 text-[16px] font-bold leading-none tracking-tight text-[#19213e] sm:text-[25px]">
                    {statsLoading ? "—" : (overviewStats?.totalUsers ?? "—")}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className="size-1.5 rounded-full bg-amber-400" />
                    {statsLoading
                      ? " Loading stats…"
                      : ` ${overviewStats?.pendingUsers ?? "—"} awaiting approval`}
                  </div>
                </article>
              </section>
              {statsError && (
                <p className="mb-4 text-xs text-rose-600" role="alert">
                  {statsError}
                </p>
              )}

              <section className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1.68fr)_minmax(280px,.92fr)]">
                <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[.02]">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className={sectionLabelClass}>BOOKING ACTIVITY</div>
                      <h2 className={panelTitleClass}>
                        Sessions scheduled over the last {activityRange} days
                      </h2>
                    </div>
                    <select
                      aria-label="Booking activity period"
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[9px] text-slate-600 outline-none"
                      onChange={(event) =>
                        setActivityRange(Number(event.target.value))
                      }
                      value={activityRange}
                    >
                      <option value="7">Last 7 days</option>
                      <option value="14">Last 14 days</option>
                      <option value="30">Last 30 days</option>
                    </select>
                  </div>

                  <div className="mt-5 flex items-end gap-3">
                    <div className="grid w-full gap-2">
                      <div className="flex items-end justify-between gap-1">
                        <span className="text-[10px] font-semibold text-slate-700">
                          {bookingActivityLoading ? "—" : activityTotal}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {bookingActivityLoading
                            ? "Loading activity…"
                            : "scheduled sessions"}
                        </span>
                      </div>
                      <div
                        aria-label={`${activityTotal} bookings in the last ${activityRange} days`}
                        className={`flex h-36 items-stretch rounded-xl bg-slate-50 p-3 ${
                          activityRange === 7 ? "gap-3" : "gap-1"
                        }`}
                        role="img"
                      >
                        {activityRows.map(({ count, date, dateKey }, index) => (
                          <div
                            key={dateKey}
                            className="flex min-w-0 flex-1 flex-col items-center"
                          >
                            <div className="flex min-h-0 w-full flex-1 items-end justify-center">
                              <div
                                className="w-full rounded-t-md bg-gradient-to-t from-violet-500 to-violet-300"
                                style={{
                                  height: `${count === 0 ? 4 : Math.max(8, (count / activityMaximum) * 100)}%`,
                                }}
                                title={`${date.toLocaleDateString(undefined, {
                                  day: "numeric",
                                  month: "short",
                                })}: ${count} bookings`}
                              />
                            </div>
                            <span className="mt-2 h-3 text-[7px] text-slate-400 sm:text-[8px]">
                              {activityRange === 7 || index % 5 === 0
                                ? date.toLocaleDateString(undefined, {
                                    day: "numeric",
                                    month:
                                      activityRange === 7 ? undefined : "short",
                                  })
                                : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                      {bookingActivityError && (
                        <p className="text-[10px] text-rose-600" role="alert">
                          {bookingActivityError}
                        </p>
                      )}
                    </div>
                  </div>
                </article>

                <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[.02]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={sectionLabelClass}>PENDING ACTION</div>
                      <h2 className={panelTitleClass}>Needs your attention</h2>
                    </div>

                    <span
                      className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-[26px] font-bold leading-none tracking-tight text-slate-800">
                      {(Number(overviewStats?.pendingInfluencers) || 0) +
                        (Number(overviewStats?.pendingCertificates) || 0) +
                        (Number(overviewStats?.pendingUsers) || 0)}
                    </span>

                    <span className="pb-1 text-[10px] text-slate-400">
                      pending reviews
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {[
                      {
                        name: "Creator registrations",
                        count: overviewStats?.pendingInfluencers ?? 0,
                        icon: "users",
                        color: "bg-violet-50 text-violet-600",
                      },
                      {
                        name: "Certificate verification",
                        count: overviewStats?.pendingCertificates ?? 0,
                        icon: "star",
                        color: "bg-amber-50 text-amber-600",
                      },
                      {
                        name: "Onboarding tasks",
                        count: overviewStats?.pendingUsers ?? 0,
                        icon: "clock",
                        color: "bg-emerald-50 text-emerald-600",
                      },
                    ].map((item) => (
                      <button
                        key={item.name}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 text-left transition hover:bg-slate-100"
                        type="button"
                      >
                        <span
                          className={`grid size-8 place-items-center rounded-lg ${item.color}`}
                        >
                          <Icon name={item.icon} size={16} />
                        </span>

                        <span className="min-w-0 flex-1 text-[10px] font-medium text-slate-600">
                          {item.name}
                        </span>

                        <span className="text-[11px] font-bold text-slate-800">
                          {item.count}
                        </span>

                        <Icon
                          name="arrow"
                          size={14}
                          className="text-slate-400"
                        />
                      </button>
                    ))}
                  </div>
                </article>
              </section>

              <section className="admin-bookings-layout">
                <article className={`${panelClass} admin-bookings-card pb-2`}>
                  <div className="admin-bookings-header">
                    <div>
                      <div className={sectionLabelClass}>
                        DON’T MISS A MOMENT
                      </div>
                      <h2 className={panelTitleClass}>
                        Upcoming bookings{" "}
                        <span className="rounded-md bg-violet-50 px-1.5 py-1 text-[9px] font-semibold text-violet-700">
                          {bookingActivityLoading
                            ? "…"
                            : String(bookingActivity.length).padStart(2, "0")}
                        </span>
                      </h2>
                    </div>
                    <button
                      className="shrink-0 text-[9px] font-semibold text-violet-700 hover:text-violet-900"
                      onClick={() => navigate("/admin/bookings")}
                    >
                      View all <span className="pl-1">→</span>
                    </button>
                  </div>
                  <div className="admin-bookings-table-viewport mt-4">
                    <table className="admin-bookings-table border-collapse text-left">
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
                            key={booking.id}
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
                        {bookingActivityLoading && (
                          <tr>
                            <td
                              className="p-6 text-center text-[10px] text-slate-400"
                              colSpan="6"
                            >
                              Loading bookings…
                            </td>
                          </tr>
                        )}
                        {!bookingActivityLoading && bookingActivityError && (
                          <tr>
                            <td
                              className="p-6 text-center text-[10px] text-rose-600"
                              colSpan="6"
                            >
                              {bookingActivityError}
                            </td>
                          </tr>
                        )}
                        {!bookingActivityLoading &&
                          !bookingActivityError &&
                          filteredBookings.length === 0 && (
                            <tr>
                              <td
                                className="p-6 text-center text-[10px] text-slate-400"
                                colSpan="6"
                              >
                                {search
                                  ? `No bookings match “${search}”.`
                                  : "No bookings have been created yet."}
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>
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
          bookings={bookingActivity}
          bookingsLoading={bookingActivityLoading}
          bookingsError={bookingActivityError}
          search={search}
          onSearchChange={setSearch}
          onCreateBooking={() => {
            setBookingFormError("");
            setShowBookingForm(true);
          }}
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
          onClick={() => {
            if (!bookingSubmitting) {
              setShowBookingForm(false);
            }
          }}
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
                disabled={bookingSubmitting}
                onClick={() => setShowBookingForm(false)}
                type="button"
              >
                <Icon name="close" />
              </button>
            </div>
            <form className="grid gap-3.5" onSubmit={submitBooking}>
              <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
                Client name
                <input
                  className={fieldClass}
                  name="clientName"
                  required
                  placeholder="e.g. Alex Morgan"
                />
              </label>
              <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
                Session type
                <select
                  className={fieldClass}
                  defaultValue=""
                  name="service"
                  required
                >
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
                  <input
                    className={fieldClass}
                    name="date"
                    required
                    type="date"
                  />
                </label>
                <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
                  Time
                  <input
                    className={fieldClass}
                    name="time"
                    required
                    type="time"
                  />
                </label>
              </div>
              <label className="grid gap-1.5 text-[10px] font-semibold text-slate-600">
                Price
                <input
                  className={fieldClass}
                  name="amount"
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="$ 0.00"
                />
              </label>
              {bookingFormError && (
                <p className="text-[10px] text-rose-600" role="alert">
                  {bookingFormError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  className="min-h-9 rounded-lg border border-slate-200 px-3.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                  disabled={bookingSubmitting}
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                >
                  Cancel
                </button>
                <button
                  className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  disabled={bookingSubmitting}
                  type="submit"
                >
                  <Icon name="plus" size={16} />
                  {bookingSubmitting ? "Creating…" : "Create booking"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
