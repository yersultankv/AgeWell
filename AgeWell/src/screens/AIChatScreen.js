import React, { useRef, useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { useApp } from '../context/AppContext';
import { useMedActions } from '../hooks';
import { runAgent } from '../ai/agent';
import { generateImage } from '../ai/openai';
import { uid } from '../utils/date';

const SUGGESTIONS = [
  'Бүгін қысымым 120/80, пульс 72 деп жазып қой',
  'Соңғы аптадағы көрсеткіштерімді талдап бер',
  'Күніне 8000 қадам мақсатын қос',
  'Салауатты таңғы ас суретін жаса',
];

export default function AIChatScreen({ navigation }) {
  const { colors: c, apiKey, settings, chat, addChat, clearChat, getState, addEntry, addGoal, showToast } = useApp();
  const { addMedWithReminder } = useMedActions();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const listRef = useRef(null);

  useEffect(() => { setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100); }, [chat.length, busy]);

  const send = async (override) => {
    const t = (override ?? text).trim();
    if (!t || busy) return;
    if (!apiKey) {
      return Alert.alert('API кілті жоқ', 'OpenAI API кілтін Баптаулар → AI бөлімінде енгізіңіз.', [
        { text: 'Бас тарту', style: 'cancel' }, { text: 'Баптауларға өту', onPress: () => navigation.navigate('Settings') },
      ]);
    }
    setText('');
    const history = chat;
    await addChat([{ id: uid(), role: 'user', text: t, ts: Date.now() }]);
    setBusy(true);
    try {
      if (imageMode) {
        // Тікелей сурет генерациясы режимі
        const uri = await generateImage(apiKey, settings.imageModel, t);
        await addChat([{ id: uid(), role: 'assistant', text: 'Міне, сурет:', image: uri, ts: Date.now() }]);
        setImageMode(false);
      } else {
        const images = [];
        const actions = [];
        const ctx = {
          getState, addEntry, addGoal, addMedWithReminder, apiKey, imageModel: settings.imageModel, images,
          log: (m) => actions.push(m),
        };
        const answer = await runAgent({ apiKey, model: settings.chatModel, history, userText: t, ctx });
        const msgs = [];
        if (actions.length) msgs.push({ id: uid(), role: 'assistant', kind: 'action', text: '✅ ' + actions.join(' · '), ts: Date.now() });
        images.forEach((img) => msgs.push({ id: uid(), role: 'assistant', text: '', image: img, ts: Date.now() }));
        msgs.push({ id: uid(), role: 'assistant', text: answer || 'Дайын.', ts: Date.now() });
        await addChat(msgs);
      }
    } catch (e) {
      await addChat([{ id: uid(), role: 'assistant', kind: 'error', text: '⚠️ ' + e.message, ts: Date.now() }]);
    } finally {
      setBusy(false);
    }
  };

  const confirmClear = () =>
    Alert.alert('Чатты тазалау', 'Барлық хабарламалар өшіріледі.', [
      { text: 'Бас тарту', style: 'cancel' }, { text: 'Тазалау', style: 'destructive', onPress: async () => { await clearChat(); showToast('Чат тазаланды'); } },
    ]);

  const renderItem = ({ item }) => {
    const mine = item.role === 'user';
    const bg = mine ? c.primary : item.kind === 'error' ? '#FDECEC' : item.kind === 'action' ? c.tint : c.surface;
    const fg = mine ? '#fff' : item.kind === 'error' ? c.error : c.text;
    return (
      <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
        <View style={{ maxWidth: '86%', backgroundColor: bg, padding: 12, borderRadius: 18, borderBottomRightRadius: mine ? 4 : 18, borderBottomLeftRadius: mine ? 18 : 4 }}>
          {item.image ? <Image source={{ uri: item.image }} style={{ width: 240, height: 240, borderRadius: 12, marginBottom: item.text ? 8 : 0 }} /> : null}
          {item.imageNote ? <Text style={{ color: c.sub, fontStyle: 'italic', marginBottom: 6 }}>🖼 Сурет (қосымша жабылғаннан кейін сақталмайды)</Text> : null}
          {item.text ? <Text selectable style={{ color: fg, lineHeight: 21 }}>{item.text}</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <Screen
      title="AI көмекші"
      scroll={false}
      padded={false}
      right={chat.length ? <TouchableOpacity onPress={confirmClear} hitSlop={10}><Ionicons name="trash-outline" size={22} color={c.sub} /></TouchableOpacity> : null}
    >
      {!apiKey && (
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginHorizontal: 20, marginBottom: 8, padding: 12, borderRadius: 14, backgroundColor: c.tint, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="key-outline" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: '700', marginLeft: 8, flex: 1 }}>OpenAI API кілтін енгізіңіз (Баптаулар → AI)</Text>
        </TouchableOpacity>
      )}
      <FlatList
        ref={listRef}
        data={chat}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 8, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="sparkles" size={34} color={c.primary} />
              </View>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', marginTop: 12 }}>Сәлем! Мен AgeWell AI</Text>
              <Text style={{ color: c.sub, textAlign: 'center', marginTop: 6 }}>Көрсеткіш жаза аламын, талдау жасаймын, мақсат/дәрі ескертуін қосамын және сурет жасаймын.</Text>
            </View>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} onPress={() => send(s)} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 12, marginBottom: 8 }}>
                <Text style={{ color: c.text }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
        ListFooterComponent={busy ? <View style={{ alignItems: 'flex-start' }}><View style={{ backgroundColor: c.surface, padding: 12, borderRadius: 18 }}><ActivityIndicator color={c.primary} /></View></View> : null}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: c.divider, backgroundColor: c.bg }}>
        <TouchableOpacity onPress={() => setImageMode((v) => !v)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: imageMode ? c.primary : c.tint, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
          <Ionicons name="image-outline" size={22} color={imageMode ? '#fff' : c.primary} />
        </TouchableOpacity>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={imageMode ? 'Қандай сурет жасайық?' : 'Хабарлама жазыңыз…'}
          placeholderTextColor={c.sub}
          multiline
          style={{ flex: 1, maxHeight: 110, minHeight: 44, backgroundColor: c.surface, borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, color: c.text, borderWidth: 1, borderColor: imageMode ? c.primary : c.border }}
        />
        <TouchableOpacity onPress={() => send()} disabled={busy || !text.trim()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8, opacity: busy || !text.trim() ? 0.5 : 1 }}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
