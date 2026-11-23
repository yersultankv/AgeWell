import React from 'react';
import { Modal, View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import Button from './Button';

// Төменнен шығатын форма терезесі (мақсат, дәрі қосу/өңдеу)
export default function FormModal({ visible, title, onClose, onSave, saveLabel = 'Сақтау', children }) {
  const { colors: c } = useApp();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: c.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ flex: 1, fontSize: 20, fontWeight: '800', color: c.text }}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}><Ionicons name="close" size={26} color={c.text} /></TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
            <Button title={saveLabel} onPress={onSave} style={{ marginTop: 8 }} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
