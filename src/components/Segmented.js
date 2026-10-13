import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useApp } from '../context/AppContext';

export default function Segmented({ options, value, onChange, style }) {
  const { colors: c } = useApp();
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: c.tint, borderRadius: 14, padding: 4 }, style]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <TouchableOpacity key={o.value} onPress={() => onChange(o.value)} style={{ flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center', backgroundColor: on ? c.surface : 'transparent' }}>
            <Text style={{ fontWeight: '700', color: on ? c.primary : c.sub }}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
