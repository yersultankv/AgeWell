import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import Button from './Button';

export default function EmptyState({ icon = 'leaf-outline', title, text, action, onAction }) {
  const { colors: c } = useApp();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Ionicons name={icon} size={44} color={c.primary} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: c.text, textAlign: 'center' }}>{title}</Text>
      {text ? <Text style={{ fontSize: 14, color: c.sub, textAlign: 'center', marginTop: 8 }}>{text}</Text> : null}
      {action ? <Button title={action} onPress={onAction} style={{ marginTop: 24, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}
