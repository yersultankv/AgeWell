import * as LocalAuthentication from 'expo-local-authentication';

// iOS-та Face ID/Touch ID, Android-та саусақ ізі/бет арқылы тану.
// ЕСКЕРТУ: Expo Go (iOS) ішінде Face ID жұмыс істемейді — құрылғы PIN-кодына түседі.
// Нақты Face ID үшін development build немесе Android APK қажет.
export async function biometricInfo() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
    const types = hasHardware ? await LocalAuthentication.supportedAuthenticationTypesAsync() : [];
    const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    return { available: hasHardware && enrolled, hasHardware, enrolled, label: face ? 'Face ID' : 'Биометрия' };
  } catch (e) {
    return { available: false, hasHardware: false, enrolled: false, label: 'Биометрия' };
  }
}

export async function authenticate(message = 'Жеке басыңызды растаңыз') {
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: message,
      cancelLabel: 'Бас тарту',
      fallbackLabel: 'PIN-код',
    });
    return !!r.success;
  } catch (e) {
    return false;
  }
}
