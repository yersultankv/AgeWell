export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim());
export const isTime = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v || '');
export const isPhone = (v) => /^\+?[0-9]{10,15}$/.test((v || '').replace(/[\s()-]/g, ''));

// Бос емес өріс үшін диапазонды тексереді. Бос болса — null (міндетті емес өріс).
export function rangeError(value, min, max, label = 'Мән') {
  if (value === '' || value === undefined || value === null) return null;
  const n = Number(String(value).replace(',', '.'));
  if (Number.isNaN(n)) return 'Сан енгізіңіз';
  if (n < min || n > max) return `${label} ${min}–${max} аралығында болуы керек`;
  return null;
}
export function requiredRange(value, min, max, label) {
  if (value === '' || value === undefined || value === null) return 'Өрісті толтырыңыз';
  return rangeError(value, min, max, label);
}
export const num = (v) => (v === '' || v === undefined || v === null ? null : Number(String(v).replace(',', '.')));
