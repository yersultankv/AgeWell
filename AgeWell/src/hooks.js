import { useMemo, useEffect, useState } from 'react';
import { useApp } from './context/AppContext';
import { computeScore } from './services/scoreService';

// Профиль мен жазбалар бойынша индексті қайта есептейтін custom hook
export function usePrediction() {
  const { profile, entries } = useApp();
  return useMemo(() => computeScore(profile, entries.slice(0, 14)), [profile, entries]);
}

// Форма өрістерін басқаратын custom hook
export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (key) => (val) => {
    setValues((v) => ({ ...v, [key]: val }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };
  return { values, setValues, errors, setErrors, set };
}

export function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// Дәрілер: ескертумен бірге қосу/өшіру/жою
import { scheduleDaily, cancelNotification } from './services/notifications';

export function useMedActions() {
  const { addMed, updateMed, deleteMed } = useApp();
  const schedule = (m) => scheduleDaily('med-' + m.id, 'Дәрі қабылдау уақыты 💊', `${m.name}${m.dose ? ' · ' + m.dose : ''}`, m.time);
  return {
    addMedWithReminder: async (data) => {
      const m = await addMed(data);
      await schedule(m);
      return m;
    },
    editMed: async (m, data) => {
      await updateMed(m.id, data);
      if (m.active) await schedule({ ...m, ...data });
    },
    toggleMed: async (m) => {
      await updateMed(m.id, { active: !m.active });
      if (m.active) await cancelNotification('med-' + m.id); else await schedule(m);
    },
    removeMed: async (m) => {
      await cancelNotification('med-' + m.id);
      await deleteMed(m.id);
    },
  };
}
