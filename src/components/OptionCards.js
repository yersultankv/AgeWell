import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useApp } from '../context/AppContext';

// Радио-карточкалар (бір таңдау)
export default function OptionCards({ label, options, value, onChange }) {
  const { colors: c } = useApp();
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 8 }}>{label}</Text>
      <View style={{ flexDirection: 'row' }}>
        {options.map((o, i) => {
          const on = o.value === value;
          return (
            <TouchableOpacity
              key={o.value}
              onPress={() => onChange(o.value)}
              style={{
                flex: 1, marginRight: i < options.length - 1 ? 8 : 0, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
                backgroundColor: on ? c.tint : c.surface, borderWidth: on ? 2 : 1, borderColor: on ? c.primary : c.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: on ? c.primary : c.text }}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
