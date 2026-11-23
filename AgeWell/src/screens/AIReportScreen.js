import React, { useState } from 'react';
import { View, Text, Share } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import { ask } from '../ai/openai';
import { computeScore } from '../services/scoreService';
import { daysBetween, todayStr } from '../utils/date';

const avg = (a) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null);

export function buildWeekSummary(profile, entries) {
  const week = entries.filter((e) => daysBetween(todayStr(), e.date) < 7);
  const g = (k) => week.map((e) => e[k]).filter((v) => typeof v === 'number');
  const p = computeScore(profile, week);
  return {
    records: week.length,
    avgSystolic: avg(g('sys')), avgDiastolic: avg(g('dia')), avgPulse: avg(g('pulse')),
    avgSteps: avg(g('steps')), avgSleepHours: avg(g('sleep')), avgWater: avg(g('water')), lastWeight: g('weight')[0] ?? null,
    score: p?.score, level: p?.level.label, biologicalAge: p?.bioAge, age: profile?.age,
  };
}

export default function AIReportScreen({ navigation }) {
  const { colors: c, apiKey, settings, profile, entries, showToast } = useApp();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (!apiKey) return showToast('Алдымен Баптаулар → AI бөлімінде API кілтін енгізіңіз', 'error');
    const sum = buildWeekSummary(profile, entries);
    if (!sum.records) return showToast('Соңғы 7 күнде жазба жоқ', 'error');
    setBusy(true);
    try {
      const prompt = `Мына апталық денсаулық көрсеткіштері бойынша қазақ тілінде қысқа есеп жаз: 1) жалпы баға, 2) жақсы жақтары, 3) жақсартуға болатын 3 нәрсе, 4) келесі аптаға нақты 3 мақсат. Диагноз қойма. Деректер: ${JSON.stringify(sum)}`;
      setText(await ask(apiKey, settings.chatModel, prompt, 'Сен салауатты қартаю бойынша кеңесші AI-сың.'));
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="AI апталық есеп" onBack={() => navigation.goBack()} footer={<Button title={text ? 'Қайта жасау' : 'Есеп жасау'} onPress={generate} loading={busy} />}>
      <Text style={{ color: c.sub, marginBottom: 16 }}>AI соңғы 7 күндегі жазбаларыңызды, индексіңізді талдап, жеке есеп жасайды.</Text>
      {text ? (
        <>
          <Card><Text selectable style={{ color: c.text, lineHeight: 23 }}>{text}</Text></Card>
          <Button title="Бөлісу" variant="secondary" small onPress={() => Share.share({ message: text })} style={{ marginTop: 14 }} />
          <Text style={{ color: c.sub, fontSize: 12, marginTop: 12 }}>Бұл ақпарат медициналық кеңес емес.</Text>
        </>
      ) : null}
    </Screen>
  );
}
