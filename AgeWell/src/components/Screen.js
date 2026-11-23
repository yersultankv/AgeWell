import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { font } from '../theme';

export function TopBar({ title, onBack, onClose, right }) {
  const { colors: c } = useApp();
  return (
    <View style={s.bar}>
      <View style={s.side}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={12}><Ionicons name="arrow-back" size={24} color={c.text} /></TouchableOpacity>
        ) : onClose ? (
          <TouchableOpacity onPress={onClose} hitSlop={12}><Ionicons name="close" size={26} color={c.text} /></TouchableOpacity>
        ) : null}
      </View>
      <Text style={[s.title, { color: c.text }]} numberOfLines={1}>{title}</Text>
      <View style={[s.side, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

export default function Screen({ children, scroll = true, title, onBack, onClose, right, footer, padded = true }) {
  const { colors: c } = useApp();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      {title !== undefined && <TopBar title={title} onBack={onBack} onClose={onClose} right={right} />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView contentContainerStyle={{ padding: padded ? 20 : 0, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, padding: padded ? 20 : 0 }}>{children}</View>
        )}
        {footer ? <View style={{ padding: 20, paddingTop: 8 }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bar: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  side: { width: 44 },
  title: { flex: 1, textAlign: 'center', fontSize: font.h3, fontWeight: '700' },
});
