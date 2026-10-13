// Healthy Aging Score (0–100) — ереже негізіндегі уақытша модель.
// Диплом ML моделі дайын болғанда predictionApi.js ішіндегі API_URL арқылы ауыстырылады.

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
const pick = (entries, key) => entries.map((e) => e[key]).filter((v) => typeof v === 'number');

export const bmiOf = (h, w) => (h && w ? Math.round((w / Math.pow(h / 100, 2)) * 10) / 10 : null);

export function levelOf(score) {
  if (score >= 80) return { label: 'Өте жақсы', color: '#2BA89A' };
  if (score >= 65) return { label: 'Жақсы', color: '#7BC67E' };
  if (score >= 50) return { label: 'Орташа', color: '#F5A524' };
  return { label: 'Төмен', color: '#E5484D' };
}

export function computeScore(profile, entries = []) {
  if (!profile) return null;
  const f = [];
  const add = (key, label, impact, tip) => f.push({ key, label, impact, tip });

  const bmi = bmiOf(profile.height, profile.weight);
  if (bmi !== null) {
    if (bmi < 18.5) add('bmi', 'Дене массасы индексі', -4, 'Тамақтануды тексеріп, дәрігермен кеңесіңіз.');
    else if (bmi < 25) add('bmi', 'Дене массасы индексі', 0, null);
    else if (bmi < 30) add('bmi', 'Дене массасы индексі', -5, 'Салмақты біртіндеп азайтуға тырысыңыз.');
    else add('bmi', 'Дене массасы индексі', -10, 'Салмақты азайту жоспарын дәрігермен талқылаңыз.');
  }
  const smoke = { never: 0, former: -4, current: -14 }[profile.smoking] ?? 0;
  add('smoking', 'Темекі шегу', smoke, smoke < -10 ? 'Темекіні тастау — ең үлкен әсер беретін қадам.' : null);
  const alc = { none: 0, rare: -2, often: -8 }[profile.alcohol] ?? 0;
  add('alcohol', 'Алкоголь', alc, alc < -5 ? 'Алкогольді айтарлықтай азайтыңыз.' : null);
  const act = { low: -10, mid: -3, high: 4 }[profile.activity] ?? 0;
  add('activity', 'Дене белсенділігі', act, act < 0 ? 'Аптасына кемінде 150 минут жүріңіз немесе жаттығыңыз.' : null);

  const sleepVals = pick(entries, 'sleep');
  const sleep = sleepVals.length ? avg(sleepVals) : profile.sleep;
  let sl = 0;
  if (sleep !== undefined && sleep !== null) {
    if (sleep >= 7 && sleep <= 9) sl = 0;
    else if (sleep >= 6 && sleep <= 10) sl = -4;
    else sl = -9;
  }
  add('sleep', 'Ұйқы', sl, sl < 0 ? 'Ұйқы режимін 7–9 сағатқа келтіріңіз.' : null);

  const sys = avg(pick(entries, 'sys'));
  if (sys !== null) {
    const p = sys < 120 ? 0 : sys < 130 ? -2 : sys < 140 ? -6 : -10;
    add('bp', 'Қан қысымы', p, p < -2 ? 'Қан қысымын үнемі өлшеп, дәрігерге көрсетіңіз.' : null);
  }
  const pulse = avg(pick(entries, 'pulse'));
  if (pulse !== null) {
    const p = pulse >= 60 && pulse <= 80 ? 0 : pulse <= 90 && pulse > 80 ? -3 : -6;
    add('pulse', 'Пульс', p, p < 0 ? 'Тыныштық пульсі тұрақсыз — стресс пен кофеинді азайтыңыз.' : null);
  }
  const steps = avg(pick(entries, 'steps'));
  if (steps !== null) {
    const p = steps >= 8000 ? 4 : steps >= 5000 ? 0 : -5;
    add('steps', 'Қадам саны', p, p < 4 ? 'Күніне 8 000 қадам жасауға тырысыңыз.' : null);
  }
  const cond = (profile.conditions || []).length;
  add('conditions', 'Созылмалы факторлар', -Math.min(cond * 4, 16), cond ? 'Созылмалы жағдайларды дәрігермен бақылаңыз.' : null);

  const ageP = profile.age > 30 ? -Math.min((profile.age - 30) * 0.2, 10) : 0;
  const total = 92 + f.reduce((s, x) => s + x.impact, 0) + ageP;
  const score = Math.max(0, Math.min(100, Math.round(total)));
  const bioAge = Math.max(18, Math.round(profile.age + (75 - score) / 4));
  const tips = f.filter((x) => x.tip).sort((a, b) => a.impact - b.impact).map((x) => x.tip);
  return { score, level: levelOf(score), factors: f, bioAge, tips: tips.length ? tips : ['Өмір салтыңызды осы деңгейде ұстаңыз!'] };
}
