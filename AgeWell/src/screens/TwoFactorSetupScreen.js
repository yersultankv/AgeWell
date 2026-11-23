import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useApp } from '../context/AppContext';
import { setSecret } from '../services/secure';
import { generateSecret, otpauthUri, verifyTotp, generateBackupCodes, sha256 } from '../services/totp';

export default function TwoFactorSetupScreen({ navigation }) {
  const { colors: c, user, updateUser, showToast } = useApp();
  const secret = useMemo(() => generateSecret(), []);
  const uri = useMemo(() => otpauthUri(secret, user.email), [secret]);
  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [backup, setBackup] = useState([]);
  const [loading, setLoading] = useState(false);

  const grouped = secret.match(/.{1,4}/g).join(' ');
  const copy = async (text, msg) => { await Clipboard.setStringAsync(text); showToast(msg); };
  const openAuth = async () => {
    try { await Linking.openURL(uri); } catch (e) { showToast('Authenticator қосымшасы табылмады. Кілтті қолмен енгізіңіз', 'error'); }
  };

  const confirm = async () => {
    if (!verifyTotp(secret, code.trim())) return setError('Код қате. Authenticator-дағы ағымдағы кодты енгізіңіз');
    setLoading(true);
    try {
      const codes = generateBackupCodes(8);
      const hashes = await Promise.all(codes.map((x) => sha256('backup:' + x)));
      const ok = await setSecret('aw_totp_' + user.email, secret);
      if (!ok) { setError('Құпия кілт сақталмады. Қайта көріңіз'); return; }
      await updateUser({ twoFA: { enabled: true, backup: hashes } });
      setBackup(codes);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="2FA қосу"
      onBack={step === 1 ? () => navigation.goBack() : undefined}
      footer={step === 1 ? <Button title="Растау және қосу" onPress={confirm} loading={loading} /> : <Button title="Дайын" onPress={() => { showToast('Екі сатылы растау қосылды'); navigation.goBack(); }} />}
    >
      {step === 1 ? (
        <>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 16, marginBottom: 6 }}>1. Authenticator-ға тіркеңіз</Text>
          <Text style={{ color: c.sub, marginBottom: 14 }}>Басқа құрылғыдағы Google Authenticator арқылы QR-ды сканерлеңіз. Егер осы телефонда болсаңыз, төмендегі батырманы басыңыз немесе кілтті қолмен енгізіңіз.</Text>
          <Card style={{ alignItems: 'center', marginBottom: 14 }}>
            <View style={{ padding: 10, backgroundColor: '#fff', borderRadius: 12 }}><QRCode value={uri} size={170} /></View>
            <Text selectable style={{ color: c.text, fontWeight: '800', letterSpacing: 1, marginTop: 14, textAlign: 'center' }}>{grouped}</Text>
            <TouchableOpacity onPress={() => copy(secret, 'Кілт көшірілді')} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Ionicons name="copy-outline" size={18} color={c.primary} /><Text style={{ color: c.primary, fontWeight: '700', marginLeft: 6 }}>Кілтті көшіру</Text>
            </TouchableOpacity>
          </Card>
          <Button title="Authenticator қосымшасын ашу" variant="secondary" small onPress={openAuth} style={{ marginBottom: 20 }} />
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>2. Кодты енгізіңіз</Text>
          <Input label="6 таңбалы код" icon="keypad-outline" keyboardType="number-pad" maxLength={6} value={code} onChangeText={(t) => { setCode(t); setError(null); }} error={error} placeholder="123456" />
        </>
      ) : (
        <>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="checkmark-circle" size={64} color={c.success} />
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', marginTop: 8 }}>2FA қосылды</Text>
          </View>
          <Text style={{ color: c.sub, marginBottom: 12 }}>Резервтік кодтарды қауіпсіз жерге сақтаңыз. Әрқайсысы бір рет қана қолданылады. Бұл кодтар қайта көрсетілмейді.</Text>
          <Card>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {backup.map((b) => (
                <Text key={b} selectable style={{ width: '50%', color: c.text, fontWeight: '800', fontSize: 18, paddingVertical: 6, letterSpacing: 1 }}>{b}</Text>
              ))}
            </View>
          </Card>
          <Button title="Кодтарды көшіру" variant="secondary" small onPress={() => copy(backup.join('\n'), 'Кодтар көшірілді')} style={{ marginTop: 14 }} />
        </>
      )}
    </Screen>
  );
}
