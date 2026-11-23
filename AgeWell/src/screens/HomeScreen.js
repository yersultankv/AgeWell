import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import MetricCard from '../components/MetricCard';
import ScoreRing from '../components/ScoreRing';
import { useApp } from '../context/AppContext';
import { usePrediction } from '../hooks';
import { todayStr } from '../utils/date';
import { load, save, KEYS } from '../services/storage';
import { ask } from '../ai/openai';
import { computeStreak } from './AchievementsScreen';

const WATER_GOAL = 8;

export default function HomeScreen({ navigation }) {
  const { colors: c, user, entries, apiKey, settings, addEntry, updateEntry } = useApp();
  const pred = usePrediction();
  const today = todayStr();
  const todayEntry = entries.find((e) => e.date === today);
  const [tip, setTip] = useState(null);
  const [tipLoading, setTipLoading] = useState(false);

  const latest = (key) => {
    const e = entries.find((x) => typeof x[key] === 'number');
    return e ? e[key] : null;
  };
  const sys = latest('sys'); const dia = latest('dia'); const sleep = latest('sleep');
  const fmt = (v, d = '—') => (v === null || v === undefined ? d : String(v));
  const water = todayEntry?.water || 0;
  const streak = computeStreak(entries);

  const addWater = async () => {
    if (todayEntry) await updateEntry(todayEntry.id, { water: (todayEntry.water || 0) + 1 });
    else await addEntry({ date: today, water: 1 });
  };

  // Күнделікті AI кеңесі: күніне бір рет сұралып, құрылғыда кэштеледі
  const loadTip = async (force) => {
    if (!user) return;
    const key = user.email + '|' + today;
    const saved = await load(KEYS.tips, {});
    if (!force && saved[key]) return setTip(saved[key]);
    if (!apiKey || !pred) return;
    setTipLoading(true);
    try {
      const t = await ask(apiKey, settings.chatModel,
        `Қолданушы ${user.name.split(' ')[0]}, индексі ${pred.score}/100, биологиялық жасы ${pred.bioAge}. Бүгінге 1-2 сөйлемдік нақты, жылы кеңес бер (қазақша, эмодзисіз).`,
        'Сен салауатты қартаю бойынша қысқа кеңес беретін көмекшісің.');
      setTip(t);
      await save(KEYS.tips, { [key]: t });
    } catch (e) { /* кеңес міндетті емес: қате болса үнсіз өткізіп жібереміз */ }
    finally { setTipLoading(false); }
  };
  useEffect(() => { loadTip(false); }, [apiKey, user?.email]);

  const Quick = ({ icon, label, to, color }) => (
    <TouchableOpacity onPress={() => navigation.navigate(to)} style={{ alignItems: 'center', flex: 1 }}>
      <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.divider }}>
        <Ionicons name={icon} size={24} color={color || c.primary} />
      </View>
      <Text style={{ color: c.text, fontSize: 12, marginTop: 6, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: c.text }}>Сәлем, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={{ color: c.sub, marginTop: 2 }}>{streak > 0 ? `🔥 ${streak} күн қатарынан жазба` : 'Бүгінгі күйің қалай?'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}><Avatar size={44} /></TouchableOpacity>
      </View>

      <View style={{ backgroundColor: c.primaryDark, borderRadius: 24, padding: 20, marginBottom: 20 }}>
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

      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <Quick icon="sparkles" label="AI чат" to="Chat" color={c.primary} />
        <Quick icon="flag" label="Мақсат" to="Goals" color={c.warning} />
        <Quick icon="medkit" label="Дәрілер" to="Medications" color={c.error} />
        <Quick icon="restaurant" label="Тамақ" to="FoodAnalysis" color={c.accent} />
        <Quick icon="call" label="SOS" to="SOS" color={c.error} />
      </View>

      {(tip || tipLoading || !apiKey) && (
        <Card style={{ marginBottom: 20, backgroundColor: c.tint }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="sparkles" size={18} color={c.primary} />
            <Text style={{ color: c.primary, fontWeight: '800', marginLeft: 6, flex: 1 }}>Күнің кеңесі (AI)</Text>
            {apiKey ? <TouchableOpacity onPress={() => loadTip(true)} hitSlop={8}><Ionicons name="refresh" size={18} color={c.primary} /></TouchableOpacity> : null}
          </View>
          {tipLoading ? <ActivityIndicator color={c.primary} /> : (
            <Text style={{ color: c.text, lineHeight: 21 }}>{tip || 'AI кеңесін көру үшін Баптаулар → AI бөлімінде OpenAI кілтін енгізіңіз.'}</Text>
          )}
        </Card>
      )}

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
