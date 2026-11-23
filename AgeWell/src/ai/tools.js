import { generateImage } from './openai';
import { computeScore } from '../services/scoreService';
import { todayStr, isValidDate } from '../utils/date';
import { rangeError, isTime } from '../utils/validators';

// OpenAI function calling: агент қолданбаның нақты функцияларын шақыра алады
export const TOOL_DEFS = [
  {
    type: 'function',
    function: {
      name: 'add_health_record',
      description: 'Қолданушының денсаулық көрсеткіштерін жаңа жазба ретінде сақтайды (қан қысымы, пульс, қадам, ұйқы, су, салмақ).',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Күні YYYY-MM-DD. Көрсетілмесе — бүгін.' },
          sys: { type: 'number', description: 'Систолалық қысым' }, dia: { type: 'number', description: 'Диастолалық қысым' },
          pulse: { type: 'number' }, steps: { type: 'number' }, sleep: { type: 'number', description: 'Ұйқы сағатпен' },
          water: { type: 'number', description: 'Су, стақан' }, weight: { type: 'number', description: 'Салмақ, кг' },
          note: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_records',
      description: 'Соңғы N күндегі денсаулық жазбаларын қайтарады.',
      parameters: { type: 'object', properties: { days: { type: 'number', description: 'Күн саны, әдетте 7' } } },
    },
  },
  {
    type: 'function',
    function: { name: 'get_prediction', description: 'Салауатты қартаю индексін (0-100), биологиялық жасты және негізгі факторларды есептеп қайтарады.', parameters: { type: 'object', properties: {} } },
  },
  {
    type: 'function',
    function: {
      name: 'add_goal',
      description: 'Жаңа мақсат қосады.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          type: { type: 'string', enum: ['steps', 'water', 'sleep', 'weight', 'custom'] },
          target: { type: 'number' }, unit: { type: 'string' },
        },
        required: ['title', 'type', 'target'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_medication',
      description: 'Дәрі қабылдау ескертуін қосады.',
      parameters: {
        type: 'object',
        properties: { name: { type: 'string' }, dose: { type: 'string' }, time: { type: 'string', description: 'HH:MM, мысалы 08:30' } },
        required: ['name', 'time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_image',
      description: 'Қолданушыға сурет генерациялайды (мысалы, салауатты тағам, жаттығу иллюстрациясы). Нәтиже чатта көрсетіледі.',
      parameters: { type: 'object', properties: { prompt: { type: 'string', description: 'Суреттің толық сипаттамасы' } }, required: ['prompt'] },
    },
  },
];

const clamp = (v, min, max, label) => {
  if (v === undefined || v === null) return null;
  const err = rangeError(v, min, max, label);
  if (err) throw new Error(err);
  return Number(v);
};

// Әр құрал үшін орындаушы. ctx — AppContext әрекеттері. Нәтиже — JSON мәтін (модельге қайтады).
export async function runTool(name, args, ctx) {
  try {
    switch (name) {
      case 'add_health_record': {
        const date = args.date || todayStr();
        if (!isValidDate(date)) throw new Error('Күн форматы қате');
        const data = {
          date, mood: null, note: args.note || '',
          sys: clamp(args.sys, 70, 250, 'Систолалық қысым'), dia: clamp(args.dia, 40, 150, 'Диастолалық қысым'),
          pulse: clamp(args.pulse, 30, 220, 'Пульс'), steps: clamp(args.steps, 0, 100000, 'Қадам'),
          sleep: clamp(args.sleep, 0, 24, 'Ұйқы'), water: clamp(args.water, 0, 30, 'Су'), weight: clamp(args.weight, 20, 300, 'Салмақ'),
        };
        if ((data.sys && !data.dia) || (!data.sys && data.dia)) throw new Error('Қысымның екі мәні де қажет');
        if (!['sys', 'pulse', 'steps', 'sleep', 'water', 'weight'].some((k) => data[k] !== null)) throw new Error('Көрсеткіш берілмеген');
        await ctx.addEntry(data);
        ctx.log('Жазба сақталды');
        return JSON.stringify({ ok: true, saved: data });
      }
      case 'get_recent_records': {
        const days = Math.min(Math.max(Number(args.days) || 7, 1), 60);
        const { entries } = ctx.getState();
        const list = entries.slice(0, days * 2).filter((e) => {
          const diff = (new Date(todayStr()) - new Date(e.date)) / 86400000;
          return diff < days;
        });
        return JSON.stringify(list.map(({ id, owner, createdAt, ...r }) => r));
      }
      case 'get_prediction': {
        const { profile, entries } = ctx.getState();
        const p = computeScore(profile, entries.slice(0, 14));
        return JSON.stringify(p ? { score: p.score, level: p.level.label, biologicalAge: p.bioAge, chronologicalAge: profile.age, factors: p.factors.map((f) => ({ label: f.label, impact: f.impact })) } : { error: 'Профиль жоқ' });
      }
      case 'add_goal': {
        if (!args.title || !(Number(args.target) > 0)) throw new Error('Мақсат атауы мен мәні қажет');
        await ctx.addGoal({ title: args.title, type: args.type || 'custom', target: Number(args.target), unit: args.unit || '' });
        ctx.log('Мақсат қосылды');
        return JSON.stringify({ ok: true });
      }
      case 'add_medication': {
        if (!isTime(args.time)) throw new Error('Уақыт HH:MM форматында болуы керек');
        await ctx.addMedWithReminder({ name: args.name, dose: args.dose || '', time: args.time });
        ctx.log('Дәрі ескертуі қосылды');
        return JSON.stringify({ ok: true });
      }
      case 'generate_image': {
        const uri = await generateImage(ctx.apiKey, ctx.imageModel, args.prompt);
        ctx.images.push(uri);
        ctx.log('Сурет жасалды');
        return JSON.stringify({ ok: true, note: 'Сурет қолданушыға чатта көрсетілді.' });
      }
      default:
        return JSON.stringify({ error: 'Белгісіз құрал' });
    }
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}
