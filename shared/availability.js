export const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
// Accept legacy arrays when loading older accounts; always save the object format.
export function dayRanges(day) {
  return Array.isArray(day) ? day : Array.isArray(day?.ranges) ? day.ranges : [];
}
export function normalizeAvailability(availability = {}) {
  return Object.fromEntries(WEEK_DAYS.map(day => [day, { ranges: dayRanges(availability?.[day]).map(range => ({ start: range.start, end: range.end })) }]));
}
