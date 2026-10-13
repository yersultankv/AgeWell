import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';

const SLIDES = [
  { icon: 'heart-circle-outline', title: 'Денсаулығыңды бақыла', text: 'Қан қысымы, пульс, ұйқы және қадамыңды бір жерде сақта.', btn: 'Әрі қарай' },
  { icon: 'sparkles-outline', title: 'Жасанды интеллект болжамы', text: 'Өмір салтың бойынша салауатты қартаю деңгейін есептейміз.', btn: 'Әрі қарай' },
  { icon: 'trending-up-outline', title: 'Динамиканы көр', text: 'Графиктер мен ұсыныстар арқылы нәтижеңді жақсарт.', btn: 'Бастау' },
];

export default function OnboardingScreen({ navigation }) {
  const { colors: c } = useApp();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const finish = () => navigation.replace('Auth');
  const next = () => (i < SLIDES.length - 1 ? setI(i + 1) : finish());

  return (
    <Screen scroll={false} footer={<Button title={slide.btn} onPress={next} />}>
      <View style={{ alignItems: 'flex-end', height: 32 }}>
        {i < SLIDES.length - 1 && (
          <TouchableOpacity onPress={finish}><Text style={{ color: c.sub, fontWeight: '600' }}>Өткізу</Text></TouchableOpacity>
        )}
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 220, height: 220, borderRadius: 110, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
          <Ionicons name={slide.icon} size={110} color={c.primary} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: c.text, textAlign: 'center' }}>{slide.title}</Text>
        <Text style={{ fontSize: 16, color: c.sub, textAlign: 'center', marginTop: 12, lineHeight: 24, paddingHorizontal: 12 }}>{slide.text}</Text>
        <View style={{ flexDirection: 'row', marginTop: 32 }}>
          {SLIDES.map((_, k) => (
            <View key={k} style={{ width: k === i ? 24 : 8, height: 8, borderRadius: 4, marginHorizontal: 3, backgroundColor: k === i ? c.primary : c.border }} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
