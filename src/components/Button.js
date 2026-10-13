import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { radius } from '../theme';

export default function Button({ title, onPress, variant = 'primary', loading, disabled, small, style }) {
  const { colors: c } = useApp();
  const map = {
    primary: { bg: c.primary, fg: '#fff', border: c.primary },
    secondary: { bg: 'transparent', fg: c.primary, border: c.primary },
    danger: { bg: 'transparent', fg: c.error, border: c.error },
    text: { bg: 'transparent', fg: c.primary, border: 'transparent' },
  }[variant];
  const off = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={off ? undefined : onPress}
      style={[s.btn, { height: small ? 40 : 56, backgroundColor: map.bg, borderColor: map.border, opacity: off ? 0.5 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={map.fg} /> : <Text style={[s.txt, { color: map.fg, fontSize: small ? 14 : 16 }]}>{title}</Text>}
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  btn: { borderRadius: radius.button, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  txt: { fontWeight: '700' },
});
