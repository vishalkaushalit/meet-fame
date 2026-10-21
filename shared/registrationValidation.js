export const REGISTRATION_CATEGORIES = [
  'Technology & AI',
  'Health & Fitness',
  'Fashion & Lifestyle',
  'Business & Finance',
  'Content Creation & Media',
  'Design & Creative',
  'Career & Leadership',
];
const text = (value) => (typeof value === 'string' ? value.trim() : '');
export function certificateError(file) {
  if (!file) return '';
  const name = file.name || file.originalname || '';
  if (
    !/\.(pdf|png|jpe?g)$/i.test(name) ||
    !['application/pdf', 'image/png', 'image/jpeg'].includes(
      file.type || file.mimetype,
    )
  )
    return 'Upload a PDF, PNG, or JPG file.';
  if (file.size > 10 * 1024 * 1024)
    return 'Certificate must be 10 MB or smaller.';
  return '';
}
export function introVideoError(file) {
  if (!file) return 'Upload an introduction video.';
  const name = file.name || file.originalname || '';
  if (!/\.(mp4|webm)$/i.test(name) ||
      !['video/mp4', 'video/webm'].includes(file.type || file.mimetype))
    return 'Upload an MP4 or WebM video.';
  if (!file.size || file.size > 5 * 1024 * 1024)
    return 'Introduction video must be non-empty and 5 MB or smaller.';
  return '';
}
export function registrationErrors(values, role = 'user') {
  const errors = {};
  const name = text(values.name),
    email = text(values.email),
    phone = text(values.phone);
  if (name.length < 2 || name.length > 80)
    errors.name = 'Enter a name between 2 and 80 characters.';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Enter a valid email address.';
  if (
    (role === 'influencer' || phone) &&
    (!/^\+?[\d\s().-]+$/.test(phone) ||
      phone.replace(/\D/g, '').length < 7 ||
      phone.replace(/\D/g, '').length > 15)
  )
    errors.phone = 'Enter a valid phone number with 7–15 digits.';
  if (
    typeof values.password !== 'string' ||
    values.password.length < 8 ||
    new TextEncoder().encode(values.password).length > 72
  )
    errors.password = 'Use at least 8 characters.';
  if (role === 'influencer') {
    if (
      text(values.specialization).length < 3 ||
      text(values.specialization).length > 120
    )
      errors.specialization = 'Enter expertise between 3 and 120 characters.';
    if (!REGISTRATION_CATEGORIES.includes(values.category))
      errors.category = 'Choose a valid category.';
    const rate = Number(values.hourlyRate);
    if (
      values.hourlyRate === '' ||
      !Number.isFinite(rate) ||
      rate < 50 ||
      rate % 10 !== 0
    )
      errors.hourlyRate = 'Enter a rate of at least $50, in increments of $10.';
    if (text(values.certificateTitle).length > 160)
      errors.certificateTitle =
        'Certificate title must be 160 characters or fewer.';
    const videoIssue = introVideoError(values.introVideoFile);
    if (videoIssue) errors.introVideoFile = videoIssue;
    const issue = certificateError(values.certificateFile);
    if (issue) errors.certificateFile = issue;
  }
  return errors;
}
export function registrationStep(field) {
  return ['name', 'email', 'phone', 'password'].includes(field)
    ? 0
    : ['specialization', 'category', 'hourlyRate'].includes(field)
      ? 1
      : 2;
}
