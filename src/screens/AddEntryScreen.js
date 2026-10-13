import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Input from '../components/Input';
import { useApp } from '../context/AppContext';
import { useForm } from '../hooks';
import { todayStr, isValidDate } from '../utils/date';
import { rangeError, num } from '../utils/validators';

const MOODS = ['😞', '😕', '😐', '🙂', '😄'];
const FIELDS = [
  { key: 'sys', label: 'Систолалық қысым (мм рт.ст.)', min: 70, max: 250 },
  { key: 'dia', label: 'Диастолалық қысым', min: 40, max: 150 },
  { key: 'pulse', label: 'Пульс (соққы/мин)', min: 30, max: 220 },
  { key: 'steps', label: 'Қадам саны', min: 0, max: 100000 },
  { key: 'sleep', label: 'Ұйқы (сағат)', min: 0, max: 24 },
  { key: 'water', label: 'Су (стақан)', min: 0, max: 30 },
  { key: 'weight', label: 'Салмақ (кг)', min: 20, max: 300 },
];

export default function AddEntryScreen({ navigation, route }) {
  const entryId = route.params?.entryId;
  const { entries, addEntry, updateEntry, showToast, colors: c } = useApp();
  const existing = entries.find((e) => e.id === entryId);
  const { values, setValues, errors, setErrors, set } = useForm({
    date: todayStr(), sys: '', dia: '', pulse: '', steps: '', sleep: '', water: '', weight: '', mood: 0, note: '',
  });

  // Өңдеу режимінде бар мәндерді формаға салу
  useEffect(() => {
    if (existing) {
      const v = { date: existing.date, mood: existing.mood || 0, note: existing.note || '' };
      FIELDS.forEach((f) => { v[f.key] = existing[f.key] !== undefined && existing[f.key] !== null ? String(existing[f.key]) : ''; });
      setValues(v);
    }
  }, [entryId]);

  const submit = async () => {
    const e = {};
    if (!isValidDate(values.date)) e.date = 'Күнді ЖЖЖЖ-АА-КК форматында енгізіңіз';
    else if (values.date > todayStr()) e.date = 'Болашақ күнді енгізуге болмайды';
    FIELDS.forEach((f) => { const err = rangeError(values[f.key], f.min, f.max); if (err) e[f.key] = err; });
    if ((values.sys && !values.dia) || (!values.sys && values.dia)) e[values.sys ? 'dia' : 'sys'] = 'Қысымның екі мәнін де енгізіңіз';
    const hasAny = FIELDS.some((f) => values[f.key] !== '') || values.mood > 0 || values.note.trim();
    if (!hasAny) e.form = 'Кемінде бір көрсеткішті енгізіңіз';
    setErrors(e);
    if (Object.keys(e).length) return;

    const data = { date: values.date, mood: values.mood || null, note: values.note.trim() };
    FIELDS.forEach((f) => { data[f.key] = num(values[f.key]); });
    if (existing) await updateEntry(existing.id, data);
    else await addEntry(data);
    showToast(existing ? 'Өзгерістер сақталды' : 'Жазба сәтті сақталды');
    navigation.goBack();
  };

  return (
    <Screen
      title={existing ? 'Жазбаны өңдеу' : 'Жаңа жазба'}
      onClose={() => navigation.goBack()}
      footer={<Button title={existing ? 'Өзгерістерді сақтау' : 'Сақтау'} onPress={submit} />}
    >
      {errors.form ? <Text style={{ color: c.error, marginBottom: 12 }}>{errors.form}</Text> : null}
      <Input label="Күні" icon="calendar-outline" value={values.date} onChangeText={set('date')} error={errors.date} placeholder="2026-10-13" keyboardType="numbers-and-punctuation" />
      {FIELDS.map((f) => (
        <Input key={f.key} label={f.label} keyboardType="decimal-pad" value={values[f.key]} onChangeText={set(f.key)} error={errors[f.key]} />
      ))}
      <Text style={{ fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 8 }}>Көңіл-күй</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        {MOODS.map((m, i) => {
          const on = values.mood === i + 1;
          return (
            <TouchableOpacity key={i} onPress={() => set('mood')(on ? 0 : i + 1)} style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.tint : c.surface, borderWidth: on ? 2 : 1, borderColor: on ? c.primary : c.border }}>
              <Text style={{ fontSize: 28 }}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Input label="Ескертпе" multiline value={values.note} onChangeText={set('note')} placeholder="Өзіңізді қалай сезіндіңіз?" autoCapitalize="sentences" />
    </Screen>
  );
}
