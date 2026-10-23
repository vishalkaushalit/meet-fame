import { dayRanges } from '../../shared/availability.js';
// Slot generation utilities for 1-hour slots

/**
 * Convert 24-hour time "09:00" or "17:00" to minutes from midnight
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) {
    return 0;
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Convert minutes from midnight to 24h string "09:00"
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format "09:00" to "9:00 AM" or "17:00" to "5:00 PM"
 */
export function formatTo12Hour(time24) {
  if (!time24) {
    return '';
  }
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) {
    h = 12;
  } else if (h > 12) {
    h -= 12;
  }
  return `${h}:${m} ${period}`;
}

/**
 * Generate 1-hour slots from a start time and end time.
 * E.g. "09:00" to "12:00" => ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00"]
 */
export function generateOneHourSlotsFromRange(startTime, endTime) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const slots = [];

  let current = startMin;
  while (current + 60 <= endMin) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + 60);
    const slotId = `${slotStart} - ${slotEnd}`;
    const displayLabel = `${formatTo12Hour(slotStart)} - ${formatTo12Hour(slotEnd)}`;

    slots.push({
      slotId,
      startTime: slotStart,
      endTime: slotEnd,
      label: displayLabel,
    });
    current += 60;
  }
  return slots;
}

/**
 * Generate all 1-hour slots for a day's time ranges
 * E.g. ranges: [{ start: "09:00", end: "12:00" }, { start: "17:00", end: "20:00" }]
 */
export function generateDaySlots(ranges = []) {
  const allSlots = [];
  for (const range of dayRanges(ranges)) {
    if (range.start && range.end) {
      const slots = generateOneHourSlotsFromRange(range.start, range.end);
      allSlots.push(...slots);
    }
  }
  // Deduplicate and sort by start time
  const map = new Map();
  for (const s of allSlots) {
    map.set(s.slotId, s);
  }
  return Array.from(map.values()).sort((a, b) => {
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}

/**
 * Get day name from date string "YYYY-MM-DD" (e.g. "monday", "tuesday")
 */
export function getDayNameFromDate(dateStr) {
  if (!dateStr) {
    return '';
  }
  const date = new Date(dateStr + 'T00:00:00');
  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[date.getDay()];
}
