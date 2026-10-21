const dateValue = (value) => {
  if (!value) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+05:30` : value);
  return Number.isNaN(date.getTime()) ? null : date;
};
export function formatDate(value) {
  const date = dateValue(value);
  if (!date) return '—';
  const parts = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('day')} ${part('month')}, ${part('year')}`;
}
export function formatDateTime(value) {
  const date = dateValue(value);
  return date ? `${formatDate(value)}, ${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' }).format(date)}` : '—';
}
