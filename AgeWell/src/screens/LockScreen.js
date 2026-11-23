import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import { authenticate, biometricInfo } from '../services/biometric';

// 3-фактор: қосымшаны ашқанда биометриялық растау (Face ID / саусақ ізі)
export default function LockScreen({ navigation }) {
  const { colors: c, user, logout } = useApp();
  const [label, setLabel] = useState('Face ID');
  const [busy, setBusy] = useState(false);

  const unlock = useCallback(async () => {
    setBusy(true);
    const ok = await authenticate('AgeWell қосымшасын ашу');
    setBusy(false);
    if (ok) navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }, []);

  useEffect(() => { biometricInfo().then((i) => setLabel(i.label)); unlock(); }, []);

  const other = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="lock-closed" size={56} color={c.primary} />
        </View>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: '800', marginTop: 24 }}>Сәлем, {user?.name?.split(' ')[0]}</Text>
        <Text style={{ color: c.sub, marginTop: 8, textAlign: 'center' }}>Қосымша қорғалған. Ашу үшін {label} қолданыңыз.</Text>
        <Button title={`${label} арқылы ашу`} onPress={unlock} loading={busy} style={{ marginTop: 32, alignSelf: 'stretch' }} />
        <Button title="Құпиясөзбен кіру" variant="text" onPress={other} style={{ marginTop: 8 }} />
      </View>
    </Screen>
  );
}
