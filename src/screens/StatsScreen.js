import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Segmented from '../components/Segmented';
import EmptyState from '../components/EmptyState';
import { LineChart, BarChart, Donut } from '../components/Charts';
import { useApp } from '../context/AppContext';
import { computeScore } from '../services/scoreService';
import { daysBetween, todayStr, shortDate } from '../utils/date';

const RANGES = { week: 7, month: 30, year: 365 };
const avg = (a) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null);

export default function StatsScreen({ navigation }) {
  const { colors: c, entries, profile } = useApp();
  const [range, setRange] = useState('week');

  const data = useMemo(() => {
    const list = entries
      .filter((e) => daysBetween(todayStr(), e.date) < RANGES[range])
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-12);
    const withScore = list.map((e) => ({ ...e, score: computeScore(profile, [e]).score }));
    const only = (k) => list.filter((e) => typeof e[k] === 'number');
    const sleeps = only('sleep').map((e) => e.sleep);
    const best = withScore.reduce((b, e) => (!b || e.score >= b.score ? e : b), null);
    return {
      list, withScore,
      steps: only('steps'), pulse: only('pulse'),
      avgPulse: avg(only('pulse').map((e) => e.pulse)), avgSleep: avg(sleeps),
      sleepParts: [
        { label: 'Жеткіліксіз (<6)', value: sleeps.filter((s) => s < 6).length, color: '#E5484D' },
        { label: 'Қалыпты (6–7)', value: sleeps.filter((s) => s >= 6 && s < 7).length, color: '#F5A524' },
        { label: 'Жақсы (7–9)', value: sleeps.filter((s) => s >= 7 && s <= 9).length, color: '#2BA89A' },
        { label: 'Көп (>9)', value: sleeps.filter((s) => s > 9).length, color: '#3B82F6' },
      ],
      best,
    };
  }, [entries, range, profile]);

  const lbl = (arr) => (arr.length ? [shortDate(arr[0].date), shortDate(arr[arr.length - 1].date)] : []);

  return (
    <Screen title="Статистика">
      <Segmented
        style={{ marginBottom: 20 }} value={range} onChange={setRange}
        options={[{ value: 'week', label: 'Апта' }, { value: 'month', label: 'Ай' }, { value: 'year', label: 'Жыл' }]}
      />
      {data.list.length === 0 ? (
        <EmptyState icon="stats-chart-outline" title="Деректер жеткіліксіз" text="Таңдалған кезеңде жазбалар жоқ" action="Жазба қосу" onAction={() => navigation.navigate('AddEntry')} />
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ color: c.text, fontWeight: '700', marginBottom: 12 }}>Индекс динамикасы</Text>
            <LineChart data={data.withScore.map((e) => e.score)} labels={lbl(data.withScore)} />
          </Card>
          {data.steps.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <Text style={{ color: c.text, fontWeight: '700', marginBottom: 12 }}>Қадам саны</Text>
              <BarChart data={data.steps.map((e) => e.steps)} labels={data.steps.map((e) => String(Number(e.date.slice(8))))} goal={8000} />
            </Card>
          )}
          {data.pulse.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <Text style={{ color: c.text, fontWeight: '700', marginBottom: 12 }}>Пульс</Text>
              <LineChart data={data.pulse.map((e) => e.pulse)} labels={lbl(data.pulse)} color={c.error} />
            </Card>
          )}
          {data.avgSleep !== null && (
            <Card style={{ marginBottom: 16 }}>
              <Text style={{ color: c.text, fontWeight: '700', marginBottom: 12 }}>Ұйқы сапасы</Text>
              <Donut parts={data.sleepParts} />
            </Card>
          )}
          <View style={{ flexDirection: 'row' }}>
            <Card style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ color: c.sub, fontSize: 12 }}>Орташа пульс</Text>
              <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>{data.avgPulse ?? '—'}</Text>
            </Card>
            <Card style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ color: c.sub, fontSize: 12 }}>Орташа ұйқы</Text>
              <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>{data.avgSleep ? `${data.avgSleep} сағ` : '—'}</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={{ color: c.sub, fontSize: 12 }}>Ең жақсы күн</Text>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '800', marginTop: 4 }}>{data.best ? shortDate(data.best.date) : '—'}</Text>
            </Card>
          </View>
        </>
      )}
    </Screen>
  );
}
