import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Input from '../components/Input';
import { useApp } from '../context/AppContext';
import { getSecret } from '../services/secure';
import { verifyTotp, sha256 } from '../services/totp';

// 2-фактор: Authenticator қосымшасындағы 6 таңбалы код (немесе 8 таңбалы резервтік код)
export default function TwoFactorVerifyScreen({ navigation, route }) {
  const { email } = route.params;
  const { colors: c, completeLogin, getUserByEmail, updateUser, showToast } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const submit = async () => {
    const v = code.replace(/\s/g, '');
    if (!/^\d{6}$|^\d{8}$/.test(v)) return setError('6 таңбалы код (немесе 8 таңбалы резервтік код) енгізіңіз');
    if (attempts >= 5) return setError('Тым көп әрекет. Артқа қайтып, қайта кіріңіз');
    setLoading(true);
    try {
      const user = getUserByEmail(email);
      let ok = false;
      if (v.length === 6) {
        const secret = await getSecret('aw_totp_' + email);
        ok = !!secret && verifyTotp(secret, v);
      } else {
        const h = await sha256('backup:' + v);
        const list = user?.twoFA?.backup || [];
        if (list.includes(h)) {
          ok = true;
          await updateUser({ twoFA: { ...user.twoFA, backup: list.filter((x) => x !== h) } }, email); // бір реттік код
          showToast(`Резервтік код қолданылды. Қалғаны: ${list.length - 1}`);
        }
      }
      if (!ok) { setAttempts((a) => a + 1); return setError('Код қате немесе мерзімі өтті'); }
      await completeLogin(email);
      navigation.reset({ index: 0, routes: [{ name: 'Splash', params: { skipLock: true } }] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Екі сатылы растау" onBack={() => navigation.goBack()} footer={<Button title="Растау" onPress={submit} loading={loading} />}>
      <View style={{ alignItems: 'center', marginVertical: 24 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="shield-checkmark" size={44} color={c.primary} />
        </View>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>Authenticator кодын енгізіңіз</Text>
        <Text style={{ color: c.sub, textAlign: 'center', marginTop: 6 }}>Google Authenticator (немесе ұқсас қосымша) ашып, AgeWell үшін көрсетілген 6 таңбалы кодты жазыңыз.</Text>
      </View>
      <Input label="Растау коды" icon="keypad-outline" keyboardType="number-pad" value={code} onChangeText={(t) => { setCode(t); setError(null); }} error={error} placeholder="123456" maxLength={8} />
      <Text style={{ color: c.sub, fontSize: 12 }}>Телефонға қолжетімсіз болса, 8 таңбалы резервтік кодты қолдануға болады.</Text>
    </Screen>
  );
}
