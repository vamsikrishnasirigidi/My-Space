// src/services/gemini.ts
export interface GenerationOptions {
  emailTone?: 'professional' | 'short' | 'formal' | 'friendly';
  linkedinHook?: 'viral' | 'technical' | 'standard';
}

export async function callGemini({
  prompt,
  type,
  options,
}: {
  prompt: string;
  type: 'email' | 'linkedin' | 'instagram' | 'custom';
  options?: GenerationOptions;
}): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not found. Set VITE_GEMINI_API_KEY in your .env file.');
  }

  const systemPrompt = (() => {
    switch (type) {
      case 'email':
        return `You are an assistant that writes professional email copy. Use the tone: ${options?.emailTone ?? 'professional'}.`;
      case 'linkedin':
        return `You are an assistant that creates LinkedIn posts. Use the hook style: ${options?.linkedinHook ?? 'standard'}.`;
      case 'instagram':
        return `You are an assistant that writes Instagram captions. Keep it concise, engaging and include relevant emojis.`;
      case 'custom':
        return `You are a versatile copywriter. Generate custom content based on the user prompt.`;
      default:
        return 'You are a helpful assistant.';
    }
  })();

  const body = {
    // ✅ Fix 1: systemInstruction is a top-level field, not inside contents
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    // ✅ Fix 2: only 'user' and 'model' roles allowed in contents
    contents: [
      { role: 'user', parts: [{ text: prompt }] },
    ],
    generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
        thinkingConfig: {
            thinkingBudget: 0
        }
    }
  };

  // ✅ Fix 3: use v1beta not v1 — gemini-2.5-flash is only in v1beta
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${response.statusText} – ${errorBody}`);
  }

  const data = await response.json();
  const completion = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!completion) {
    throw new Error('No completion returned from Gemini.');
  }
  return completion;
}