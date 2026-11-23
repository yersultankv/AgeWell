import { computeScore } from './scoreService';

// Диплом ML моделі API ретінде дайын болғанда осы жерге URL жазыңыз.
// Күтілетін жауап: { score, bioAge, factors:[{key,label,impact}], tips:[string] }
export const API_URL = null; // мысалы: 'https://your-server.kz/predict'

export async function predict(profile, entries) {
  if (API_URL) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, entries: entries.slice(0, 30) }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return { ...computeScore(profile, entries), ...data };
    } catch (e) {
      console.warn('API қатесі, жергілікті модель қолданылады', e);
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  return computeScore(profile, entries);
}
