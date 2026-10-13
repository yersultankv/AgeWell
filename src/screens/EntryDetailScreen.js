import React from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import { longDate } from '../utils/date';

const ROWS = [
  { key: 'pulse', icon: 'heart-outline', label: 'Пульс', unit: 'соққы/мин' },
  { key: 'steps', icon: 'footsteps-outline', label: 'Қадам', unit: '' },
  { key: 'sleep', icon: 'moon-outline', label: 'Ұйқы', unit: 'сағ' },
  { key: 'water', icon: 'water-outline', label: 'Су', unit: 'стақан' },
  { key: 'weight', icon: 'barbell-outline', label: 'Салмақ', unit: 'кг' },
];
const MOODS = ['', '😞', '😕', '😐', '🙂', '😄'];

export default function EntryDetailScreen({ navigation, route }) {
  const { colors: c, entries, deleteEntry, showToast } = useApp();
  const entry = entries.find((e) => e.id === route.params.entryId);
  if (!entry) return <Screen title="Жазба" onBack={() => navigation.goBack()}><Text style={{ color: c.sub }}>Жазба табылмады</Text></Screen>;

  const remove = () =>
    Alert.alert('Жазбаны жою керек пе?', 'Бұл әрекетті қайтару мүмкін емес.', [
      { text: 'Бас тарту', style: 'cancel' },
      { text: 'Жою', style: 'destructive', onPress: async () => { await deleteEntry(entry.id); showToast('Жазба жойылды'); navigation.goBack(); } },
    ]);

  const Row = ({ icon, label, value }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.divider }}>
      <Ionicons name={icon} size={22} color={c.primary} />
      <Text style={{ flex: 1, marginLeft: 12, color: c.sub }}>{label}</Text>
      <Text style={{ color: c.text, fontWeight: '700' }}>{value}</Text>
    </View>
  );

  return (
    <Screen
      title="Жазба мәліметі"
      onBack={() => navigation.goBack()}
      footer={
        <View style={{ flexDirection: 'row' }}>
          <Button title="Жою" variant="danger" onPress={remove} style={{ flex: 1, marginRight: 10 }} />
          <Button title="Өзгерту" onPress={() => navigation.navigate('AddEntry', { entryId: entry.id })} style={{ flex: 1 }} />
        </View>
      }
    >
      <Text style={{ fontSize: 24, fontWeight: '800', color: c.text, marginBottom: 16 }}>{longDate(entry.date)}</Text>
      <Card>
        {entry.sys ? <Row icon="pulse-outline" label="Қан қысымы" value={`${entry.sys}/${entry.dia} мм рт.ст.`} /> : null}
        {ROWS.filter((r) => entry[r.key] !== null && entry[r.key] !== undefined).map((r) => (
          <Row key={r.key} icon={r.icon} label={r.label} value={`${entry[r.key]} ${r.unit}`.trim()} />
        ))}
        {entry.mood ? <Row icon="happy-outline" label="Көңіл-күй" value={MOODS[entry.mood]} /> : null}
      </Card>
      {entry.note ? (
        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: c.sub, marginBottom: 6, fontWeight: '600' }}>Ескертпе</Text>
          <Text style={{ color: c.text, lineHeight: 22 }}>{entry.note}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
