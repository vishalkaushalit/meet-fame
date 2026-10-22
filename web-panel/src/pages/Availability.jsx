import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";
import { bookingsApi, influencersApi } from "../api/apiServices";

const HOURS = Array.from({ length: 12 }, (_, index) => index + 9);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const cardClass = "rounded-xl border border-slate-200 bg-white shadow-sm";

const toDateKey = (date) =>
  `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;

const fromDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const getWeek = (dateKey) => {
  const date = fromDateKey(dateKey);
  const mondayOffset = (date.getDay() + 6) % 7;
  const monday = addDays(date, -mondayOffset);
  return DAYS.map((_, index) => addDays(monday, index));
};

const getInfluencerList = (response) => {
  const list =
    response?.influencers ??
    response?.data?.influencers ??
    response?.data?.data ??
    response?.data ??
    response;

  if (!Array.isArray(list)) {
    throw new Error("The influencers API returned an invalid response.");
  }

  return list;
};

const getAvailabilitySlots = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("The availability API returned an invalid response.");
  }

  const slots =
    payload.slots ?? payload.availabilitySlots ?? payload.availability ?? [];
  const available = payload.availableSlots ?? [];
  const booked = payload.bookedSlots ?? [];

  if (![slots, available, booked].every(Array.isArray)) {
    throw new Error("The availability API returned an invalid response.");
  }

  return [
    ...slots,
    ...available.map((slot) => ({
      ...(typeof slot === "object" && slot !== null
        ? slot
        : { startTime: slot }),
      status: slot?.status ?? "available",
    })),
    ...booked.map((slot) => ({
      ...(typeof slot === "object" && slot !== null
        ? slot
        : { startTime: slot }),
      status: slot?.status ?? "booked",
    })),
  ];
};

const getBookingList = (response) => {
  const bookings =
    response?.bookings ??
    response?.data?.bookings ??
    response?.data?.data ??
    response?.data ??
    response;

  if (!Array.isArray(bookings)) {
    throw new Error("The bookings API returned an invalid response.");
  }

  return bookings;
};

const getInfluencerId = (influencer) => influencer.id ?? influencer._id;

const getInfluencerName = (influencer) => {
  const fullName = [influencer.firstName, influencer.lastName]
    .filter(Boolean)
    .join(" ");
  return (
    influencer.name ||
    influencer.fullName ||
    fullName ||
    influencer.email ||
    "Unnamed creator"
  );
};

const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

const getSlotHour = (slot) => {
  const value =
    slot?.startTime ?? slot?.start ?? slot?.from ?? slot?.time ?? slot?.slot;
  if (typeof value === "number") {
    return value >= 0 && value <= 23 ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const timeMatch = value.match(/(?:T|\b)(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return Number(timeMatch[1]);
  }

  const twelveHourMatch = value.match(/\b(\d{1,2})(?::\d{2})?\s*(am|pm)\b/i);
  if (twelveHourMatch) {
    const hour = Number(twelveHourMatch[1]) % 12;
    return hour + (twelveHourMatch[2].toLowerCase() === "pm" ? 12 : 0);
  }

  return null;
};

const getBookingDateKey = (booking) => {
  const value = booking?.date ?? booking?.scheduledAt ?? booking?.scheduledDate;
  if (typeof value !== "string") {
    return null;
  }

  return value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
};

const isActiveBooking = (booking) => {
  const status = String(booking?.status ?? "").toLowerCase();
  return !["cancelled", "canceled", "rejected", "failed", "expired"].includes(
    status,
  );
};

const getSlotStatus = (slot) => {
  const status = String(slot?.status ?? "").toLowerCase();
  return slot?.isBooked ||
    slot?.booked ||
    status.includes("book") ||
    status.includes("confirm")
    ? "booked"
    : "available";
};

const formatHour = (hour) =>
  new Date(2020, 0, 1, hour).toLocaleTimeString([], {
    hour: "numeric",
    hour12: true,
  });

const formatHour24 = (hour) => `${String(hour).padStart(2, "0")}:00`;

const getSlotTimeLabel = (slot) =>
  slot?.slotLabel ??
  slot?.slot ??
  slot?.time ??
  (slot?.startTime && slot?.endTime
    ? `${slot.startTime} - ${slot.endTime}`
    : null);

const formatDate = (date, options) =>
  date.toLocaleDateString(undefined, options);

const formatRate = (rate) => {
  if (rate === null || rate === undefined || rate === "") {
    return "Rate not set";
  }

  const amount = Number(rate);
  return Number.isFinite(amount)
    ? `${new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(amount)} / hour`
    : `${rate} / hour`;
};

const getRecurringAvailability = (influencer, slot) =>
  slot?.recurringAvailability ??
  slot?.recurring ??
  influencer?.availability ??
  influencer?.weeklyAvailability ??
  null;

const Availability = () => {
  const todayKey = toDateKey(new Date());
  const initialDate = useRef(todayKey);
  const [influencers, setInfluencers] = useState([]);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState("");
  const [date, setDate] = useState(todayKey);
  const [slotsByDate, setSlotsByDate] = useState({});
  const [bookings, setBookings] = useState([]);
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [loadingInfluencers, setLoadingInfluencers] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [partialError, setPartialError] = useState("");

  const week = useMemo(() => getWeek(date), [date]);
  const selectedInfluencer = influencers.find(
    (influencer) =>
      String(getInfluencerId(influencer)) === selectedInfluencerId,
  );
  const influencerName = selectedInfluencer
    ? getInfluencerName(selectedInfluencer)
    : "Creator";

  const weekSlots = useMemo(() => {
    const slotsByDateAndHour = new Map();

    week.forEach((day) => {
      const dateKey = toDateKey(day);
      (slotsByDate[dateKey] ?? []).forEach((slot, index) => {
        const hour = getSlotHour(slot);
        const key = `${dateKey}-${hour ?? `slot-${index}`}`;
        slotsByDateAndHour.set(key, {
          ...slot,
          dateKey,
          hour,
          status: getSlotStatus(slot),
          key,
        });
      });
    });

    bookings.forEach((booking) => {
      if (!isActiveBooking(booking)) {
        return;
      }

      const dateKey = getBookingDateKey(booking);
      const hour = getSlotHour(booking);
      if (
        !dateKey ||
        hour === null ||
        !week.some((day) => toDateKey(day) === dateKey)
      ) {
        return;
      }

      if (
        booking.influencerId &&
        String(booking.influencerId) !== selectedInfluencerId
      ) {
        return;
      }

      const key = `${dateKey}-${hour}`;
      slotsByDateAndHour.set(key, {
        ...slotsByDateAndHour.get(key),
        ...booking,
        dateKey,
        hour,
        status: "booked",
        bookingStatus: booking.status,
        key,
        clientName: booking.userName ?? booking.clientName,
      });
    });

    return Array.from(slotsByDateAndHour.values());
  }, [bookings, selectedInfluencerId, slotsByDate, week]);

  const selectedSlot =
    weekSlots.find((slot) => slot.key === selectedSlotKey) ?? null;

  const loadAvailability = useCallback(async (anchorDate, influencerId) => {
    if (!influencerId) {
      return;
    }

    setLoadingSlots(true);
    setErrorMessage("");
    setPartialError("");
    setSlotsByDate({});
    setBookings([]);
    setSelectedSlotKey("");

    const dates = getWeek(anchorDate);
    const [availabilityResults, bookingResult] = await Promise.all([
      Promise.allSettled(
        dates.map(async (day) => {
          const dayKey = toDateKey(day);
          const response = await influencersApi.getSlotsOverview(
            influencerId,
            dayKey,
          );
          return [dayKey, getAvailabilitySlots(response)];
        }),
      ),
      bookingsApi.getAll("all", influencerId).then(getBookingList).then(
        (result) => ({ status: "fulfilled", value: result }),
        (reason) => ({ status: "rejected", reason }),
      ),
    ]);

    const nextSlots = {};
    const failures = [];
    availabilityResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const [dayKey, daySlots] = result.value;
        nextSlots[dayKey] = daySlots;
      } else {
        failures.push(dates[index]);
        console.error(
          `Unable to load creator availability for ${toDateKey(dates[index])}.`,
          result.reason,
        );
      }
    });

    setSlotsByDate(nextSlots);
    const warnings = [];
    if (bookingResult.status === "fulfilled") {
      setBookings(bookingResult.value);
    } else {
      console.error(
        "Unable to load bookings for creator availability.",
        bookingResult.reason,
      );
      warnings.push("Bookings could not be loaded, so booked slots may not be shown.");
    }

    const bookingsForWeek =
      bookingResult.status === "fulfilled" ? bookingResult.value : [];
    const bookedSlotKeys = new Set(
      bookingsForWeek
        .filter(
          (booking) =>
            isActiveBooking(booking) &&
            (!booking.influencerId ||
              String(booking.influencerId) === influencerId),
        )
        .map((booking) => {
          const bookingDate = getBookingDateKey(booking);
          const bookingHour = getSlotHour(booking);
          return bookingDate && bookingHour !== null
            ? `${bookingDate}-${bookingHour}`
            : null;
        })
        .filter(Boolean),
    );

    const getSlotEntries = (day) =>
      (nextSlots[toDateKey(day)] ?? []).map((slot, index) => ({
        key: `${toDateKey(day)}-${getSlotHour(slot) ?? `slot-${index}`}`,
        status: getSlotStatus(slot),
      }));
    const selectedDay = dates.find((day) => toDateKey(day) === anchorDate);
    const selectedDaySlots = selectedDay ? getSlotEntries(selectedDay) : [];
    const selectedDayBookings = bookingsForWeek
      .filter(
        (booking) =>
          isActiveBooking(booking) &&
          getBookingDateKey(booking) === anchorDate &&
          (!booking.influencerId ||
            String(booking.influencerId) === influencerId),
      )
      .map((booking) => {
        const hour = getSlotHour(booking);
        return hour === null ? null : { key: `${anchorDate}-${hour}` };
      })
      .filter(Boolean);
    const weekEntries = dates.flatMap(getSlotEntries);
    const firstAvailable =
      selectedDaySlots.find(
        (entry) =>
          entry.status === "available" && !bookedSlotKeys.has(entry.key),
      ) ??
      weekEntries.find(
        (entry) =>
          entry.status === "available" && !bookedSlotKeys.has(entry.key),
      );
    const firstSlot =
      selectedDayBookings[0] ?? selectedDaySlots[0] ?? weekEntries[0];
    setSelectedSlotKey((firstAvailable ?? firstSlot)?.key ?? "");

    if (failures.length === dates.length) {
      setErrorMessage(
        "Availability could not be loaded. Please check your connection and try again.",
      );
    } else {
      if (failures.length) {
        warnings.push(
          `Availability could not be loaded for ${failures.length} ${failures.length === 1 ? "day" : "days"} of this week.`,
        );
      }
      setPartialError(warnings.join(" "));
    }

    setLoadingSlots(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    influencersApi
      .getAll()
      .then((response) => {
        const list = getInfluencerList(response);
        if (isMounted) {
          setInfluencers(list);
          const firstId = list[0] && getInfluencerId(list[0]);
          if (firstId != null) {
            const influencerId = String(firstId);
            setSelectedInfluencerId(influencerId);
            loadAvailability(initialDate.current, influencerId);
          }
        }
      })
      .catch((error) => {
        console.error("Unable to load creators for availability.", error);
        if (isMounted) {
          setErrorMessage(
            error.response?.data?.message ||
              error.response?.data?.error ||
              error.message ||
              "Unable to load creators.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingInfluencers(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialDate, loadAvailability]);

  const setWeekOffset = (offset) => {
    const nextDate = toDateKey(addDays(fromDateKey(date), offset * 7));
    setDate(nextDate);
    loadAvailability(nextDate, selectedInfluencerId);
  };

  const selectCalendarDay = (dayKey) => {
    setDate(dayKey);
    const daySlots = weekSlots.filter((slot) => slot.dateKey === dayKey);
    const selectedDaySlot =
      daySlots.find((slot) => slot.status === "available") ?? daySlots[0];
    setSelectedSlotKey(selectedDaySlot?.key ?? "");
  };

  const weekLabel = `${formatDate(week[0], {
    day: "numeric",
    month: "short",
    year: "numeric",
  })} – ${formatDate(week[6], {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  const selectedDateLabel = formatDate(fromDateKey(date), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const timezoneOffset = -new Date().getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
  const offsetMinutes = Math.abs(timezoneOffset) % 60;
  const offsetSign = timezoneOffset >= 0 ? "+" : "-";
  const timezoneString = `${Intl.DateTimeFormat().resolvedOptions().timeZone.replace("_", " ")} · UTC${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;

  const availableCount = weekSlots.filter(
    (slot) => slot.status === "available",
  ).length;
  const bookedCount = weekSlots.filter(
    (slot) => slot.status === "booked",
  ).length;

  const onSubmit = (event) => {
    event.preventDefault();
    loadAvailability(date, selectedInfluencerId);
  };

  return (
    <div className="mx-auto w-full max-w-[1530px] px-3 pb-6 py-4 sm:px-5 sm:pt-6 lg:px-[38px]">
      {/* Top Header Section */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <a
              aria-label="Back to overview"
              className="grid size-8 place-items-center rounded-lg bg-violet-100 text-violet-700 transition hover:bg-violet-200"
              href="/admin"
            >
              <FiArrowLeft aria-hidden="true" size={17} />
            </a>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Availability
            </h1>
          </div>
          <p className="ml-10 mt-1 text-sm text-slate-500">
            Explore influencer schedules and booked time slots.
          </p>
        </div>
        <button
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loadingSlots || loadingInfluencers || !selectedInfluencerId}
          onClick={() => loadAvailability(date, selectedInfluencerId)}
          type="button"
        >
          <FiRefreshCw
            aria-hidden="true"
            className={loadingSlots ? "animate-spin" : ""}
            size={14}
          />
          Refresh data
        </button>
      </header>

      {/* Filters Form */}
      <form
        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(200px,1fr)_minmax(200px,1.2fr)_auto] sm:items-end"
        onSubmit={onSubmit}
      >
        <label className="grid gap-1.5 text-xs font-medium text-slate-600">
          Influencer
          <span className="relative">
            <select
              className="min-h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              disabled={loadingInfluencers || !influencers.length}
              onChange={(event) => {
                const influencerId = event.target.value;
                setSelectedInfluencerId(influencerId);
                setSlotsByDate({});
                loadAvailability(date, influencerId);
              }}
              value={selectedInfluencerId}
            >
              {loadingInfluencers && (
                <option value="">Loading creators…</option>
              )}
              {!loadingInfluencers && !influencers.length && (
                <option value="">No creators available</option>
              )}
              {influencers.map((influencer, index) => {
                const id = getInfluencerId(influencer);
                return (
                  <option key={id ?? index} value={id ?? ""}>
                    {getInfluencerName(influencer)}
                  </option>
                );
              })}
            </select>
            <FiChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={14}
            />
          </span>
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-600">
          Date
          <input
            className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            onChange={(event) => {
              const nextDate = event.target.value;
              setDate(nextDate);
              if (nextDate) {
                loadAvailability(nextDate, selectedInfluencerId);
              }
            }}
            type="date"
            value={date}
          />
        </label>
        <button
          aria-label="Load selected week"
          className="grid min-h-10 w-full place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-violet-300 hover:text-violet-700 sm:w-10"
          disabled={loadingSlots || loadingInfluencers || !selectedInfluencerId}
          type="submit"
        >
          <FiRefreshCw
            aria-hidden="true"
            className={loadingSlots ? "animate-spin" : ""}
            size={15}
          />
        </button>
      </form>

      {/* Alerts */}
      {errorMessage && (
        <p
          className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
      {partialError && (
        <p
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="status"
        >
          {partialError}
        </p>
      )}

      {/* Influencer Banner */}
      <section
        className={`${cardClass} mb-6 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-white via-slate-50 to-violet-50 px-5 py-4`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-sm font-semibold text-violet-700">
            {getInitials(influencerName)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-800">
              {influencerName}
              {selectedInfluencer?.isVerified && (
                <span
                  aria-label="Verified"
                  className="ml-1.5 inline-grid size-4 place-items-center rounded-full bg-sky-500 align-middle text-[10px] text-white"
                  title="Verified"
                >
                  ✓
                </span>
              )}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {selectedInfluencer?.specialization ||
                selectedInfluencer?.category ||
                "Influencer schedule"}
            </p>
          </div>
        </div>
        <div className="sm:text-right">
          <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-800">
            {formatRate(selectedInfluencer?.hourlyRate)}
          </span>
          <p className="mt-1 text-xs text-slate-500">
            {selectedInfluencer?.category || "60-minute sessions"}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Calendar Section - Using the provided HTML structure */}
        <section
          className={`${cardClass} min-w-0 p-5 sm:p-6`}
          aria-label="Session calendar"
        >
          <header className="availability-calendar-heading flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                {weekLabel}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{timezoneString}</p>
            </div>
            <div
              className="availability-view-switch flex items-center gap-2"
              aria-label="Calendar view"
            >
              <button
                type="button"
                className="calendar-arrow-button grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Previous week"
                onClick={() => setWeekOffset(-1)}
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="calendar-arrow-button grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Next week"
                onClick={() => setWeekOffset(1)}
              >
                <FiChevronRight size={16} />
              </button>
              <select
                className="calendar-view-select border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 bg-white outline-none focus:border-violet-400"
                aria-label="Calendar view"
              >
                <option value="today">Today</option>
                <option value="week" selected>
                  Week
                </option>
                <option value="day">Day</option>
              </select>
            </div>
          </header>

          <h4 className="text-sm font-semibold text-slate-800 mb-3">
            {selectedDateLabel}
          </h4>

          <div className="availability-summary flex flex-wrap gap-2 mb-5">
            <span className="slot-summary-badge is-total inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {weekSlots.length} total slots
            </span>
            <span className="slot-summary-badge is-available inline-flex items-center rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              {availableCount} available
            </span>
            <span className="slot-summary-badge is-booked inline-flex items-center rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800">
              {bookedCount} booked
            </span>
          </div>

          <div
            className="availability-grid-scroll overflow-x-auto pb-2"
            aria-busy={loadingSlots}
          >
            <table className="availability-grid w-full min-w-[700px] border-collapse">
              <caption className="sr-only">
                week schedule in{" "}
                {Intl.DateTimeFormat().resolvedOptions().timeZone}. Select a
                slot to inspect its details.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="w-[50px]">
                    <span className="sr-only">Time</span>
                  </th>
                  {week.map((day, index) => {
                    const dayKey = toDateKey(day);
                    const isSelectedDay = dayKey === date;
                    return (
                      <th
                        scope="col"
                        className="px-1 py-2 text-center"
                        key={dayKey}
                      >
                        <button
                          type="button"
                          aria-pressed={isSelectedDay}
                          aria-label={`Show availability for ${formatDate(day, {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}`}
                          className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition ${
                            isSelectedDay
                              ? "bg-violet-50 text-violet-700 font-semibold"
                              : "text-slate-500 hover:bg-slate-50"
                          }`}
                          onClick={() => {
                            selectCalendarDay(dayKey);
                          }}
                        >
                          <span className="text-[11px] uppercase tracking-wider mb-1">
                            {DAYS[index]}
                          </span>
                          <strong className="text-lg">{day.getDate()}</strong>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour}>
                    <th
                      scope="row"
                      className="pr-3 pt-2 text-right text-[11px] font-medium text-slate-400 align-top whitespace-nowrap"
                    >
                      {formatHour(hour)}
                    </th>
                    {week.map((day) => {
                      const dayKey = toDateKey(day);
                      const matchingSlots = weekSlots.filter(
                        (slot) => slot.dateKey === dayKey && slot.hour === hour,
                      );
                      const slot = matchingSlots[0];
                      const selected = slot?.key === selectedSlot?.key;

                      return (
                        <td
                          key={`${dayKey}-${hour}`}
                          className="p-1 border-t border-slate-100 h-12 align-middle"
                        >
                          {slot ? (
                            <button
                              type="button"
                              className={`availability-slot w-full h-full min-h-[36px] flex items-center justify-center rounded-md text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                                slot.status === "booked"
                                  ? "is-booked bg-violet-100 text-violet-800 hover:bg-violet-200"
                                  : "is-available bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                              } ${
                                selected
                                  ? "ring-2 ring-violet-500 ring-offset-1"
                                  : ""
                              }`}
                              aria-pressed={selected}
                              aria-label={`${slot.status === "booked" ? `Booked by ${slot.clientName || "User"}` : "Available"}: ${getSlotTimeLabel(slot) || `${formatHour(hour)} - ${formatHour(hour + 1)}`}, ${dayKey}`}
                              onClick={() => setSelectedSlotKey(slot.key)}
                            >
                              <span className="truncate px-1">
                                {slot.clientName ||
                                  slot.bookedBy?.name ||
                                  formatHour24(hour)}
                              </span>
                            </button>
                          ) : (
                            <div className="h-full min-h-[36px]" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loadingSlots && (
            <p
              className="py-4 text-center text-sm text-slate-500"
              role="status"
            >
              Loading weekly availability…
            </p>
          )}
          {!loadingSlots && !errorMessage && weekSlots.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No availability was returned for this week.
            </p>
          )}

          <footer className="availability-legend flex flex-wrap items-center gap-5 mt-6 pt-5 border-t border-slate-100 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-2">
              <i className="available-dot size-2.5 rounded-full bg-emerald-500 inline-block"></i>
              Available
            </span>
            <span className="flex items-center gap-2">
              <i className="booked-dot size-2.5 rounded-full bg-violet-500 inline-block"></i>
              Booked
            </span>
          </footer>
        </section>

        {/* Sidebar Details (Kept from previous for full functionality) */}
        <aside aria-label="Session details" className={`${cardClass} p-5`}>
          <h2 className="text-sm font-semibold text-slate-800">
            Session details
          </h2>
          {selectedSlot ? (
            <>
              <span
                className={`mt-4 inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                  selectedSlot.status === "booked"
                    ? "bg-violet-100 text-violet-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {selectedSlot.status === "booked" ? "Booked" : "Available"}
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-800">
                {getSlotTimeLabel(selectedSlot) ||
                selectedSlot.hour === null
                  ? String(
                      getSlotTimeLabel(selectedSlot) ??
                        selectedSlot.startTime ??
                        selectedSlot.time ??
                        "Session time",
                    )
                  : `${formatHour(selectedSlot.hour)} – ${formatHour(
                      selectedSlot.hour + 1,
                    )}`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(fromDateKey(selectedSlot.dateKey), {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-slate-600">
                {selectedSlot.status === "booked"
                  ? `This session is booked${
                      selectedSlot.clientName
                        ? ` by ${selectedSlot.clientName}`
                        : ""
                    }.`
                  : "This slot is available in the influencer’s schedule."}
              </p>
              {selectedSlot.status === "booked" && (
                <div className="mt-4 space-y-3 rounded-lg border border-slate-100 bg-white p-3">
                  <div>
                    <p className="text-[10px] text-slate-500">Booked by</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-800">
                      {selectedSlot.userName ||
                        selectedSlot.clientName ||
                        "Customer"}
                    </p>
                    {selectedSlot.userEmail && (
                      <a
                        className="mt-0.5 block break-all text-[10px] text-violet-700 hover:underline"
                        href={`mailto:${selectedSlot.userEmail}`}
                      >
                        {selectedSlot.userEmail}
                      </a>
                    )}
                    {selectedSlot.userPhone && (
                      <a
                        className="mt-0.5 block text-[10px] text-violet-700 hover:underline"
                        href={`tel:${selectedSlot.userPhone}`}
                      >
                        {selectedSlot.userPhone}
                      </a>
                    )}
                  </div>
                  {selectedSlot.topic && (
                    <div>
                      <p className="text-[10px] text-slate-500">Session topic</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-700">
                        {selectedSlot.topic}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSlot.meetingType && (
                      <div>
                        <p className="text-[10px] text-slate-500">Meeting</p>
                        <p className="mt-0.5 text-xs capitalize text-slate-700">
                          {selectedSlot.meetingType}
                        </p>
                      </div>
                    )}
                    {selectedSlot.paymentStatus && (
                      <div>
                        <p className="text-[10px] text-slate-500">Payment</p>
                        <p className="mt-0.5 text-xs capitalize text-slate-700">
                          {selectedSlot.paymentStatus}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedSlot.price != null && (
                    <div>
                      <p className="text-[10px] text-slate-500">Booking price</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-800">
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: selectedSlot.currency || "USD",
                        }).format(Number(selectedSlot.price))}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-6 rounded-lg bg-slate-50 p-4 border border-slate-100">
                <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <FiClock aria-hidden="true" size={14} />
                  {selectedSlot.status === "booked"
                    ? "Booking status"
                    : "Recurring availability"}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {selectedSlot.status === "booked"
                    ? String(selectedSlot.bookingStatus ?? "Confirmed")
                    : formatDate(fromDateKey(selectedSlot.dateKey), {
                        weekday: "long",
                      })}
                </p>
                {getRecurringAvailability(selectedInfluencer, selectedSlot) && (
                  <p className="mt-2 inline-flex rounded-md bg-violet-100 px-2.5 py-1 text-xs text-violet-800">
                    {typeof getRecurringAvailability(
                      selectedInfluencer,
                      selectedSlot,
                    ) === "string"
                      ? getRecurringAvailability(
                          selectedInfluencer,
                          selectedSlot,
                        )
                      : `${formatHour(selectedSlot.hour ?? 9)} – ${formatHour(
                          (selectedSlot.hour ?? 9) + 1,
                        )}`}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <FiCalendar
                aria-hidden="true"
                className="mx-auto mb-3 text-slate-400"
                size={24}
              />
              <p className="text-sm text-slate-500">
                Select a slot to see its details.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Availability;
