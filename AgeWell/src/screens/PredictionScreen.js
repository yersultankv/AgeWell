import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import ScoreRing from '../components/ScoreRing';
import { useApp } from '../context/AppContext';
import { predict } from '../services/predictionApi';

export default function PredictionScreen({ navigation }) {
  const { colors: c, profile, entries, showToast } = useApp();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await predict(profile, entries.slice(0, 14)));
    } catch (e) {
      showToast('Болжам есептелмеді. Қайта көріңіз', 'error');
    } finally {
      setLoading(false);
    }
  }, [profile, entries]);

  useEffect(() => { run(); }, []);

  const diff = result ? result.bioAge - profile.age : 0;
  const maxImpact = result ? Math.max(...result.factors.map((f) => Math.abs(f.impact)), 1) : 1;

  return (
    <Screen
      title="Болжам нәтижесі"
      onBack={() => navigation.goBack()}
      footer={<Button title="Болжамды жаңарту" onPress={run} loading={loading} />}
    >
      {!result ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 60 }} />
      ) : (
        <>
          <Card style={{ alignItems: 'center', paddingVertical: 24, opacity: loading ? 0.5 : 1 }}>
            <ScoreRing score={result.score} size={170} stroke={16} color={result.level.color} track={c.tint} textColor={c.text} big={52} />
            <View style={{ backgroundColor: result.level.color, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginTop: 14 }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{result.level.label} деңгей</Text>
            </View>
          </Card>

          <Card style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.sub }}>Биологиялық жас</Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: c.text }}>{result.bioAge}</Text>
              <Text style={{ color: c.sub, marginTop: 4 }}>Паспорттық жас: {profile.age}</Text>
            </View>
            <View style={{ backgroundColor: diff <= 0 ? c.success : c.error, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{diff > 0 ? '+' : ''}{diff} жас</Text>
            </View>
          </Card>

          <Text style={{ fontSize: 18, fontWeight: '700', color: c.text, marginTop: 24, marginBottom: 12 }}>Негізгі факторлар</Text>
          <Card>
            {result.factors.map((f) => {
              const col = f.impact > 0 ? c.success : f.impact < 0 ? c.error : c.sub;
              return (
                <View key={f.key} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: c.text, fontWeight: '600' }}>{f.label}</Text>
                    <Text style={{ color: col, fontWeight: '700' }}>{f.impact > 0 ? '+' : ''}{f.impact}</Text>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: c.tint }}>
                    <View style={{ width: `${Math.max(4, (Math.abs(f.impact) / maxImpact) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: col }} />
                  </View>
                </View>
              );
            })}
          </Card>

          <Text style={{ fontSize: 18, fontWeight: '700', color: c.text, marginTop: 12, marginBottom: 12 }}>Ұсыныстар</Text>
          {result.tips.slice(0, 3).map((t, i) => (
            <Card key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="bulb-outline" size={24} color={c.warm} />
              <Text style={{ flex: 1, marginLeft: 12, color: c.text, lineHeight: 20 }}>{t}</Text>
            </Card>
          ))}
          <Text style={{ color: c.sub, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
            Бұл болжам медициналық диагноз емес, ақпараттық мақсатта ғана.
          </Text>
        </>
      )}
    </Screen>
  );
}
