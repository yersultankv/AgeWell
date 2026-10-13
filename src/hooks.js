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
