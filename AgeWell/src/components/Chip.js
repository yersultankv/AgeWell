import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useApp } from '../context/AppContext';
import { radius } from '../theme';

export default function Chip({ label, selected, onPress, color }) {
  const { colors: c } = useApp();
  const active = color || c.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.chip, marginRight: 8, marginBottom: 8,
        backgroundColor: selected ? active : c.surface, borderWidth: 1, borderColor: selected ? active : c.border,
      }}
    >
      <Text style={{ color: selected ? '#fff' : c.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}
