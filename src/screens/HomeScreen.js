import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import MetricCard from '../components/MetricCard';
import ScoreRing from '../components/ScoreRing';
import { useApp } from '../context/AppContext';
import { usePrediction } from '../hooks';
import { todayStr } from '../utils/date';

const WATER_GOAL = 8;

export default function HomeScreen({ navigation }) {
  const { colors: c, user, entries, addEntry, updateEntry } = useApp();
  const pred = usePrediction();
  const today = todayStr();
  const todayEntry = entries.find((e) => e.date === today);

  // Әр көрсеткіштің ең соңғы мәні
  const latest = (key) => {
    const e = entries.find((x) => typeof x[key] === 'number');
    return e ? e[key] : null;
  };
  const sys = latest('sys'); const dia = latest('dia');
  const sleep = latest('sleep');
  const fmt = (v, d = '—') => (v === null || v === undefined ? d : String(v));
  const water = todayEntry?.water || 0;

  const addWater = async () => {
    if (todayEntry) await updateEntry(todayEntry.id, { water: (todayEntry.water || 0) + 1 });
    else await addEntry({ date: today, water: 1 });
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: c.text }}>Сәлем, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={{ color: c.sub, marginTop: 2 }}>Бүгінгі күйің қалай?</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{user?.name?.[0]?.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: c.primaryDark, borderRadius: 24, padding: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ScoreRing score={pred?.score ?? 0} size={120} />
          <View style={{ flex: 1, marginLeft: 20 }}>
            <Text style={{ color: '#CDEDE8', fontSize: 14 }}>Салауатты қартаю индексі</Text>
            <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginTop: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{pred?.level.label}</Text>
            </View>
            <Text style={{ color: '#CDEDE8', marginTop: 8, fontSize: 13 }}>Биологиялық жас: {pred?.bioAge}</Text>
          </View>
        </View>
        <Button title="Болжамды көру" variant="secondary" onPress={() => navigation.navigate('Prediction')} style={{ marginTop: 16, backgroundColor: '#fff', borderColor: '#fff' }} />
      </View>

      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 12 }}>Соңғы көрсеткіштер</Text>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <MetricCard icon="heart-outline" color={c.error} label="Пульс" value={fmt(latest('pulse'))} unit="соққы/мин" style={{ marginRight: 12 }} />
        <MetricCard icon="pulse-outline" color={c.info} label="Қан қысымы" value={sys && dia ? `${sys}/${dia}` : '—'} />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 24 }}>
        <MetricCard icon="footsteps-outline" color={c.accent} label="Қадам" value={fmt(latest('steps'))} style={{ marginRight: 12 }} />
        <MetricCard icon="moon-outline" color={c.warning} label="Ұйқы" value={sleep !== null ? `${sleep} сағ` : '—'} />
      </View>

      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 12 }}>Су ішу</Text>
      <Card style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '700', marginBottom: 8 }}>{water} / {WATER_GOAL} стақан</Text>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: c.tint }}>
            <View style={{ width: `${Math.min(100, (water / WATER_GOAL) * 100)}%`, height: 10, borderRadius: 5, backgroundColor: c.info }} />
          </View>
        </View>
        <TouchableOpacity onPress={addWater} style={{ marginLeft: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </Card>

      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 12 }}>Ұсыныстар</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {pred?.tips.slice(0, 4).map((t, i) => (
          <Card key={i} style={{ width: 220, marginRight: 12, marginBottom: 6 }}>
            <Ionicons name="bulb-outline" size={22} color={c.warm} />
            <Text style={{ color: c.text, marginTop: 8, lineHeight: 20 }}>{t}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
