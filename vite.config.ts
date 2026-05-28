import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

interface LocalGeneratePayload {
  prompt?: string;
  type?: 'email' | 'linkedin' | 'instagram' | 'custom';
  options?: {
    emailTone?: 'professional' | 'short' | 'formal' | 'friendly';
    linkedinHook?: 'viral' | 'technical' | 'standard';
  };
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

interface OpenAiGenerateResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
}

const buildSystemPrompt = (type: LocalGeneratePayload['type'], options: LocalGeneratePayload['options'] = {}) => {
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

const parseJsonBody = async (req: import('http').IncomingMessage): Promise<LocalGeneratePayload> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw) as LocalGeneratePayload;
  } catch {
    return {};
  }
};

const json = (res: import('http').ServerResponse, code: number, payload: unknown) => {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'local-ai-gateway',
        configureServer(server) {
          server.middlewares.use('/api/ai/generate', async (req, res, next) => {
            if (req.method !== 'POST') {
              return next();
            }

            const body = await parseJsonBody(req);
            const prompt = String(body.prompt ?? '').trim();
            const type = body.type;
            const options = body.options ?? {};

            if (!prompt) {
              return json(res, 400, { error: 'Prompt is required.' });
            }
            if (!['email', 'linkedin', 'instagram', 'custom'].includes(type ?? '')) {
              return json(res, 400, { error: 'Invalid generation type.' });
            }

            const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
            const openAiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
            const systemPrompt = buildSystemPrompt(type, options);

            try {
              if (geminiKey) {
                const response = await fetch(
                  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
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
                  return json(res, 500, { error: `Gemini request failed: ${response.status} ${response.statusText} - ${errorBody}` });
                }

                const data = (await response.json()) as GeminiGenerateResponse;
                const completion = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                if (!completion) {
                  return json(res, 500, { error: 'No completion returned from Gemini.' });
                }

                return json(res, 200, { completion });
              }

              if (!openAiKey) {
                return json(res, 500, { error: 'Set GEMINI_API_KEY or OPENAI_API_KEY for local AI generation.' });
              }

              const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${openAiKey}`,
                },
                body: JSON.stringify({
                  model: env.OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
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
                return json(res, 500, { error: `OpenAI request failed: ${response.status} ${response.statusText} - ${errorBody}` });
              }

              const data = (await response.json()) as OpenAiGenerateResponse;
              const completion = data?.choices?.[0]?.message?.content?.trim();
              if (!completion) {
                return json(res, 500, { error: 'No completion returned from OpenAI.' });
              }

              return json(res, 200, { completion });
            } catch (error) {
              return json(res, 500, {
                error: error instanceof Error ? error.message : 'Local AI gateway failed.',
              });
            }
          });
        },
      },
    ],
  };
});
