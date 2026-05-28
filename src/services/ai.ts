export interface GenerationOptions {
  emailTone?: 'professional' | 'short' | 'formal' | 'friendly';
  linkedinHook?: 'viral' | 'technical' | 'standard';
}

interface GenerateRequest {
  prompt: string;
  type: 'email' | 'linkedin' | 'instagram' | 'custom';
  options?: GenerationOptions;
}

const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_AI_API_URL;
  return configured?.trim() ? configured : '/api/ai/generate';
};

export async function callAIService(payload: GenerateRequest): Promise<string> {
  const response = await fetch(getApiBaseUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI gateway request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data: { completion?: string } = await response.json();
  if (!data.completion?.trim()) {
    throw new Error('No completion returned from AI gateway.');
  }

  return data.completion.trim();
}
