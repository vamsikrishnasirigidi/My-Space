/**
 * Options shared between UI components and the OpenAI service.
 */
interface GenerationOptions {
  emailTone?: 'professional' | 'short' | 'formal' | 'friendly';
  linkedinHook?: 'viral' | 'technical' | 'standard';
}

/**
 * Simple wrapper around OpenAI's Chat Completion endpoint.
 * It expects the API key to be provided via the environment variable
 * `VITE_OPENAI_API_KEY` (Vite loads variables prefixed with VITE_).
 *
 * The function receives the same payload shape used by the simulator so
 * existing components can stay unchanged – they just call `callOpenAI`.
 */
export async function callOpenAI({
  prompt,
  type,
}: {
  prompt: string;
  type: 'email' | 'linkedin' | 'instagram' | 'custom';
  options?: GenerationOptions;
}): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Set VITE_OPENAI_API_KEY in your .env file.');
  }

  const systemPrompt = (() => {
    switch (type) {
      case 'email':
        return `You are an assistant that writes professional email copy. Use the tone provided in options.emailTone if present, otherwise use a professional tone.`;
      case 'linkedin':
        return `You are an assistant that creates LinkedIn posts. Use the hook style from options.linkedinHook if present (viral, technical, standard).`;
      case 'instagram':
        return `You are an assistant that writes Instagram captions. Keep it concise, engaging and include relevant emojis.`;
      case 'custom':
        return `You are a versatile copywriter. Generate custom content based on the user prompt.`;
      default:
        return '';
    }
  })();

  const body = {
    model: 'gpt-3.5-turbo', // you can change to a higher model if desired
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText} – ${errorBody}`);
  }

  const data = await response.json();
  const completion = data.choices?.[0]?.message?.content?.trim();
  if (!completion) {
    throw new Error('No completion returned from OpenAI.');
  }
  return completion;
}
