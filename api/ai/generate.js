const buildSystemPrompt = (type, options = {}) => {
  switch (type) {
    case 'email':
      return `You are an assistant that writes professional email copy. Use the tone: ${options.emailTone ?? 'professional'}.`;
    case 'linkedin':
      return `You are an assistant that creates LinkedIn posts. Use the hook style: ${options.linkedinHook ?? 'standard'}.`;
    case 'instagram':
      return 'You are an assistant that writes Instagram captions. Keep it concise, engaging, and include relevant emojis.';
    default:
      return 'You are a versatile copywriter. Generate custom content based on the user prompt.';
  }
};

const readBody = async (req) => {
  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  return {};
};

const callGemini = async ({ prompt, type, options }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const systemPrompt = buildSystemPrompt(type, options);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const completion = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!completion) {
    throw new Error('No completion returned from Gemini.');
  }
  return completion;
};

const callOpenAI = async ({ prompt, type, options }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const systemPrompt = buildSystemPrompt(type, options);
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const completion = data?.choices?.[0]?.message?.content?.trim();
  if (!completion) {
    throw new Error('No completion returned from OpenAI.');
  }
  return completion;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = await readBody(req);
    const prompt = String(payload.prompt ?? '').trim();
    const type = payload.type;
    const options = payload.options ?? {};

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    if (!['email', 'linkedin', 'instagram', 'custom'].includes(type)) {
      return res.status(400).json({ error: 'Invalid generation type.' });
    }

    let completion = '';
    if (process.env.GEMINI_API_KEY) {
      completion = await callGemini({ prompt, type, options });
    } else {
      completion = await callOpenAI({ prompt, type, options });
    }

    return res.status(200).json({ completion });
  } catch (error) {
    console.error('AI gateway error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'AI gateway failed.' });
  }
}
