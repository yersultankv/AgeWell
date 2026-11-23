import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as Crypto from 'expo-crypto';
import { load, save, KEYS } from '../services/storage';
import { getSecret, setSecret, deleteSecret } from '../services/secure';
import { supabase, authErrorText } from '../services/supabase';
import { light, dark } from '../theme';
import { uid } from '../utils/date';
import { initNotifications } from '../services/notifications';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export const DEFAULT_SETTINGS = {
  dark: false, notify: true, time: '20:00',
  biometric: false, bioUser: null,
  chatModel: 'gpt-5.5', imageModel: 'gpt-image-2.6-flare',
};
const API_KEY_SECRET = 'aw_openai_key';
const PENDING_2FA = 'aw_pending2fa';

// Кесте қатары <-> қолданбадағы нысан
const fromRow = (r) => ({ ...r, owner: r.user_id, createdAt: r.created_at ? Date.parse(r.created_at) : Date.now() });
const toRow = ({ owner, createdAt, ...rest }, userId) => ({ ...rest, user_id: userId });
const mapUser = (row, authUser) => ({
  id: row.id, email: row.email || authUser?.email, name: row.name || authUser?.user_metadata?.name || '',
  avatar: row.avatar || null,
  twoFA: row.twofa || { enabled: false, backup: [] },
  emergency: row.emergency || { name: '', phone: '' },
});

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [goals, setGoals] = useState([]);
  const [meds, setMeds] = useState([]);
  const [chat, setChat] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [apiKey, setApiKeyState] = useState('');
  const [toast, setToast] = useState(null);

  // Ref-тер — ең жаңа мәндер (AI агент бірнеше әрекетті қатар орындағанда ескірген state болмауы үшін)
  const R = useRef({ userId: null, user: null, profile: null, entries: [], goals: [], meds: [], chat: [], settings: DEFAULT_SETTINGS });
  const pending = useRef(null); // 2FA күтіп тұрған кіру

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type, id: uid() }), []);
  const setters = { entries: setEntries, goals: setGoals, meds: setMeds, chat: setChat };
  const setLocal = (name, fn) => { const next = fn(R.current[name]); R.current[name] = next; setters[name](next); return next; };

  // ---------- Серверден жүктеу ----------
  const fetchProfileRow = async (authUser) => {
    let { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    if (error) throw error;
    if (!data) {
      const seed = { id: authUser.id, email: authUser.email, name: authUser.user_metadata?.name || '' };
      const ins = await supabase.from('profiles').upsert(seed).select().single();
      if (ins.error) throw ins.error;
      data = ins.data;
    }
    return data;
  };

  const hydrate = async (authUser, rowIn) => {
    const row = rowIn || (await fetchProfileRow(authUser));
    const uidv = authUser.id;
    const [e, g, m, c] = await Promise.all([
      supabase.from('entries').select('*').eq('user_id', uidv).order('date', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', uidv).order('created_at', { ascending: false }),
      supabase.from('meds').select('*').eq('user_id', uidv).order('created_at', { ascending: false }),
      supabase.from('chat_messages').select('*').eq('user_id', uidv).order('created_at', { ascending: false }).limit(60),
    ]);
    const err = e.error || g.error || m.error || c.error;
    if (err) throw err;
    const u = mapUser(row, authUser);
    R.current = {
      ...R.current, userId: uidv, user: u, profile: row.health || null,
      entries: e.data.map(fromRow), goals: g.data.map(fromRow), meds: m.data.map(fromRow),
      chat: c.data.reverse().map((r) => ({ id: r.id, role: r.role, text: r.text || '', kind: r.kind || undefined, imageNote: r.image_note, ts: Date.parse(r.created_at) })),
    };
    setUser(u); setProfile(R.current.profile);
    setEntries(R.current.entries); setGoals(R.current.goals); setMeds(R.current.meds); setChat(R.current.chat);
  };

  const refreshAll = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) { try { await hydrate(data.user); } catch (e) {} }
  };

  const resetState = () => {
    R.current = { ...R.current, userId: null, user: null, profile: null, entries: [], goals: [], meds: [], chat: [] };
    setUser(null); setProfile(null); setEntries([]); setGoals([]); setMeds([]); setChat([]);
  };

  // ---------- Іске қосу ----------
  useEffect(() => {
    initNotifications();
    (async () => {
      const [st, key, pend] = await Promise.all([load(KEYS.settings, DEFAULT_SETTINGS), getSecret(API_KEY_SECRET), load(PENDING_2FA, false)]);
      const stt = { ...DEFAULT_SETTINGS, ...st };
      R.current.settings = stt; setSettings(stt); setApiKeyState(key || '');
      try {
        if (pend) { await supabase.auth.signOut(); await save(PENDING_2FA, false); } // 2FA аяқталмаған сессияны жабамыз
        const { data } = await supabase.auth.getSession();
        if (data?.session) await hydrate(data.session.user);
      } catch (e) {
        console.warn('Hydrate error', e);
      }
      setReady(true);
    })();
  }, []);

  // Серверге жазу: қате болса, хабарлап, серверден қайта жүктейміз
  const remote = async (fn) => {
    try {
      const { error } = await fn();
      if (error) throw error;
      return true;
    } catch (e) {
      showToast('Серверге сақтау сәтсіз: ' + (e.message || 'байланыс жоқ'), 'error');
      await refreshAll();
      return false;
    }
  };
  const uidNow = () => R.current.userId;

  // ---------- Auth (Supabase Auth: құпиясөз серверде хэштеледі) ----------
  const register = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { name: name.trim() } } });
    if (error) return { ok: false, error: authErrorText(error) };
    if (!data.session) return { ok: false, error: 'Поштаңызға растау хаты жіберілді. Растап, содан кейін кіріңіз' };
    try { await hydrate(data.user); } catch (e) { return { ok: false, error: authErrorText(e) }; }
    return { ok: true };
  };
  // 1-фактор: құпиясөз. 2FA қосулы болса, қолданба әлі ашылмайды: needs2FA қайтарады.
  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return { ok: false, error: authErrorText(error), field: 'password' };
    try {
      const row = await fetchProfileRow(data.user);
      if (row.twofa?.enabled) {
        pending.current = { authUser: data.user, row };
        await save(PENDING_2FA, true);
        return { ok: true, needs2FA: true, email: data.user.email };
      }
      await hydrate(data.user, row);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: authErrorText(e) };
    }
  };
  const completeLogin = async () => {
    const p = pending.current;
    if (!p) return;
    await hydrate(p.authUser, p.row);
    pending.current = null;
    await save(PENDING_2FA, false);
  };
  const logout = async () => {
    await supabase.auth.signOut();
    pending.current = null;
    resetState();
  };
  const getUserByEmail = (email) => {
    if (R.current.user?.email === email) return R.current.user;
    if (pending.current && pending.current.authUser.email === email) return mapUser(pending.current.row, pending.current.authUser);
    return null;
  };
  const updateUser = async (patch) => {
    const id = uidNow() || pending.current?.authUser.id;
    if (!id) return;
    const col = {};
    if ('twoFA' in patch) col.twofa = patch.twoFA;
    ['emergency', 'avatar', 'name'].forEach((k) => { if (k in patch) col[k] = patch[k]; });
    if (R.current.userId) {
      const next = { ...R.current.user, ...patch };
      R.current.user = next; setUser(next);
    } else if (pending.current) {
      pending.current.row = { ...pending.current.row, ...col };
    }
    await remote(() => supabase.from('profiles').update(col).eq('id', id));
  };
  const changePassword = async (oldPw, newPw) => {
    const email = R.current.user?.email;
    const chk = await supabase.auth.signInWithPassword({ email, password: oldPw });
    if (chk.error) return { ok: false, error: 'Ағымдағы құпиясөз қате' };
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) return { ok: false, error: authErrorText(error) };
    return { ok: true };
  };

  // ---------- Профиль ----------
  const saveProfile = async (p) => {
    R.current.profile = p; setProfile(p);
    await remote(() => supabase.from('profiles').update({ health: p }).eq('id', uidNow()));
  };

  // ---------- Көрсеткіштер CRUD ----------
  const addEntry = async (data) => {
    const entry = { id: Crypto.randomUUID(), owner: uidNow(), createdAt: Date.now(), ...data };
    setLocal('entries', (a) => [entry, ...a]);
    await remote(() => supabase.from('entries').insert(toRow(entry, uidNow())));
    return entry;
  };
  const updateEntry = async (id, data) => {
    setLocal('entries', (a) => a.map((e) => (e.id === id ? { ...e, ...data } : e)));
    await remote(() => supabase.from('entries').update(data).eq('id', id));
  };
  const deleteEntry = async (id) => {
    setLocal('entries', (a) => a.filter((e) => e.id !== id));
    await remote(() => supabase.from('entries').delete().eq('id', id));
  };
  const clearMyEntries = async () => {
    setLocal('entries', () => []);
    await remote(() => supabase.from('entries').delete().eq('user_id', uidNow()));
  };

  // ---------- Мақсаттар CRUD ----------
  const addGoal = async (data) => {
    const g = { id: Crypto.randomUUID(), owner: uidNow(), createdAt: Date.now(), current: 0, ...data };
    setLocal('goals', (a) => [g, ...a]);
    await remote(() => supabase.from('goals').insert(toRow(g, uidNow())));
    return g;
  };
  const updateGoal = async (id, data) => {
    setLocal('goals', (a) => a.map((g) => (g.id === id ? { ...g, ...data } : g)));
    await remote(() => supabase.from('goals').update(data).eq('id', id));
  };
  const deleteGoal = async (id) => {
    setLocal('goals', (a) => a.filter((g) => g.id !== id));
    await remote(() => supabase.from('goals').delete().eq('id', id));
  };

  // ---------- Дәрілер CRUD ----------
  const addMed = async (data) => {
    const m = { id: Crypto.randomUUID(), owner: uidNow(), createdAt: Date.now(), active: true, ...data };
    setLocal('meds', (a) => [m, ...a]);
    await remote(() => supabase.from('meds').insert(toRow(m, uidNow())));
    return m;
  };
  const updateMed = async (id, data) => {
    setLocal('meds', (a) => a.map((m) => (m.id === id ? { ...m, ...data } : m)));
    await remote(() => supabase.from('meds').update(data).eq('id', id));
  };
  const deleteMed = async (id) => {
    setLocal('meds', (a) => a.filter((m) => m.id !== id));
    await remote(() => supabase.from('meds').delete().eq('id', id));
  };

  // ---------- AI чат тарихы (суреттер серверге жүктелмейді) ----------
  const addChat = async (msgs) => {
    const full = msgs.map((m) => ({ ...m, id: m.id && m.id.length === 36 ? m.id : Crypto.randomUUID() }));
    setLocal('chat', (a) => [...a, ...full].slice(-200));
    const rows = full.map((m) => ({
      id: m.id, user_id: uidNow(), role: m.role, text: m.text || '', kind: m.kind || null,
      image_note: !!(m.image || m.imageNote), created_at: new Date(m.ts || Date.now()).toISOString(),
    }));
    await remote(() => supabase.from('chat_messages').insert(rows));
  };
  const clearChat = async () => {
    setLocal('chat', () => []);
    await remote(() => supabase.from('chat_messages').delete().eq('user_id', uidNow()));
  };

  // ---------- Баптаулар (құрылғыға тән) және құпия кілт ----------
  const setSettingsMany = async (patch) => {
    const next = { ...R.current.settings, ...patch };
    R.current.settings = next; setSettings(next);
    await save(KEYS.settings, next);
  };
  const setSetting = (key, value) => setSettingsMany({ [key]: value });
  const setApiKey = async (k) => {
    const v = (k || '').trim();
    if (v) await setSecret(API_KEY_SECRET, v); else await deleteSecret(API_KEY_SECRET);
    setApiKeyState(v);
  };

  // JSON көшірмеден қалпына келтіру
  const importData = async (payload) => {
    const owner = uidNow();
    const clean = (arr, cols) => (arr || []).map((x) => {
      const row = { id: x.id && String(x.id).length === 36 ? x.id : Crypto.randomUUID(), user_id: owner };
      cols.forEach((c) => { if (x[c] !== undefined) row[c] = x[c]; });
      return row;
    });
    const e = clean(payload.entries, ['date', 'sys', 'dia', 'pulse', 'steps', 'sleep', 'water', 'weight', 'mood', 'note']).filter((r) => r.date);
    const g = clean(payload.goals, ['type', 'title', 'target', 'unit', 'current']).filter((r) => r.title && r.target);
    const m = clean(payload.meds, ['name', 'dose', 'time', 'active']).filter((r) => r.name && r.time);
    if (e.length) { const r = await supabase.from('entries').upsert(e); if (r.error) throw r.error; }
    if (g.length) { const r = await supabase.from('goals').upsert(g); if (r.error) throw r.error; }
    if (m.length) { const r = await supabase.from('meds').upsert(m); if (r.error) throw r.error; }
    await refreshAll();
    return { entries: e.length, goals: g.length, meds: m.length };
  };

  // AI агентке арналған ең жаңа күй (ref-тен)
  const getState = () => ({
    user: R.current.user, profile: R.current.profile,
    entries: [...R.current.entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt)),
    goals: R.current.goals, meds: R.current.meds, settings: R.current.settings,
  });

  const myEntries = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt)),
    [entries]
  );

  const value = {
    ready, user, profile, entries: myEntries, goals, meds, chat,
    settings, apiKey, colors: settings.dark ? dark : light,
    toast, showToast, clearToast: () => setToast(null),
    register, login, completeLogin, logout, updateUser, changePassword, getUserByEmail, saveProfile,
    addEntry, updateEntry, deleteEntry, clearMyEntries,
    addGoal, updateGoal, deleteGoal, addMed, updateMed, deleteMed,
    addChat, clearChat, setSetting, setSettingsMany, setApiKey, importData, getState, refreshAll,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
