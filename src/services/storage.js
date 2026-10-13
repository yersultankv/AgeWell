import AsyncStorage from '@react-native-async-storage/async-storage';

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
export const KEYS = { users: 'aw_users', session: 'aw_session', profiles: 'aw_profiles', entries: 'aw_entries', settings: 'aw_settings' };
