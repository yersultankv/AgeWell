import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function SplashScreen({ navigation, route }) {
  const { ready, user, profile, settings } = useApp();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      let target = 'Main';
      if (!user) target = 'Onboarding';
      else if (!profile) target = 'ProfileSetup';
      else if (settings.biometric && !route.params?.skipLock) target = 'Lock'; // 3-фактор: биометриялық құлып
      navigation.reset({ index: 0, routes: [{ name: target }] });
    }, 1200);
    return () => clearTimeout(t);
  }, [ready]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0F6B63', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <View style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="leaf" size={52} color="#2BA89A" />
      </View>
      <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 24 }}>AgeWell</Text>
      <Text style={{ color: '#CDEDE8', fontSize: 16, textAlign: 'center', marginTop: 8 }}>Салауатты қартаюды болжа және басқар</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
    </View>
  );
}
