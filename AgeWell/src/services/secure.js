import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Құпия деректер (TOTP құпия кілті, OpenAI API кілті) iOS Keychain / Android Keystore-да шифрланып сақталады.
// Веб-превьюде SecureStore жоқ, сондықтан AsyncStorage-қа түседі.
const clean = (k) => String(k).replace(/[^A-Za-z0-9._-]/g, '_');

export async function setSecret(key, value) {
  const k = clean(key);
  try {
    if (Platform.OS === 'web') await AsyncStorage.setItem('sec_' + k, value);
    else await SecureStore.setItemAsync(k, value);
    return true;
  } catch (e) {
    console.warn('Secure set error', e);
    return false;
  }
}
export async function getSecret(key) {
  const k = clean(key);
  try {
    if (Platform.OS === 'web') return await AsyncStorage.getItem('sec_' + k);
    return await SecureStore.getItemAsync(k);
  } catch (e) {
    return null;
  }
}
export async function deleteSecret(key) {
  const k = clean(key);
  try {
    if (Platform.OS === 'web') await AsyncStorage.removeItem('sec_' + k);
    else await SecureStore.deleteItemAsync(k);
  } catch (e) {}
}
