import { chatCompletion } from './openai';
import { TOOL_DEFS, runTool } from './tools';
import { computeScore } from '../services/scoreService';
import { todayStr } from '../utils/date';

// Диалог жады: соңғы хабарламалар модельге қайта беріледі. Осының арқасында «оны», «сол», «бұрынғы мәнді»
// сияқты сілтеме сөздер (anaphora/coreference) алдыңғы контекст бойынша шешіледі —
// ИАЖ семинарындағы LSTM-контекст идеясының заманауи (LLM) баламасы.
export function buildSystemPrompt(state) {
  const { profile, entries } = state;
  const p = computeScore(profile, entries.slice(0, 14));
  const last = entries[0];
  return [
    'Сен AgeWell қосымшасының AI көмекшісісің: салауатты қартаю, өмір салты, ұйқы, тамақтану, белсенділік бойынша кеңес бересің.',
    'Қолданушы қай тілде жазса, сол тілде жауап бер (әдетте қазақша). Қысқа, нақты, достық үнмен жаз.',
    'Сен дәрігер емессің: диагноз қойма, дәрі тағайындама. Қауіпті белгілерде (көкірек ауруы, естен тану, өте жоғары қысым) бірден 103/112 қоңырау шалуды немесе дәрігерге бару керегін айт.',
    'Қолданушы мәлімет жазуды сұраса (қысым, пульс, қадам, ұйқы, су, салмақ), мақсат немесе дәрі ескертуін қосуды сұраса — тиісті құралды (function) шақыр, содан кейін не істегеніңді қысқа растап бер. Мәндерді өздігінен ойлап таппа: жетіспесе сұра.',
    'Диалог контекстін ескер: «оны», «сол», «бұрынғы», «қайта» деген сөздер алдыңғы хабарламаларға сілтейді.',
    'Бүгінгі күн: ' + todayStr() + '.',
    profile ? `Қолданушы: ${profile.age} жаста, ${profile.sex === 'm' ? 'ер' : 'әйел'}, бойы ${profile.height} см, салмағы ${profile.weight} кг, темекі: ${profile.smoking}, алкоголь: ${profile.alcohol}, белсенділік: ${profile.activity}, созылмалы факторлар: ${(profile.conditions || []).join(', ') || 'жоқ'}.` : '',
    p ? `Ағымдағы индекс: ${p.score}/100 (${p.level.label}), биологиялық жас ${p.bioAge}.` : '',
    last ? `Соңғы жазба (${last.date}): ${JSON.stringify({ sys: last.sys, dia: last.dia, pulse: last.pulse, steps: last.steps, sleep: last.sleep, water: last.water, weight: last.weight })}` : '',
  ].filter(Boolean).join('\n');
}

// Агент циклі: модель құрал шақырса — орындаймыз, нәтижені қайтарамыз, жауап дайын болғанша қайталаймыз.
export async function runAgent({ apiKey, model, history, userText, ctx }) {
  const messages = [
    { role: 'system', content: buildSystemPrompt(ctx.getState()) },
    ...history.slice(-20).map((m) => ({ role: m.role, content: m.text || (m.imageNote ? '[сурет жасалған]' : '') })).filter((m) => m.content),
    { role: 'user', content: userText },
  ];
  for (let step = 0; step < 6; step++) {
    const data = await chatCompletion(apiKey, model, messages, TOOL_DEFS);
    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error('Бос жауап келді');
    if (msg.tool_calls?.length) {
      messages.push({ role: 'assistant', content: msg.content || null, tool_calls: msg.tool_calls });
      for (const call of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(call.function.arguments || '{}'); } catch (e) {}
        const result = await runTool(call.function.name, args, ctx);
        messages.push({ role: 'tool', tool_call_id: call.id, content: result });
      }
      continue;
    }
    return msg.content || '';
  }
  return 'Сұранысты аяқтай алмадым. Қайта тұжырымдап көріңіз.';
}
