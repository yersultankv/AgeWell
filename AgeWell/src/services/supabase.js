import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export const isConfigured = !SUPABASE_URL.includes('YOUR_PROJECT') && !SUPABASE_ANON_KEY.includes('YOUR_ANON');

// Сессия (JWT) AsyncStorage-та сақталады, ал деректердің өзі Supabase PostgreSQL-де тұрады.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

export function authErrorText(error) {
  const m = (error?.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'Email немесе құпиясөз қате';
  if (m.includes('not confirmed')) return 'Поштаңызды растаңыз (хатты тексеріңіз)';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Бұл email тіркелген';
  if (m.includes('network') || m.includes('fetch')) return 'Интернет байланысы жоқ';
  if (m.includes('rate limit')) return 'Тым көп әрекет. Біраз күтіңіз';
  if (m.includes('password')) return 'Құпиясөз тым қарапайым (кемінде 6 таңба)';
  return error?.message || 'Қате орын алды';
}
