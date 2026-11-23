// OpenAI REST клиенті. API кілті қолданушының өз құрылғысында (SecureStore) сақталады, кодта жоқ.
const BASE = 'https://api.openai.com/v1';

async function post(path, apiKey, body, timeoutMs = 120000) {
  if (!apiKey) throw new Error('OpenAI API кілті енгізілмеген. Баптаулар → AI бөлімінен енгізіңіз.');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.error?.message || `HTTP ${res.status}`;
      if (res.status === 401) throw new Error('API кілті қате немесе жарамсыз.');
      if (res.status === 429) throw new Error('Лимит немесе баланс таусылды: ' + msg);
      throw new Error(msg);
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Сұраныс тым ұзаққа созылды. Қайта көріңіз.');
    if (e.message?.includes('Network request failed')) throw new Error('Интернет байланысы жоқ.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const chatCompletion = (apiKey, model, messages, tools) =>
  post('/chat/completions', apiKey, { model, messages, ...(tools?.length ? { tools } : {}) });

// Сурет генерациясы: gpt-image модельдері base64 қайтарады
export async function generateImage(apiKey, model, prompt) {
  const data = await post('/images/generations', apiKey, { model, prompt, size: '1024x1024' });
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error('Сурет алынбады. Модель атауын тексеріңіз.');
  return `data:image/png;base64,${b64}`;
}

// Сурет талдау (vision): мәтін + сурет
export async function askWithImage(apiKey, model, prompt, imageDataUri, system) {
  const messages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    { role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageDataUri } }] },
  ];
  const data = await chatCompletion(apiKey, model, messages);
  return data.choices?.[0]?.message?.content || '';
}

export async function ask(apiKey, model, prompt, system) {
  const messages = [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: prompt }];
  const data = await chatCompletion(apiKey, model, messages);
  return data.choices?.[0]?.message?.content || '';
}
