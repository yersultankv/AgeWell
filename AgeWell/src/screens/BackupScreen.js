import React, { useState } from 'react';
import { View, Text, Share } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useApp } from '../context/AppContext';

export default function BackupScreen({ navigation }) {
  const { colors: c, entries, goals, meds, importData, showToast } = useApp();
  const [text, setText] = useState('');
  const [error, setError] = useState(null);

  const strip = (arr) => arr.map(({ owner, ...r }) => r);
  const exportJson = async () => {
    const payload = { app: 'AgeWell', version: 2, exportedAt: new Date().toISOString(), entries: strip(entries), goals: strip(goals), meds: strip(meds) };
    try { await Share.share({ message: JSON.stringify(payload) }); } catch (e) { showToast('Экспорт орындалмады', 'error'); }
  };

  const restore = async () => {
    let data;
    try { data = JSON.parse(text.trim()); } catch (e) { return setError('JSON форматы қате'); }
    if (data?.app !== 'AgeWell') return setError('Бұл AgeWell көшірмесі емес');
    try {
      const r = await importData(data);
      setText(''); setError(null);
      showToast(`Қалпына келтірілді: ${r.entries} жазба, ${r.goals} мақсат, ${r.meds} дәрі`);
    } catch (e) {
      setError('Деректерді қалпына келтіру мүмкін болмады');
    }
  };

  return (
    <Screen title="Резервтік көшірме" onBack={() => navigation.goBack()}>
      <Card style={{ marginBottom: 20 }}>
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Көшірме жасау</Text>
        <Text style={{ color: c.sub, marginTop: 6, marginBottom: 12 }}>Жазбалар ({entries.length}), мақсаттар ({goals.length}), дәрілер ({meds.length}) JSON мәтіні ретінде бөлісіледі: өзіңізге жіберіп, сақтап қойыңыз.</Text>
        <Button title="JSON экспорттау" onPress={exportJson} />
      </Card>
      <Card>
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Қалпына келтіру</Text>
        <Input multiline placeholder="JSON көшірмесін осында қойыңыз" value={text} onChangeText={(t) => { setText(t); setError(null); }} error={error} />
        <Button title="Қалпына келтіру" variant="secondary" onPress={restore} disabled={!text.trim()} />
      </Card>
    </Screen>
  );
}
