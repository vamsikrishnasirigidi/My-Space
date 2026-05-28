/**
 * AI text operation simulator for Formatter and Generator components.
 * Generates context-aware, beautiful text based on inputs.
 */

import { callAIService } from '../services/ai';

export const aiSimulator = {
  /**
   * Simulates AI Formatter operations
   */
  formatText: async (text: string, action: 'optimize' | 'shorten' | 'enlarge'): Promise<string> => {
    // Artificial typing/server latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!text.trim()) {
      return "Please input some text first, and I will be delighted to format it for you.";
    }

    const words = text.split(/\s+/).filter(w => w.length > 0);
    const cleanText = text.trim();

    switch (action) {
      case 'optimize':
        return `✨ **Optimized Version (Professional & Clear)** ✨

Here is a polished, highly professional rewrite of your text. I have enhanced the vocabulary, corrected any grammatical flow, and structured it to maximize clarity:

"${cleanText.replace(/^[Tt]he\s+/, '')} represents a key priority. By optimizing this workflow, we can significantly accelerate productivity, refine clarity, and align deliverables with our ultimate objectives. This refined approach ensures that all operational milestones are met with maximum accuracy and professional impact."

*Key Enhancements:*
- Corrected sentence cadence and flow.
- Upgraded terminology to modern professional standards.
- Strengthened active verbs for increased persuasive impact.`;

      case 'shorten':
      {
        const highlight = words.slice(0, Math.min(words.length, 6)).join(' ');
        return `⚡ **Shortened Version (Concise & Impactful)** ⚡

Here is a streamlined, impact-driven summary of your input. I have condensed the core message to save reading time while retaining all vital context:

> **Core Takeaway:** ${highlight}... - Optimized to drive immediate action and clear understanding.

*Compression details:*
- Extracted core value proposition.
- Eliminated redundant adjectives.
- Reduced overall word count by approximately 60%.`;
      }

      case 'enlarge':
        return `🚀 **Expanded Version (Comprehensive & Detailed)** 🚀

Here is a thorough, highly detailed elaboration of your concept. I have unpacked your core points, mapped out adjacent implications, and provided actionable structured steps:

### 1. Conceptual Framework & Foundation
"${cleanText}" is built upon essential concepts that carry significant weight in modern workspaces. By analyzing these fundamentals, we gain insight into their impact on operational effectiveness.

### 2. Operational Strategies
To fully operationalize this idea, consider the following tactical approaches:
- **Phase A (Strategic Alignment):** Connect these core points with high-level team objectives.
- **Phase B (Execution & Automation):** Incorporate responsive tooling to minimize friction.
- **Phase C (Performance Audit):** Define measurable key performance indicators (KPIs) to analyze progress over time.

### 3. Immediate Recommended Next Steps
Begin by isolating your primary bottleneck, then leverage cooperative channels to establish a feedback loop. This layered framework ensures that your goals remain both ambitious and highly achievable.`;
      
      default:
        return text;
    }
  },

  /**
   * Simulates AI Content Generator operations
   */
  generateContent: async (
    prompt: string,
    type: 'email' | 'linkedin' | 'instagram' | 'custom',
    options?: {
      emailTone?: 'professional' | 'short' | 'formal' | 'friendly';
      linkedinHook?: 'viral' | 'technical' | 'standard';
    }
  ): Promise<string> => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      return "Please input a prompt or topic so I can generate beautiful custom copy for you.";
    }

    // Forward request to backend AI gateway (keys remain server-side)
    try {
      const result = await callAIService({
        prompt: cleanPrompt,
        type,
        options,
      });
      return result;
    } catch (err) {
      console.error('AI generation error', err);
      // Fallback to static mock if API fails
      return "Sorry, the AI service is currently unavailable. Please try again later.";
    }
  }
};
