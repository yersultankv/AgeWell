import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { radius } from '../theme';

export default function Input({ label, error, icon, secure, multiline, style, ...rest }) {
  const { colors: c } = useApp();
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(!!secure);
  const border = error ? c.error : focus ? c.primary : c.border;
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label ? <Text style={[s.label, { color: c.text }]}>{label}</Text> : null}
      <View style={[s.box, { borderColor: border, borderWidth: focus ? 2 : 1, backgroundColor: c.surface, alignItems: multiline ? 'flex-start' : 'center' }]}>
        {icon ? <Ionicons name={icon} size={20} color={c.sub} style={{ marginRight: 10, marginTop: multiline ? 14 : 0 }} /> : null}
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          multiline={multiline}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholderTextColor={c.sub}
          style={[s.input, { color: c.text, minHeight: multiline ? 90 : undefined, textAlignVertical: multiline ? 'top' : 'center' }]}
          autoCapitalize={rest.autoCapitalize || 'none'}
        />
        {secure ? (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.sub} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={[s.err, { color: c.error }]}>{error}</Text> : null}
    </View>
  );
}
const s = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  box: { flexDirection: 'row', borderRadius: radius.input, paddingHorizontal: 14, minHeight: 52 },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  err: { fontSize: 12, marginTop: 4 },
});
