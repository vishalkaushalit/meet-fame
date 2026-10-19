export const calendarDays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
export function shiftCalendarDate(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function calendarWeek(date) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const monday = shiftCalendarDate(date, -(weekday + 6) % 7);
  return calendarDays.map((day, index) => ({
    date: shiftCalendarDate(monday, index),
    day,
  }));
}
export function calendarDaySlots(overview, date) {
  const weekday = calendarWeek(date).find((day) => day.date === date).day;
  const scheduled = overview?.weeklySlotPlan?.[weekday]?.generatedSlots || [];
  const booked = (overview?.allBookings || []).filter(
    (booking) => booking.date === date && booking.status !== 'cancelled',
  );
  const slots = new Map(
    scheduled.map((slot) => [slot.slotId, { ...slot, date, day: weekday }]),
  );
  for (const booking of booked)
    slots.set(booking.slot, {
      ...slots.get(booking.slot),
      date,
      day: weekday,
      slotId: booking.slot,
      label: booking.slotLabel || booking.slot,
      booking,
    });
  return [...slots.values()].sort((a, b) => a.slotId.localeCompare(b.slotId));
}
export function calendarMinutes(slot) {
  const match = /^(\d{2}):(\d{2})/.exec(slot || '');
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
export function calendarRows(slots) {
  const minutes = slots
    .map((slot) => calendarMinutes(slot.slotId))
    .filter((value) => value !== null);
  if (!minutes.length) return [];
  const rows = new Set(minutes);
  for (
    let value = Math.floor(Math.min(...minutes) / 60) * 60;
    value <= Math.max(...minutes);
    value += 60
  )
    rows.add(value);
  return [...rows].sort((a, b) => a - b);
}
