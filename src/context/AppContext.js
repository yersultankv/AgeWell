import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { load, save, KEYS } from '../services/storage';
import { light, dark } from '../theme';
import { uid } from '../utils/date';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const DEFAULT_SETTINGS = { dark: false, notify: true, time: '20:00' };

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState([]);
  const [session, setSession] = useState(null); // кірген қолданушының email-ы
  const [profiles, setProfiles] = useState({});
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [toast, setToast] = useState(null);

  // Қолданба ашылғанда деректерді жүктеу
  useEffect(() => {
    (async () => {
      const [u, s, p, e, st] = await Promise.all([
        load(KEYS.users, []), load(KEYS.session, null), load(KEYS.profiles, {}),
        load(KEYS.entries, []), load(KEYS.settings, DEFAULT_SETTINGS),
      ]);
      setUsers(u); setSession(s); setProfiles(p); setEntries(e); setSettings({ ...DEFAULT_SETTINGS, ...st });
      setReady(true);
    })();
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, id: uid() });
  }, []);

  const user = users.find((u) => u.email === session) || null;
  const profile = session ? profiles[session] || null : null;
  const myEntries = useMemo(
    () => entries.filter((e) => e.owner === session).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt)),
    [entries, session]
  );

  // ---------- Auth ----------
  const register = async ({ name, email, password }) => {
    const mail = email.trim().toLowerCase();
    if (users.some((u) => u.email === mail)) return { ok: false, error: 'Бұл email тіркелген' };
    const next = [...users, { name: name.trim(), email: mail, password }];
    setUsers(next); setSession(mail);
    await save(KEYS.users, next); await save(KEYS.session, mail);
    return { ok: true };
  };
  const login = async ({ email, password }) => {
    const mail = email.trim().toLowerCase();
    const found = users.find((u) => u.email === mail);
    if (!found) return { ok: false, error: 'Қолданушы табылмады' };
    if (found.password !== password) return { ok: false, error: 'Құпиясөз қате' };
    setSession(mail); await save(KEYS.session, mail);
    return { ok: true };
  };
  const logout = async () => { setSession(null); await save(KEYS.session, null); };

  // ---------- Profile ----------
  const saveProfile = async (p) => {
    const next = { ...profiles, [session]: p };
    setProfiles(next); await save(KEYS.profiles, next);
  };

  // ---------- Entries CRUD ----------
  const addEntry = async (data) => {
    const entry = { id: uid(), owner: session, createdAt: Date.now(), ...data };
    const next = [entry, ...entries];
    setEntries(next); await save(KEYS.entries, next);
    return entry;
  };
  const updateEntry = async (id, data) => {
    const next = entries.map((e) => (e.id === id ? { ...e, ...data } : e));
    setEntries(next); await save(KEYS.entries, next);
  };
  const deleteEntry = async (id) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next); await save(KEYS.entries, next);
  };
  const clearMyEntries = async () => {
    const next = entries.filter((e) => e.owner !== session);
    setEntries(next); await save(KEYS.entries, next);
  };

  const setSetting = async (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next); await save(KEYS.settings, next);
  };

  const value = {
    ready, user, profile, entries: myEntries, settings, colors: settings.dark ? dark : light,
    toast, showToast, clearToast: () => setToast(null),
    register, login, logout, saveProfile, addEntry, updateEntry, deleteEntry, clearMyEntries, setSetting,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
