import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { useApp } from '../context/AppContext';
import { shadow } from '../theme';

const ITEMS = [
  { to: 'Stats', icon: 'bar-chart', label: 'Статистика', color: '#2BA89A' },
  { to: 'Prediction', icon: 'pulse', label: 'Болжам', color: '#3B82F6' },
  { to: 'Goals', icon: 'flag', label: 'Мақсаттар', color: '#F5A524' },
  { to: 'Medications', icon: 'medkit', label: 'Дәрілер', color: '#E5484D' },
  { to: 'FoodAnalysis', icon: 'restaurant', label: 'Тамақ талдау', color: '#7BC67E' },
  { to: 'AIReport', icon: 'document-text', label: 'AI есеп', color: '#8B5CF6' },
  { to: 'Achievements', icon: 'trophy', label: 'Жетістіктер', color: '#FFB454' },
  { to: 'SOS', icon: 'call', label: 'SOS', color: '#E5484D' },
  { to: 'Security', icon: 'shield-checkmark', label: 'Қауіпсіздік', color: '#0F6B63' },
  { to: 'Backup', icon: 'cloud-upload', label: 'Көшірме', color: '#6B8581' },
  { to: 'Settings', icon: 'settings', label: 'Баптаулар', color: '#12302D' },
];

export default function MenuScreen({ navigation }) {
  const { colors: c } = useApp();
  return (
    <Screen title="Мәзір">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {ITEMS.map((it) => (
          <TouchableOpacity key={it.to} onPress={() => navigation.navigate(it.to)} activeOpacity={0.8}
            style={[{ width: '48%', backgroundColor: c.surface, borderRadius: 20, padding: 18, marginBottom: 14 }, shadow]}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: it.color + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ionicons name={it.icon} size={24} color={it.color} />
            </View>
            <Text style={{ color: c.text, fontWeight: '700' }}>{it.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
}
