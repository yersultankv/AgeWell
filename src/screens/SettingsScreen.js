import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useApp } from '../context/AppContext';
import { isTime } from '../utils/validators';

export default function SettingsScreen({ navigation }) {
  const { colors: c, user, entries, settings, setSetting, logout, clearMyEntries, showToast } = useApp();
  const [time, setTime] = useState(settings.time);
  const [timeErr, setTimeErr] = useState(null);

  const saveTime = () => {
    if (!isTime(time)) return setTimeErr('Уақытты СС:ММ форматында енгізіңіз (мысалы, 20:00)');
    setTimeErr(null);
    setSetting('time', time);
    showToast('Ескерту уақыты сақталды');
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

  const doLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

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

  return (
    <Screen title="Баптаулар">
      <Card style={{ alignItems: 'center' }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '800', color: c.text, marginTop: 10 }}>{user?.name}</Text>
        <Text style={{ color: c.sub }}>{user?.email}</Text>
        <Button title="Профильді өзгерту" variant="secondary" small onPress={() => navigation.navigate('ProfileSetup', { edit: true })} style={{ marginTop: 12 }} />
      </Card>

      <Group title="Жалпы">
        <Row icon="language-outline" label="Тіл" right={<Text style={{ color: c.sub }}>Қазақша</Text>} />
        <Row icon="moon-outline" label="Қараңғы тақырып" right={<Switch value={settings.dark} onValueChange={(v) => setSetting('dark', v)} trackColor={{ true: c.primary }} />} />
        <Row icon="notifications-outline" label="Ескертулер" right={<Switch value={settings.notify} onValueChange={(v) => setSetting('notify', v)} trackColor={{ true: c.primary }} />} />
        {settings.notify && (
          <View style={{ paddingBottom: 8 }}>
            <Input label="Ескерту уақыты" value={time} onChangeText={setTime} onEndEditing={saveTime} error={timeErr} keyboardType="numbers-and-punctuation" placeholder="20:00" />
          </View>
        )}
      </Group>

      <Group title="Деректер">
        <Row icon="download-outline" label="Деректерді экспорттау (CSV)" onPress={exportCsv} right={<Ionicons name="chevron-forward" size={18} color={c.sub} />} />
        <Row icon="trash-outline" label="Барлық деректерді өшіру" onPress={wipe} color={c.error} />
      </Group>

      <Group title="Қосымша туралы">
        <Row icon="information-circle-outline" label="Нұсқа" right={<Text style={{ color: c.sub }}>1.0.0</Text>} />
      </Group>

      <Button title="Шығу" variant="danger" onPress={doLogout} style={{ marginTop: 24 }} />
    </Screen>
  );
}
