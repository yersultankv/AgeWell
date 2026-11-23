import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, Share } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Chip from '../components/Chip';
import Avatar from '../components/Avatar';
import { useApp } from '../context/AppContext';
import { isTime } from '../utils/validators';
import { scheduleDaily, cancelNotification } from '../services/notifications';
import { ask } from '../ai/openai';

const CHAT_MODELS = ['gpt-5.5', 'gpt-6-luna', 'gpt-5.4-mini'];
const IMAGE_MODELS = ['gpt-image-2.6-flare', 'gpt-image-2.6-sunburst', 'gpt-image-2'];

export default function SettingsScreen({ navigation }) {
  const { colors: c, user, entries, settings, setSetting, setSettingsMany, apiKey, setApiKey, updateUser, logout, clearMyEntries, showToast } = useApp();
  const [time, setTime] = useState(settings.time);
  const [timeErr, setTimeErr] = useState(null);
  const [key, setKey] = useState('');
  const [testing, setTesting] = useState(false);

  const checkin = (on, t) =>
    on ? scheduleDaily('checkin', 'AgeWell', 'Бүгінгі көрсеткіштеріңді жазуды ұмытпа 🌿', t) : cancelNotification('checkin');

  const toggleNotify = async (v) => {
    await setSetting('notify', v);
    const ok = await checkin(v, settings.time);
    if (v && !ok) showToast('Ескерту рұқсаты берілмеді', 'error');
  };
  const saveTime = async () => {
    if (!isTime(time)) return setTimeErr('Уақытты СС:ММ форматында енгізіңіз (мысалы, 20:00)');
    setTimeErr(null);
    await setSetting('time', time);
    await checkin(settings.notify, time);
    showToast('Ескерту уақыты сақталды');
  };

  const pickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert('Рұқсат қажет', 'Галереяға рұқсат беріңіз.');
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.2, base64: true });
      if (r.canceled || !r.assets?.[0]?.base64) return;
      await updateUser({ avatar: `data:image/jpeg;base64,${r.assets[0].base64}` });
      showToast('Профиль суреті жаңартылды');
    } catch (e) { showToast('Суретті таңдау мүмкін болмады', 'error'); }
  };

  const saveKey = async () => {
    const k = key.trim();
    if (!k) return;
    if (!k.startsWith('sk-')) return showToast('OpenAI кілті sk- деп басталуы керек', 'error');
    await setApiKey(k); setKey('');
    showToast('API кілті қауіпсіз жерде сақталды');
  };
  const test = async () => {
    setTesting(true);
    try { await ask(apiKey, settings.chatModel, 'Тек "ОК" деп жауап бер.'); showToast('Байланыс жұмыс істейді ✅'); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setTesting(false); }
  };

  const exportCsv = async () => {
    if (!entries.length) return showToast('Экспорттайтын жазбалар жоқ', 'error');
    const head = 'date,sys,dia,pulse,steps,sleep,water,weight,mood,note';
    const rows = entries.map((e) =>
      [e.date, e.sys, e.dia, e.pulse, e.steps, e.sleep, e.water, e.weight, e.mood, `"${(e.note || '').replace(/"/g, '""')}"`].map((v) => (v === null || v === undefined ? '' : v)).join(',')
    );
    try { await Share.share({ message: [head, ...rows].join('\n') }); } catch (e) { showToast('Экспорт орындалмады', 'error'); }
  };
  const wipe = () =>
    Alert.alert('Барлық деректерді өшіру', 'Барлық жазбаларыңыз өшіріледі. Әрекетті қайтару мүмкін емес.', [
      { text: 'Бас тарту', style: 'cancel' },
      { text: 'Өшіру', style: 'destructive', onPress: async () => { await clearMyEntries(); showToast('Деректер өшірілді'); } },
    ]);
  const doLogout = async () => { await logout(); navigation.reset({ index: 0, routes: [{ name: 'Auth' }] }); };

  const Group = ({ title, children }) => (
    <>
      <Text style={{ color: c.sub, fontWeight: '700', marginTop: 20, marginBottom: 8 }}>{title}</Text>
      <Card style={{ paddingVertical: 4 }}>{children}</Card>
    </>
  );
  const Row = ({ icon, label, right, onPress, color }) => (
    <TouchableOpacity disabled={!onPress} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
      <Ionicons name={icon} size={22} color={color || c.primary} />
      <Text style={{ flex: 1, marginLeft: 12, color: color || c.text, fontWeight: '600' }}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
  const chev = <Ionicons name="chevron-forward" size={18} color={c.sub} />;

  return (
    <Screen title="Баптаулар" onBack={() => navigation.goBack()}>
      <Card style={{ alignItems: 'center' }}>
        <TouchableOpacity onPress={pickAvatar}>
          <Avatar size={72} />
          <View style={{ position: 'absolute', right: -2, bottom: -2, backgroundColor: c.surface, borderRadius: 12, padding: 4 }}>
            <Ionicons name="camera" size={16} color={c.primary} />
          </View>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: c.text, marginTop: 10 }}>{user?.name}</Text>
        <Text style={{ color: c.sub }}>{user?.email}</Text>
        <Button title="Профильді өзгерту" variant="secondary" small onPress={() => navigation.navigate('ProfileSetup', { edit: true })} style={{ marginTop: 12 }} />
      </Card>

      <Group title="Жалпы">
        <Row icon="moon-outline" label="Қараңғы тақырып" right={<Switch value={settings.dark} onValueChange={(v) => setSetting('dark', v)} trackColor={{ true: c.primary }} />} />
        <Row icon="notifications-outline" label="Күнделікті ескерту" right={<Switch value={settings.notify} onValueChange={toggleNotify} trackColor={{ true: c.primary }} />} />
        {settings.notify && (
          <View style={{ paddingBottom: 8 }}>
            <Input label="Ескерту уақыты" value={time} onChangeText={setTime} onEndEditing={saveTime} error={timeErr} keyboardType="numbers-and-punctuation" placeholder="20:00" />
          </View>
        )}
        <Row icon="shield-checkmark-outline" label="Қауіпсіздік (2FA, Face ID)" onPress={() => navigation.navigate('Security')} right={chev} />
      </Group>

      <Group title="AI (OpenAI)">
        <View style={{ paddingTop: 12 }}>
          <Text style={{ color: c.sub, fontSize: 12, marginBottom: 8 }}>
            {apiKey ? 'API кілті сақталған ✅ (құрылғының қауіпсіз қоймасында)' : 'API кілті енгізілмеген'}
          </Text>
          <Input label="OpenAI API кілті" icon="key-outline" secure value={key} onChangeText={setKey} placeholder="sk-..." />
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <Button title="Сақтау" small onPress={saveKey} disabled={!key.trim()} style={{ flex: 1, marginRight: 8 }} />
            <Button title="Тексеру" small variant="secondary" onPress={test} loading={testing} disabled={!apiKey} style={{ flex: 1, marginRight: apiKey ? 8 : 0 }} />
            {apiKey ? <Button title="Өшіру" small variant="danger" onPress={async () => { await setApiKey(''); showToast('Кілт өшірілді'); }} style={{ flex: 1 }} /> : null}
          </View>
          <Text style={{ color: c.text, fontWeight: '600', marginBottom: 6 }}>Чат моделі</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {CHAT_MODELS.map((m) => <Chip key={m} label={m} selected={settings.chatModel === m} onPress={() => setSetting('chatModel', m)} />)}
          </View>
          <Text style={{ color: c.text, fontWeight: '600', marginVertical: 6 }}>Сурет моделі</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
            {IMAGE_MODELS.map((m) => <Chip key={m} label={m} selected={settings.imageModel === m} onPress={() => setSetting('imageModel', m)} />)}
          </View>
        </View>
      </Group>

      <Group title="Деректер">
        <Row icon="download-outline" label="Деректерді экспорттау (CSV)" onPress={exportCsv} right={chev} />
        <Row icon="cloud-upload-outline" label="Резервтік көшірме (JSON)" onPress={() => navigation.navigate('Backup')} right={chev} />
        <Row icon="trash-outline" label="Барлық жазбаларды өшіру" onPress={wipe} color={c.error} />
      </Group>

      <Group title="Қосымша туралы">
        <Row icon="information-circle-outline" label="Нұсқа" right={<Text style={{ color: c.sub }}>2.0.0</Text>} />
      </Group>

      <Button title="Шығу" variant="danger" onPress={doLogout} style={{ marginTop: 24 }} />
    </Screen>
  );
}
