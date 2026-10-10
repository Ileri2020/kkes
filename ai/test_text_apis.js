const fs = require('node:fs');
const path = require('node:path');

const envPath = path.resolve(__dirname, '..', '.env');
const env = {};

for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (!match) continue;
  env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
}

function getFirstKey(prefix) {
  for (let i = 1; i <= 39; i += 1) {
    if (env[`${prefix}_${i}`]) {
      return { name: `${prefix}_${i}`, value: env[`${prefix}_${i}`] };
    }
  }
  if (env[prefix]) return { name: prefix, value: env[prefix] };
  return null;
}

async function requestJson(url, { key, body, timeoutMs = 30000 } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (key) headers.Authorization = `Bearer ${key}`;

  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = {};
  }
  return { response, data };
}

function textFromOpenAIResponse(data) {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) return content.map((part) => part.text || '').join('').trim();
  return '';
}

function summarizeFailure(data) {
  const error = data.error || {};
  return String(error.code || error.type || error.message || 'no error details').slice(0, 180);
}

async function testGroc() {
  const key = getFirstKey('GROC_API_KEY');
  if (!key) {
    console.log('GROC/Groq: SKIP (no configured key)');
    return;
  }

  const configuredUrl = env.GROC_API_URL || 'https://api.groc.ai/v1/chat/completions';
  const configuredModel = env.GROC_MODEL || 'gpt-4o-mini';
  try {
    const { response, data } = await requestJson(configuredUrl, {
      key: key.value,
      body: {
        model: configuredModel,
        messages: [{ role: 'user', content: 'Reply with exactly: TEXT TEST OK' }],
        temperature: 0,
        max_tokens: 32,
      },
    });
    const text = textFromOpenAIResponse(data);
    console.log(`GROC configured endpoint (${configuredModel}): HTTP ${response.status} ${response.ok ? 'OK' : 'FAIL'}${text ? ` | text=${JSON.stringify(text.slice(0, 80))}` : ` | ${summarizeFailure(data)}`}`);
    if (response.ok && text) return;
  } catch (error) {
    console.log(`GROC configured endpoint: NETWORK ERROR (${error.cause?.code || error.name})`);
  }

  // GROC_API_URL in this project may be a misconfigured Groq hostname. Verify
  // the same key against Groq's official model catalog before trying text models.
  try {
    const { response, data } = await requestJson('https://api.groq.com/openai/v1/models', { key: key.value });
    if (!response.ok) {
      console.log(`Groq official endpoint: model-list HTTP ${response.status} FAIL | ${summarizeFailure(data)}`);
      return;
    }

    const models = (data.data || [])
      .filter((model) => model.id && model.active !== false)
      .filter((model) => !/(whisper|embed|moderation|safety|guard|tts|speech|audio|transcri|rerank)/i.test(model.id))
      .map((model) => model.id);
    const priorities = [/gpt-oss/i, /llama.*versatile/i, /llama/i, /qwen/i, /compound/i];
    const candidates = [];
    for (const pattern of priorities) {
      for (const model of models) {
        if (pattern.test(model) && !candidates.includes(model)) candidates.push(model);
      }
    }
    if (!candidates.length) candidates.push(...models.slice(0, 2));

    for (const model of candidates.slice(0, 2)) {
      try {
        const { response: completion, data: result } = await requestJson('https://api.groq.com/openai/v1/chat/completions', {
          key: key.value,
          body: {
            model,
            messages: [{ role: 'user', content: 'Reply with exactly: TEXT TEST OK' }],
            temperature: 0,
            max_tokens: 32,
          },
        });
        const text = textFromOpenAIResponse(result);
        console.log(`Groq official endpoint (${model}): HTTP ${completion.status} ${completion.ok ? 'OK' : 'FAIL'}${text ? ` | text=${JSON.stringify(text.slice(0, 80))}` : ` | ${summarizeFailure(result)}`}`);
        if (completion.ok && text) return;
      } catch (error) {
        console.log(`Groq official endpoint (${model}): NETWORK ERROR (${error.cause?.code || error.name})`);
      }
    }
    if (!candidates.length) console.log('Groq official endpoint: no text models listed for this key.');
  } catch (error) {
    console.log(`Groq official endpoint: NETWORK ERROR (${error.cause?.code || error.name})`);
  }
}

async function testOpenRouterFreeText() {
  const key = getFirstKey('OPENROUTER_API_KEY');
  if (!key) {
    console.log('OpenRouter: SKIP (no configured key)');
    return;
  }

  try {
    const { response, data } = await requestJson('https://openrouter.ai/api/v1/models');
    if (!response.ok) {
      console.log(`OpenRouter model catalog: HTTP ${response.status} FAIL`);
      return;
    }

    const candidates = (data.data || [])
      .filter((model) => model.id?.endsWith(':free'))
      .filter((model) => /text/i.test(model.architecture?.modality || ''))
      .filter((model) => Number(model.pricing?.prompt) === 0 && Number(model.pricing?.completion) === 0)
      .map((model) => model.id)
      .slice(0, 8);

    if (!candidates.length) {
      console.log('OpenRouter: catalog returned no zero-priced :free text models.');
      return;
    }
    console.log(`OpenRouter: found ${candidates.length} zero-priced free text candidate(s); testing until a text response succeeds.`);

    for (const model of candidates) {
      try {
        const { response: completion, data: result } = await requestJson('https://openrouter.ai/api/v1/chat/completions', {
          key: key.value,
          body: {
            model,
            messages: [{ role: 'user', content: 'Reply with exactly: TEXT TEST OK' }],
            temperature: 0,
            max_tokens: 160,
          },
          timeoutMs: 45000,
        });
        const text = textFromOpenAIResponse(result);
        const cost = result.usage?.cost;
        console.log(`OpenRouter ${model}: HTTP ${completion.status} ${completion.ok ? 'OK' : 'FAIL'}${text ? ` | text=${JSON.stringify(text.slice(0, 80))}` : ` | ${summarizeFailure(result)}`} | reported_cost=${cost ?? 'unreported'}`);
        if (completion.ok && text) return;
      } catch (error) {
        console.log(`OpenRouter ${model}: NETWORK ERROR (${error.cause?.code || error.name})`);
      }
    }
    console.log('OpenRouter: no tested free model returned normal text.');
  } catch (error) {
    console.log(`OpenRouter model catalog: NETWORK ERROR (${error.cause?.code || error.name})`);
  }
}

(async () => {
  await testGroc();
  await testOpenRouterFreeText();
})().catch((error) => {
  console.error(`Test harness error: ${error.name}`);
  process.exitCode = 1;
});
