import React, { useEffect, useState } from 'react';
import { View, Text, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import FormModal from '../components/FormModal';
import { useApp } from '../context/AppContext';
import { biometricInfo, authenticate } from '../services/biometric';
import { getSecret, deleteSecret } from '../services/secure';
import { verifyTotp } from '../services/totp';

export default function SecurityScreen({ navigation }) {
  const { colors: c, user, settings, setSettingsMany, updateUser, changePassword, showToast } = useApp();
  const [bio, setBio] = useState({ available: false, label: 'Face ID' });
  const [offModal, setOffModal] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [code, setCode] = useState('');
  const [codeErr, setCodeErr] = useState(null);
  const [pw, setPw] = useState({ old: '', n1: '', n2: '' });
  const [pwErr, setPwErr] = useState({});

  useEffect(() => { biometricInfo().then(setBio); }, []);
  const twoFA = !!user?.twoFA?.enabled;

  const toggleBio = async (v) => {
    if (v) {
      if (!bio.available) return showToast('Құрылғыда Face ID/саусақ ізі бапталмаған', 'error');
      if (!(await authenticate(`${bio.label} қосуды растаңыз`))) return showToast('Тану сәтсіз аяқталды', 'error');
      await setSettingsMany({ biometric: true, bioUser: user.email });
      showToast(`${bio.label} қосылды`);
    } else {
      await setSettingsMany({ biometric: false, bioUser: null });
    }
  };

  const disable2FA = async () => {
    const secret = await getSecret('aw_totp_' + user.email);
    if (!secret || !verifyTotp(secret, code.trim())) return setCodeErr('Код қате');
    await deleteSecret('aw_totp_' + user.email);
    await updateUser({ twoFA: { enabled: false, backup: [] } });
    setOffModal(false); setCode(''); setCodeErr(null);
    showToast('2FA өшірілді');
  };

  const savePw = async () => {
    const e = {};
    if (!pw.old) e.old = 'Ағымдағы құпиясөзді енгізіңіз';
    if (pw.n1.length < 6) e.n1 = 'Кемінде 6 таңба';
    if (pw.n1 !== pw.n2) e.n2 = 'Құпиясөздер сәйкес емес';
    setPwErr(e);
    if (Object.keys(e).length) return;
    const r = await changePassword(pw.old, pw.n1);
    if (!r.ok) return setPwErr({ old: r.error });
    setPwModal(false); setPw({ old: '', n1: '', n2: '' });
    showToast('Құпиясөз өзгертілді');
  };

  const Factor = ({ n, icon, title, text, on, right }) => (
    <Card style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: on ? c.tint : c.divider, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={24} color={on ? c.primary : c.sub} />
      </View>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text style={{ color: c.text, fontWeight: '700' }}>{n}-фактор: {title}</Text>
        <Text style={{ color: c.sub, fontSize: 12, marginTop: 2 }}>{text}</Text>
      </View>
      {right}
    </Card>
  );

  const level = 1 + (twoFA ? 1 : 0) + (settings.biometric ? 1 : 0);
  return (
    <Screen title="Қауіпсіздік" onBack={() => navigation.goBack()}>
      <Card style={{ marginBottom: 16, backgroundColor: level === 3 ? c.success : level === 2 ? c.primary : c.warning }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>Қорғаныс деңгейі: {level}/3</Text>
        <Text style={{ color: '#fff', opacity: 0.9, marginTop: 4 }}>{level === 3 ? 'Барлық факторлар қосулы' : 'Қосымша факторларды қосып, аккаунтты күшейтіңіз'}</Text>
      </Card>
      <Factor n={1} icon="key-outline" title="Құпиясөз" text="Хэштелген (SHA-256 + salt) түрде сақталады" on right={<Ionicons name="checkmark-circle" size={22} color={c.success} />} />
      <Factor n={2} icon="phone-portrait-outline" title="Authenticator (TOTP)" text="6 таңбалы код әр 30 секунд сайын өзгереді" on={twoFA}
        right={<Switch value={twoFA} trackColor={{ true: c.primary }} onValueChange={(v) => (v ? navigation.navigate('TwoFactorSetup') : setOffModal(true))} />} />
      <Factor n={3} icon="scan-outline" title={bio.label} text={bio.available ? 'Қосымшаны ашу кезінде биометриялық растау' : 'Бұл құрылғыда қолжетімсіз'} on={settings.biometric}
        right={<Switch value={settings.biometric} trackColor={{ true: c.primary }} onValueChange={toggleBio} />} />
      <Text style={{ color: c.sub, fontSize: 12, marginBottom: 16 }}>Ескерту: iOS-тағы Expo Go ішінде Face ID орнына құрылғы PIN-коды сұралады. Нақты Face ID development build-те жұмыс істейді.</Text>
      <Button title="Құпиясөзді өзгерту" variant="secondary" onPress={() => setPwModal(true)} />

      <FormModal visible={offModal} title="2FA өшіру" onClose={() => { setOffModal(false); setCode(''); setCodeErr(null); }} onSave={disable2FA} saveLabel="Өшіру">
        <Text style={{ color: c.sub, marginBottom: 12 }}>Растау үшін Authenticator-дағы ағымдағы кодты енгізіңіз.</Text>
        <Input label="6 таңбалы код" keyboardType="number-pad" maxLength={6} value={code} onChangeText={(t) => { setCode(t); setCodeErr(null); }} error={codeErr} />
      </FormModal>
      <FormModal visible={pwModal} title="Құпиясөзді өзгерту" onClose={() => setPwModal(false)} onSave={savePw}>
        <Input label="Ағымдағы құпиясөз" secure value={pw.old} onChangeText={(t) => setPw({ ...pw, old: t })} error={pwErr.old} />
        <Input label="Жаңа құпиясөз" secure value={pw.n1} onChangeText={(t) => setPw({ ...pw, n1: t })} error={pwErr.n1} />
        <Input label="Жаңа құпиясөзді қайталаңыз" secure value={pw.n2} onChangeText={(t) => setPw({ ...pw, n2: t })} error={pwErr.n2} />
      </FormModal>
    </Screen>
  );
}
