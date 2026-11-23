import AsyncStorage from '@react-native-async-storage/async-storage';

// Барлық операциялар асинхронды (async/await): құрылғы жадына оқу/жазу UI-ды бұғаттамайды.
export async function load(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
export async function save(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage error', e);
  }
}
export const KEYS = {
  users: 'aw_users', session: 'aw_session', profiles: 'aw_profiles', entries: 'aw_entries',
  settings: 'aw_settings', goals: 'aw_goals', meds: 'aw_meds', chats: 'aw_chats', tips: 'aw_tips',
};
