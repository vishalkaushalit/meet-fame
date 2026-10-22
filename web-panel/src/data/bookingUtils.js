const avatarColors = [
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
];

const getBookingList = (response) => {
  const list =
    response?.bookings ??
    response?.data?.bookings ??
    response?.data?.data ??
    response?.data ??
    response;

  if (!Array.isArray(list)) {
    throw new Error("The bookings API returned an invalid response.");
  }

  return list.map((booking, index) => normalizeBooking(booking, index));
};

const getPersonName = (person) => {
  if (typeof person === "string") {
    return person;
  }

  if (!person || typeof person !== "object") {
    return "";
  }

  return (
    person.name ??
    person.fullName ??
    [person.firstName, person.lastName].filter(Boolean).join(" ")
  );
};

const formatBookingDate = (booking) => {
  const value =
    booking.scheduledAt ??
    booking.scheduledDate ??
    booking.bookingDate ??
    booking.slot?.startTime ??
    booking.date ??
    booking.startTime;

  if (!value) {
    return "Date not set";
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const formattedDate = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = booking.slotLabel ?? booking.slot;

    return time ? `${formattedDate}, ${time}` : formattedDate;
  }

  const dateValue =
    booking.time && /^\d{4}-\d{2}-\d{2}$/.test(String(value))
      ? `${value}T${booking.time}`
      : value;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatBookingAmount = (booking) => {
  const amount = booking.amount ?? booking.price ?? booking.totalAmount;
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return String(amount);
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: booking.currency || "USD",
  }).format(numericAmount);
};

const normalizeBooking = (booking, index) => {
  if (!booking || typeof booking !== "object" || Array.isArray(booking)) {
    throw new Error("The bookings API returned an invalid booking.");
  };

  const name =
    booking.clientName ||
    booking.customerName ||
    booking.userName ||
    getPersonName(booking.client) ||
    getPersonName(booking.user) ||
    getPersonName(booking.customer) ||
    booking.name ||
    "Unknown client";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  const status = String(booking.status ?? "Pending")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return {
    ...booking,
    id: booking.id ?? booking._id ?? `${name}-${index}`,
    scheduledAt:
      booking.scheduledAt ??
      booking.scheduledDate ??
      booking.bookingDate ??
      booking.slot?.startTime ??
      booking.date ??
      booking.startTime,
    name,
    handle:
      booking.handle ??
      booking.userEmail ??
      booking.client?.handle ??
      booking.user?.handle ??
      booking.customer?.handle ??
      "",
    initials: initials || "?",
    color: avatarColors[index % avatarColors.length],
    service:
      booking.service ??
      booking.sessionType ??
      booking.serviceType ??
      booking.serviceName ??
      booking.topic ??
      booking.title ??
      "Session",
    date: formatBookingDate(booking),
    amount: formatBookingAmount(booking),
    status,
  };
}

export { getBookingList };
