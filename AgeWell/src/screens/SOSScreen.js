import React, { useState } from 'react';
import { View, Text, Alert, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useApp } from '../context/AppContext';
import { isPhone } from '../utils/validators';

export default function SOSScreen({ navigation }) {
  const { colors: c, user, updateUser, showToast } = useApp();
  const em = user?.emergency || { name: '', phone: '' };
  const [name, setName] = useState(em.name);
  const [phone, setPhone] = useState(em.phone);
  const [errors, setErrors] = useState({});

  const call = (number, who) =>
    Alert.alert(`${who}-ға қоңырау шалу`, number, [
      { text: 'Бас тарту', style: 'cancel' },
      { text: 'Қоңырау шалу', onPress: () => Linking.openURL(`tel:${number.replace(/[\s()-]/g, '')}`).catch(() => showToast('Қоңырау шалу мүмкін емес', 'error')) },
    ]);

  const save = async () => {
    const e = {};
    if (name.trim().length < 2) e.name = 'Атын енгізіңіз';
    if (!isPhone(phone)) e.phone = 'Телефон нөмірін дұрыс енгізіңіз (мысалы, +77001234567)';
    setErrors(e);
    if (Object.keys(e).length) return;
    await updateUser({ emergency: { name: name.trim(), phone: phone.trim() } });
    showToast('Жақын адам сақталды');
  };

  return (
    <Screen title="SOS" onBack={() => navigation.goBack()}>
      <Card style={{ alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => call('103', 'Жедел жәрдем')} style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: c.error, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="call" size={44} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 22, marginTop: 4 }}>103</Text>
        </TouchableOpacity>
        <Text style={{ color: c.sub, marginTop: 12, textAlign: 'center' }}>Жедел жәрдем. Көкірек ауруы, естен тану, қатты әлсіздік болса бірден қоңырау шалыңыз.</Text>
        <Button title="Құтқару қызметі 112" variant="danger" small onPress={() => call('112', 'Құтқару қызметі')} style={{ marginTop: 12 }} />
      </Card>

      <Text style={{ color: c.text, fontWeight: '800', fontSize: 18, marginBottom: 12 }}>Жақын адам</Text>
      <Input label="Аты" icon="person-outline" value={name} onChangeText={(t) => { setName(t); setErrors({}); }} error={errors.name} placeholder="Анам" autoCapitalize="words" />
      <Input label="Телефон" icon="call-outline" keyboardType="phone-pad" value={phone} onChangeText={(t) => { setPhone(t); setErrors({}); }} error={errors.phone} placeholder="+77001234567" />
      <Button title="Сақтау" onPress={save} />
      {em.phone ? <Button title={`${em.name}-ға қоңырау шалу`} variant="secondary" onPress={() => call(em.phone, em.name)} style={{ marginTop: 12 }} /> : null}
    </Screen>
  );
}
