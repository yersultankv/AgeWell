import React, { useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Input from '../components/Input';
import EmptyState from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import { useDebounced } from '../hooks';
import { groupLabel, daysBetween, todayStr, longDate } from '../utils/date';

const FILTERS = [
  { id: 'all', label: 'Барлығы' }, { id: 'week', label: 'Апта' }, { id: 'month', label: 'Ай' },
  { id: 'bp', label: 'Қан қысымы' }, { id: 'pulse', label: 'Пульс' },
];
const MOODS = ['', '😞', '😕', '😐', '🙂', '😄'];

export default function HistoryScreen({ navigation }) {
  const { colors: c, entries, deleteEntry, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const q = useDebounced(query.trim().toLowerCase());

  const sections = useMemo(() => {
    const list = entries.filter((e) => {
      const age = daysBetween(todayStr(), e.date);
      if (filter === 'week' && age > 6) return false;
      if (filter === 'month' && age > 29) return false;
      if (filter === 'bp' && !e.sys) return false;
      if (filter === 'pulse' && !e.pulse) return false;
      if (q && !(`${e.date} ${longDate(e.date)} ${e.note || ''}`.toLowerCase().includes(q))) return false;
      return true;
    });
    const map = {};
    list.forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
    return Object.keys(map).sort().reverse().map((d) => ({ title: groupLabel(d), data: map[d] }));
  }, [entries, filter, q]);

  const confirmDelete = (id) =>
    Alert.alert('Жазбаны жою керек пе?', 'Бұл әрекетті қайтару мүмкін емес.', [
      { text: 'Бас тарту', style: 'cancel' },
      { text: 'Жою', style: 'destructive', onPress: async () => { await deleteEntry(id); showToast('Жазба жойылды'); } },
    ]);

  const Mini = ({ icon, text }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14 }}>
      <Ionicons name={icon} size={14} color={c.sub} />
      <Text style={{ color: c.text, fontSize: 13, marginLeft: 4, fontWeight: '600' }}>{text}</Text>
    </View>
  );

  return (
    <Screen title="Тарих" scroll={false} padded={false}>
      <View style={{ paddingHorizontal: 20 }}>
        <Input icon="search-outline" placeholder="Жазбаны іздеу" value={query} onChangeText={setQuery} style={{ marginBottom: 8 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />)}
        </View>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <EmptyState
            title="Жазбалар әлі жоқ"
            text={entries.length ? 'Сүзгіні немесе іздеуді өзгертіп көріңіз' : 'Алғашқы жазбаңызды қосыңыз'}
            action={entries.length ? undefined : 'Бірінші жазба қосу'}
            onAction={() => navigation.navigate('AddEntry')}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={{ color: c.sub, fontWeight: '700', marginTop: 12, marginBottom: 8 }}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 10, padding: 14 }}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('EntryDetail', { entryId: item.id })} onLongPress={() => confirmDelete(item.id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
                    {item.pulse ? <Mini icon="heart-outline" text={item.pulse} /> : null}
                    {item.sys ? <Mini icon="pulse-outline" text={`${item.sys}/${item.dia}`} /> : null}
                    {item.steps ? <Mini icon="footsteps-outline" text={item.steps} /> : null}
                    {item.sleep ? <Mini icon="moon-outline" text={`${item.sleep} сағ`} /> : null}
                    {item.water ? <Mini icon="water-outline" text={item.water} /> : null}
                    {!item.pulse && !item.sys && !item.steps && !item.sleep && !item.water ? <Text style={{ color: c.sub }}>{item.note || 'Жазба'}</Text> : null}
                  </View>
                </View>
                {item.mood ? <Text style={{ fontSize: 22, marginHorizontal: 8 }}>{MOODS[item.mood]}</Text> : null}
                <Ionicons name="chevron-forward" size={18} color={c.sub} />
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, borderTopWidth: 1, borderTopColor: c.divider, paddingTop: 8 }}>
              <TouchableOpacity onPress={() => navigation.navigate('AddEntry', { entryId: item.id })} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18 }}>
                <Ionicons name="create-outline" size={18} color={c.primary} /><Text style={{ color: c.primary, fontWeight: '600', marginLeft: 4 }}>Өзгерту</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(item.id)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="trash-outline" size={18} color={c.error} /><Text style={{ color: c.error, fontWeight: '600', marginLeft: 4 }}>Жою</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
