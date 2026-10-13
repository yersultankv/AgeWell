const MONTHS = ['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'];
const pad = (n) => String(n).padStart(2, '0');

export const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toStr(new Date());

export function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const daysBetween = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);
export const shortDate = (s) => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const longDate = (s) => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
export function groupLabel(s) {
  const diff = daysBetween(todayStr(), s);
  if (diff === 0) return 'Бүгін';
  if (diff === 1) return 'Кеше';
  return shortDate(s);
}
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
