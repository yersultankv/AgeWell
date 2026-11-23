import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Input from '../components/Input';
import FormModal from '../components/FormModal';
import EmptyState from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import { todayStr } from '../utils/date';
import { rangeError } from '../utils/validators';

export const GOAL_TYPES = {
  steps: { label: 'Қадам', unit: 'қадам', icon: 'footsteps-outline', def: 8000 },
  water: { label: 'Су', unit: 'стақан', icon: 'water-outline', def: 8 },
  sleep: { label: 'Ұйқы', unit: 'сағ', icon: 'moon-outline', def: 7 },
  weight: { label: 'Салмақ', unit: 'кг', icon: 'barbell-outline', def: 70 },
  custom: { label: 'Басқа', unit: '', icon: 'flag-outline', def: 10 },
};

// Мақсаттың ағымдағы мәні: қадам/су/ұйқы — бүгінгі жазбадан, салмақ — соңғы жазбадан, custom — қолмен
export function goalProgress(g, entries) {
  const today = entries.filter((e) => e.date === todayStr());
  let current = g.current || 0;
  if (g.type === 'steps' || g.type === 'water') current = today.reduce((s, e) => s + (e[g.type] || 0), 0);
  else if (g.type === 'sleep') current = Math.max(0, ...today.map((e) => e.sleep || 0));
  else if (g.type === 'weight') current = entries.find((e) => typeof e.weight === 'number')?.weight || 0;
  const pct = g.type === 'weight'
    ? (current ? Math.max(0, Math.min(1, 1 - Math.abs(current - g.target) / g.target)) : 0)
    : Math.max(0, Math.min(1, current / g.target));
  return { current, pct, done: g.type === 'weight' ? current && Math.abs(current - g.target) <= 0.5 : current >= g.target };
}

export default function GoalsScreen({ navigation }) {
  const { colors: c, goals, entries, addGoal, updateGoal, deleteGoal, showToast } = useApp();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type: 'steps', title: '', target: '' });
  const [errors, setErrors] = useState({});

  const openNew = () => { setEditing(null); setForm({ type: 'steps', title: '', target: String(GOAL_TYPES.steps.def) }); setErrors({}); setModal(true); };
  const openEdit = (g) => { setEditing(g); setForm({ type: g.type, title: g.title, target: String(g.target) }); setErrors({}); setModal(true); };

  const save = async () => {
    const e = {};
    if (form.title.trim().length < 2) e.title = 'Атауын енгізіңіз';
    const err = rangeError(form.target, 0.5, 1000000, 'Мән');
    if (!form.target || err || Number(form.target) <= 0) e.target = err || 'Оң сан енгізіңіз';
    setErrors(e);
    if (Object.keys(e).length) return;
    const data = { type: form.type, title: form.title.trim(), target: Number(form.target), unit: GOAL_TYPES[form.type].unit };
    if (editing) await updateGoal(editing.id, data); else await addGoal(data);
    setModal(false);
    showToast(editing ? 'Мақсат өзгертілді' : 'Мақсат қосылды');
  };

  const remove = (g) =>
    Alert.alert('Мақсатты жою керек пе?', g.title, [
      { text: 'Бас тарту', style: 'cancel' },
      { text: 'Жою', style: 'destructive', onPress: async () => { await deleteGoal(g.id); showToast('Мақсат жойылды'); } },
    ]);

  return (
    <Screen
      title="Мақсаттар"
      onBack={() => navigation.goBack()}
      right={<TouchableOpacity onPress={openNew} hitSlop={10}><Ionicons name="add-circle" size={30} color={c.primary} /></TouchableOpacity>}
    >
      {goals.length === 0 ? (
        <EmptyState icon="flag-outline" title="Мақсаттар жоқ" text="Қадам, су, ұйқы немесе салмақ мақсатын қосыңыз" action="Мақсат қосу" onAction={openNew} />
      ) : goals.map((g) => {
        const t = GOAL_TYPES[g.type] || GOAL_TYPES.custom;
        const p = goalProgress(g, entries);
        return (
          <Card key={g.id} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={p.done ? 'checkmark-circle' : t.icon} size={22} color={p.done ? c.success : c.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: c.text, fontWeight: '700' }}>{g.title}</Text>
                <Text style={{ color: c.sub, fontSize: 12 }}>{Math.round(p.current * 10) / 10} / {g.target} {g.unit}</Text>
              </View>
              <TouchableOpacity onPress={() => openEdit(g)} hitSlop={8} style={{ marginRight: 14 }}><Ionicons name="create-outline" size={20} color={c.primary} /></TouchableOpacity>
              <TouchableOpacity onPress={() => remove(g)} hitSlop={8}><Ionicons name="trash-outline" size={20} color={c.error} /></TouchableOpacity>
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: c.tint, marginTop: 12 }}>
              <View style={{ width: `${Math.max(2, p.pct * 100)}%`, height: 10, borderRadius: 5, backgroundColor: p.done ? c.success : c.primary }} />
            </View>
            {g.type === 'custom' && (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                <TouchableOpacity onPress={() => updateGoal(g.id, { current: Math.max(0, (g.current || 0) - 1) })} style={{ marginRight: 10 }}><Ionicons name="remove-circle-outline" size={28} color={c.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => updateGoal(g.id, { current: (g.current || 0) + 1 })}><Ionicons name="add-circle" size={28} color={c.primary} /></TouchableOpacity>
              </View>
            )}
          </Card>
        );
      })}

      <FormModal visible={modal} title={editing ? 'Мақсатты өзгерту' : 'Жаңа мақсат'} onClose={() => setModal(false)} onSave={save}>
        <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Түрі</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.entries(GOAL_TYPES).map(([k, v]) => (
            <Chip key={k} label={v.label} selected={form.type === k} onPress={() => setForm({ ...form, type: k, title: form.title || v.label, target: editing ? form.target : String(v.def) })} />
          ))}
        </View>
        <Input label="Атауы" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} error={errors.title} placeholder="Күніне 8000 қадам" autoCapitalize="sentences" />
        <Input label={`Мақсатты мән ${GOAL_TYPES[form.type].unit ? '(' + GOAL_TYPES[form.type].unit + ')' : ''}`} keyboardType="decimal-pad" value={form.target} onChangeText={(t) => setForm({ ...form, target: t })} error={errors.target} />
      </FormModal>
    </Screen>
  );
}
