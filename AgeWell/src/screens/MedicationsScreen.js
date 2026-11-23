import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Input from '../components/Input';
import FormModal from '../components/FormModal';
import EmptyState from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import { useMedActions } from '../hooks';
import { isTime } from '../utils/validators';

export default function MedicationsScreen({ navigation }) {
  const { colors: c, meds, showToast } = useApp();
  const { addMedWithReminder, editMed, toggleMed, removeMed } = useMedActions();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', dose: '', time: '08:00' });
  const [errors, setErrors] = useState({});

  const openNew = () => { setEditing(null); setForm({ name: '', dose: '', time: '08:00' }); setErrors({}); setModal(true); };
  const openEdit = (m) => { setEditing(m); setForm({ name: m.name, dose: m.dose || '', time: m.time }); setErrors({}); setModal(true); };

  const save = async () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Дәрі атауын енгізіңіз';
    if (!isTime(form.time)) e.time = 'Уақытты СС:ММ форматында енгізіңіз (мысалы, 08:30)';
    setErrors(e);
    if (Object.keys(e).length) return;
    const data = { name: form.name.trim(), dose: form.dose.trim(), time: form.time };
    if (editing) await editMed(editing, data); else await addMedWithReminder(data);
    setModal(false);
    showToast(editing ? 'Дәрі өзгертілді' : 'Дәрі ескертуі қосылды');
  };

  const remove = (m) =>
    Alert.alert('Дәріні жою керек пе?', m.name, [
      { text: 'Бас тарту', style: 'cancel' },
      { text: 'Жою', style: 'destructive', onPress: async () => { await removeMed(m); showToast('Дәрі жойылды'); } },
    ]);

  const sorted = [...meds].sort((a, b) => (a.time < b.time ? -1 : 1));
  return (
    <Screen title="Дәрі ескертулері" onBack={() => navigation.goBack()} right={<TouchableOpacity onPress={openNew} hitSlop={10}><Ionicons name="add-circle" size={30} color={c.primary} /></TouchableOpacity>}>
      {sorted.length === 0 ? (
        <EmptyState icon="medkit-outline" title="Дәрілер жоқ" text="Қабылдау уақытын қосыңыз, телефон күн сайын еске салады" action="Дәрі қосу" onAction={openNew} />
      ) : sorted.map((m) => (
        <Card key={m.id} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', opacity: m.active ? 1 : 0.6 }}>
          <View style={{ width: 56, alignItems: 'center' }}>
            <Text style={{ color: c.primary, fontWeight: '800', fontSize: 18 }}>{m.time}</Text>
          </View>
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            <Text style={{ color: c.text, fontWeight: '700' }}>{m.name}</Text>
            {m.dose ? <Text style={{ color: c.sub, fontSize: 12 }}>{m.dose}</Text> : null}
          </View>
          <Switch value={m.active} onValueChange={() => toggleMed(m)} trackColor={{ true: c.primary }} />
          <TouchableOpacity onPress={() => openEdit(m)} hitSlop={8} style={{ marginLeft: 12 }}><Ionicons name="create-outline" size={20} color={c.primary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => remove(m)} hitSlop={8} style={{ marginLeft: 12 }}><Ionicons name="trash-outline" size={20} color={c.error} /></TouchableOpacity>
        </Card>
      ))}
      <Text style={{ color: c.sub, fontSize: 12, marginTop: 8 }}>Ескертулер телефон баптауларында рұқсат берілсе жұмыс істейді. Expo Go-да кейбір құрылғыларда шектеулі болуы мүмкін.</Text>

      <FormModal visible={modal} title={editing ? 'Дәрін өзгерту' : 'Жаңа дәрі'} onClose={() => setModal(false)} onSave={save}>
        <Input label="Дәрі атауы" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} error={errors.name} placeholder="Аспирин" autoCapitalize="sentences" />
        <Input label="Доза (міндетті емес)" value={form.dose} onChangeText={(t) => setForm({ ...form, dose: t })} placeholder="1 таблетка" autoCapitalize="sentences" />
        <Input label="Қабылдау уақыты (СС:ММ)" icon="time-outline" keyboardType="numbers-and-punctuation" value={form.time} onChangeText={(t) => setForm({ ...form, time: t })} error={errors.time} placeholder="08:30" />
      </FormModal>
    </Screen>
  );
}
