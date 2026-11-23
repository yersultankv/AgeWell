import React, { useState } from 'react';
import { View, Text, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import { askWithImage } from '../ai/openai';

const SYSTEM = 'Сен тамақтану бойынша көмекшісің. Суреттегі тағамды анықта және қазақ тілінде қысқа талдау бер. Диагноз қойма.';
const PROMPT = `Суреттегі тағамды талда. Төмендегі форматпен жауап бер:
Тағам: ...
Шамамен калория: ... ккал (порцияға)
Белок/Май/Көмірсу: ... г
Салауатты қартаю үшін бағасы: X/10
Қысқа кеңес: 1-2 сөйлем.
Егер суретте тағам жоқ болса, соны айт.`;

export default function FoodAnalysisScreen({ navigation }) {
  const { colors: c, apiKey, settings, showToast } = useApp();
  const [img, setImg] = useState(null);
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = async (camera) => {
    try {
      const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert('Рұқсат қажет', camera ? 'Камераға рұқсат беріңіз.' : 'Галереяға рұқсат беріңіз.');
      const opts = { mediaTypes: ['images'], quality: 0.4, base64: true };
      const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (r.canceled || !r.assets?.[0]?.base64) return;
      setImg(`data:image/jpeg;base64,${r.assets[0].base64}`);
      setResult('');
    } catch (e) {
      showToast('Суретті ашу мүмкін болмады', 'error');
    }
  };

  const analyze = async () => {
    if (!apiKey) return Alert.alert('API кілті жоқ', 'Баптаулар → AI бөлімінде OpenAI кілтін енгізіңіз.');
    setBusy(true);
    try {
      setResult(await askWithImage(apiKey, settings.chatModel, PROMPT, img, SYSTEM));
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Тамақ талдау" onBack={() => navigation.goBack()}>
      <Card style={{ alignItems: 'center', minHeight: 240, justifyContent: 'center', marginBottom: 16 }}>
        {img ? <Image source={{ uri: img }} style={{ width: '100%', height: 260, borderRadius: 14 }} resizeMode="cover" /> : (
          <Text style={{ color: c.sub, textAlign: 'center' }}>Тағамның суретін түсіріңіз немесе галереядан таңдаңыз. AI құрамын, калориясын және пайдасын бағалайды.</Text>
        )}
      </Card>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <Button title="Камера" variant="secondary" onPress={() => pick(true)} style={{ flex: 1, marginRight: 10 }} />
        <Button title="Галерея" variant="secondary" onPress={() => pick(false)} style={{ flex: 1 }} />
      </View>
      <Button title="Талдау" onPress={analyze} disabled={!img} loading={busy} />
      {busy && <ActivityIndicator color={c.primary} style={{ marginTop: 16 }} />}
      {result ? (
        <Card style={{ marginTop: 16 }}>
          <Text selectable style={{ color: c.text, lineHeight: 22 }}>{result}</Text>
          <Text style={{ color: c.sub, fontSize: 12, marginTop: 10 }}>Бағалау шамамен жасалады, дәл өлшем емес.</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
