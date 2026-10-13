import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import Card from './Card';

export default function MetricCard({ icon, color, label, value, unit, style }) {
  const { colors: c } = useApp();
  return (
    <Card style={[{ flex: 1 }, style]}>
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Ionicons name={icon} size={20} color={color || c.primary} />
      </View>
      <Text style={{ fontSize: 22, fontWeight: '800', color: c.text }}>{value}</Text>
      <Text style={{ fontSize: 12, color: c.sub, marginTop: 2 }}>{unit ? `${unit} · ` : ''}{label}</Text>
    </Card>
  );
}
