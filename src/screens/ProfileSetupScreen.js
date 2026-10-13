import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Input from '../components/Input';
import Chip from '../components/Chip';
import Stepper from '../components/Stepper';
import Segmented from '../components/Segmented';
import OptionCards from '../components/OptionCards';
import { useApp } from '../context/AppContext';
import { useForm } from '../hooks';
import { requiredRange, num } from '../utils/validators';
import { bmiOf } from '../services/scoreService';

const CONDITIONS = ['Қант диабеті', 'Гипертония', 'Жүрек аурулары', 'Семіздік', 'Артрит'];

export default function ProfileSetupScreen({ navigation, route }) {
  const edit = route.params?.edit;
  const { colors: c, profile, saveProfile, showToast } = useApp();
  const [step, setStep] = useState(1);
  const { values, errors, setErrors, set } = useForm({
    age: profile?.age ?? 45, sex: profile?.sex ?? 'm',
    height: profile ? String(profile.height) : '', weight: profile ? String(profile.weight) : '',
    smoking: profile?.smoking ?? 'never', alcohol: profile?.alcohol ?? 'none', activity: profile?.activity ?? 'mid',
    sleep: profile?.sleep ?? 7, conditions: profile?.conditions ?? [],
  });

  const bmi = bmiOf(num(values.height), num(values.weight));

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (values.age < 18 || values.age > 100) e.age = 'Жас 18–100 аралығында болуы керек';
      const h = requiredRange(values.height, 100, 230, 'Бой'); if (h) e.height = h;
      const w = requiredRange(values.weight, 30, 300, 'Салмақ'); if (w) e.weight = w;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toggleCond = (name) => {
    const cur = values.conditions;
    set('conditions')(cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]);
  };

  const next = async () => {
    if (!validateStep()) return;
    if (step < 3) return setStep(step + 1);
    await saveProfile({
      age: values.age, sex: values.sex, height: num(values.height), weight: num(values.weight),
      smoking: values.smoking, alcohol: values.alcohol, activity: values.activity, sleep: values.sleep, conditions: values.conditions,
    });
    showToast('Профиль сақталды');
    if (edit) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };
  const back = () => (step > 1 ? setStep(step - 1) : edit ? navigation.goBack() : null);
  const titles = ['Жалпы мәлімет', 'Өмір салты', 'Денсаулық факторлары'];

  return (
    <Screen
      title={`${step}/3`}
      onBack={step > 1 || edit ? back : undefined}
      footer={
        <View style={{ flexDirection: 'row' }}>
          {step > 1 && <Button title="Артқа" variant="secondary" onPress={back} style={{ flex: 1, marginRight: 10 }} />}
          <Button title={step < 3 ? 'Әрі қарай' : 'Аяқтау'} onPress={next} style={{ flex: 2 }} />
        </View>
      }
    >
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {[1, 2, 3].map((k) => (
          <View key={k} style={{ flex: 1, height: 6, borderRadius: 3, marginRight: k < 3 ? 6 : 0, backgroundColor: k <= step ? c.primary : c.border }} />
        ))}
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: c.text, marginBottom: 20 }}>{titles[step - 1]}</Text>

      {step === 1 && (
        <>
          <Stepper label="Жасы" value={values.age} onChange={set('age')} min={18} max={100} unit="жас" error={errors.age} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 6 }}>Жынысы</Text>
          <Segmented style={{ marginBottom: 18 }} value={values.sex} onChange={set('sex')} options={[{ value: 'm', label: 'Ер' }, { value: 'f', label: 'Әйел' }]} />
          <Input label="Бойы (см)" keyboardType="numeric" value={values.height} onChangeText={set('height')} error={errors.height} placeholder="175" />
          <Input label="Салмағы (кг)" keyboardType="numeric" value={values.weight} onChangeText={set('weight')} error={errors.weight} placeholder="70" />
          <View style={{ alignSelf: 'flex-start', backgroundColor: c.tint, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
            <Text style={{ color: c.primary, fontWeight: '700' }}>ДСИ (BMI): {bmi ?? '—'}</Text>
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <OptionCards label="Темекі шегу" value={values.smoking} onChange={set('smoking')} options={[{ value: 'never', label: 'Жоқ' }, { value: 'former', label: 'Бұрын шектім' }, { value: 'current', label: 'Шегемін' }]} />
          <OptionCards label="Алкоголь" value={values.alcohol} onChange={set('alcohol')} options={[{ value: 'none', label: 'Жоқ' }, { value: 'rare', label: 'Сирек' }, { value: 'often', label: 'Жиі' }]} />
          <OptionCards label="Дене белсенділігі" value={values.activity} onChange={set('activity')} options={[{ value: 'low', label: 'Төмен' }, { value: 'mid', label: 'Орташа' }, { value: 'high', label: 'Жоғары' }]} />
          <Stepper label="Тәулігіне ұйқы" value={values.sleep} onChange={set('sleep')} min={3} max={12} unit="сағ" />
        </>
      )}

      {step === 3 && (
        <>
          <Text style={{ color: c.sub, marginBottom: 14 }}>Сізде бар факторларды белгілеңіз (міндетті емес)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {CONDITIONS.map((n) => <Chip key={n} label={n} selected={values.conditions.includes(n)} onPress={() => toggleCond(n)} />)}
            <Chip label="Ешқайсысы жоқ" selected={values.conditions.length === 0} onPress={() => set('conditions')([])} />
          </View>
        </>
      )}
    </Screen>
  );
}
