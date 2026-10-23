export const money = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
};
export const initials = (name) => {
  return (name || 'Administrator')
    .split(' ').map((part) => {
      return part[0];
    }).slice(0, 2).join('').toUpperCase();
};
