import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Input from '../components/Input';
import Segmented from '../components/Segmented';
import { useApp } from '../context/AppContext';
import { useForm } from '../hooks';
import { isEmail } from '../utils/validators';

export default function AuthScreen({ navigation }) {
  const { colors: c, login, register, showToast, profile } = useApp();
  const [mode, setMode] = useState('login');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const { values, errors, setErrors, set } = useForm({ name: '', email: '', password: '', password2: '' });

  const validate = () => {
    const e = {};
    if (mode === 'register' && values.name.trim().length < 2) e.name = 'Аты-жөніңізді енгізіңіз';
    if (!isEmail(values.email)) e.email = 'Дұрыс email енгізіңіз';
    if (values.password.length < 6) e.password = 'Құпиясөз кемінде 6 таңба болуы керек';
    if (mode === 'register') {
      if (values.password !== values.password2) e.password2 = 'Құпиясөздер сәйкес емес';
      if (!agree) e.agree = 'Шарттармен келісу қажет';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    const res = mode === 'login' ? await login(values) : await register(values);
    setLoading(false);
    if (!res.ok) {
      setErrors({ [mode === 'login' && res.error.includes('Құпиясөз') ? 'password' : 'email']: res.error });
      return;
    }
    showToast(mode === 'login' ? 'Қош келдіңіз!' : 'Тіркеу сәтті аяқталды');
    // Тіркелген жаңа қолданушыда профиль жоқ — профиль құруға өтеді
    const dest = mode === 'register' ? 'ProfileSetup' : 'Splash';
    navigation.reset({ index: 0, routes: [{ name: dest }] });
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="leaf" size={32} color={c.primary} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: c.text, marginTop: 12 }}>Қош келдіңіз</Text>
      </View>
      <Segmented
        style={{ marginBottom: 20 }}
        value={mode}
        onChange={(m) => { setMode(m); setErrors({}); }}
        options={[{ value: 'login', label: 'Кіру' }, { value: 'register', label: 'Тіркелу' }]}
      />
      {mode === 'register' && (
        <Input label="Аты-жөні" icon="person-outline" value={values.name} onChangeText={set('name')} error={errors.name} placeholder="Ерсұлтан" autoCapitalize="words" />
      )}
      <Input label="Электрондық пошта" icon="mail-outline" keyboardType="email-address" value={values.email} onChangeText={set('email')} error={errors.email} placeholder="name@mail.com" />
      <Input label="Құпиясөз" icon="lock-closed-outline" secure value={values.password} onChangeText={set('password')} error={errors.password} placeholder="••••••" />
      {mode === 'register' && (
        <>
          <Input label="Құпиясөзді қайталаңыз" icon="lock-closed-outline" secure value={values.password2} onChangeText={set('password2')} error={errors.password2} placeholder="••••••" />
          <TouchableOpacity onPress={() => { setAgree(!agree); setErrors((e) => ({ ...e, agree: undefined })); }} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name={agree ? 'checkbox' : 'square-outline'} size={24} color={errors.agree ? c.error : c.primary} />
            <Text style={{ marginLeft: 8, color: c.text, flex: 1 }}>Қолдану шарттарымен келісемін</Text>
          </TouchableOpacity>
          {errors.agree ? <Text style={{ color: c.error, fontSize: 12 }}>{errors.agree}</Text> : null}
        </>
      )}
      {mode === 'login' && (
        <TouchableOpacity onPress={() => showToast('Бұл прототипте құпиясөзді қалпына келтіру жоқ', 'error')} style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
          <Text style={{ color: c.primary, fontWeight: '600' }}>Құпиясөзді ұмыттыңыз ба?</Text>
        </TouchableOpacity>
      )}
      <Button title={mode === 'login' ? 'Кіру' : 'Тіркелу'} onPress={submit} loading={loading} style={{ marginTop: 12 }} />
    </Screen>
  );
}
