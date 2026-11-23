import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function Stepper({ label, value, onChange, min = 0, max = 100, step = 1, unit, error }) {
  const { colors: c } = useApp();
  const v = Number(value) || 0;
  const btn = { width: 44, height: 44, borderRadius: 14, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' };
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity style={btn} onPress={() => onChange(Math.max(min, v - step))}><Ionicons name="remove" size={22} color={c.primary} /></TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: '800', color: c.text }}>{v}{unit ? ` ${unit}` : ''}</Text>
        <TouchableOpacity style={btn} onPress={() => onChange(Math.min(max, v + step))}><Ionicons name="add" size={22} color={c.primary} /></TouchableOpacity>
      </View>
      {error ? <Text style={{ color: c.error, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}
