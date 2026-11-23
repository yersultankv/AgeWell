import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import { useApp } from '../context/AppContext';
import { todayStr, addDays } from '../utils/date';
import { goalProgress } from './GoalsScreen';

export function computeStreak(entries) {
  const days = new Set(entries.map((e) => e.date));
  let d = todayStr();
  if (!days.has(d)) d = addDays(d, -1); // бүгін әлі жазбаса, кешегіден санай береді
  let n = 0;
  while (days.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

export default function AchievementsScreen({ navigation }) {
  const { colors: c, entries, goals, meds, user } = useApp();
  const stats = useMemo(() => {
    const streak = computeStreak(entries);
    const doneGoals = goals.filter((g) => goalProgress(g, entries).done).length;
    const bigSteps = entries.filter((e) => e.steps >= 10000).length;
    const water = entries.filter((e) => e.water >= 8).length;
    return { streak, doneGoals, bigSteps, water, total: entries.length };
  }, [entries, goals]);

  const badges = [
    { icon: 'footsteps', title: 'Алғашқы қадам', text: 'Алғашқы жазбаңызды қосыңыз', ok: stats.total >= 1 },
    { icon: 'document-text', title: 'Тәртіпті', text: '10 жазба қосыңыз', ok: stats.total >= 10 },
    { icon: 'flame', title: '3 күн қатарынан', text: 'Қатарынан 3 күн жазба жасаңыз', ok: stats.streak >= 3 },
    { icon: 'bonfire', title: 'Апта чемпионы', text: 'Қатарынан 7 күн', ok: stats.streak >= 7 },
    { icon: 'walk', title: '10 000 қадам', text: 'Бір күнде 10 000 қадамға жету', ok: stats.bigSteps >= 1 },
    { icon: 'water', title: 'Су балансы', text: 'Бір күнде 8 стақан су ішу', ok: stats.water >= 1 },
    { icon: 'flag', title: 'Мақсат орындалды', text: 'Кемінде бір мақсатты орындау', ok: stats.doneGoals >= 1 },
    { icon: 'medkit', title: 'Дәрі тәртібі', text: 'Дәрі ескертуін қосу', ok: meds.length >= 1 },
    { icon: 'shield-checkmark', title: 'Қауіпсіз аккаунт', text: '2FA қосу', ok: !!user?.twoFA?.enabled },
  ];
  const got = badges.filter((b) => b.ok).length;

  return (
    <Screen title="Жетістіктер" onBack={() => navigation.goBack()}>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <Card style={{ flex: 1, marginRight: 10, alignItems: 'center' }}>
          <Ionicons name="flame" size={28} color={c.warm} />
          <Text style={{ color: c.text, fontSize: 26, fontWeight: '800' }}>{stats.streak}</Text>
          <Text style={{ color: c.sub, fontSize: 12 }}>күн қатарынан</Text>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Ionicons name="trophy" size={28} color={c.primary} />
          <Text style={{ color: c.text, fontSize: 26, fontWeight: '800' }}>{got}/{badges.length}</Text>
          <Text style={{ color: c.sub, fontSize: 12 }}>жетістік</Text>
        </Card>
      </View>
      {badges.map((b) => (
        <Card key={b.title} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, opacity: b.ok ? 1 : 0.5 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: b.ok ? c.tint : c.divider, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={b.icon} size={24} color={b.ok ? c.primary : c.sub} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: c.text, fontWeight: '700' }}>{b.title}</Text>
            <Text style={{ color: c.sub, fontSize: 12 }}>{b.text}</Text>
          </View>
          {b.ok && <Ionicons name="checkmark-circle" size={22} color={c.success} />}
        </Card>
      ))}
    </Screen>
  );
}
