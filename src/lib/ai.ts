import Groq from 'groq-sdk';

export interface AiExplanation {
  explanation: string;
  model: string;
  error?: string;
}

// Initialize Groq SDK with API key from environment variables
// Note: In a production client-side app, this key would be exposed. 
// For this MVP/Demo, it's acceptable, but should be proxied in the future.
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true 
});

/**
 * Checks if the AI service is configured (has API key).
 */
export async function checkAiHealth(): Promise<boolean> {
  return !!import.meta.env.VITE_GROQ_API_KEY;
}

/**
 * Generates an explanation for a transaction using Groq API.
 */
export async function generateAiExplanation(summaryJson: any): Promise<AiExplanation> {
  const prompt = `
You are a blockchain expert assistant. 
Analyze the following Sui transaction summary JSON and provide a 2-3 sentence explanation in plain English.
Focus on: Who sent what? What function was called? What was the outcome?
Do not mention internal object IDs or raw large numbers. Use "Sender" and "Receiver" where appropriate.

Transaction Data:
${JSON.stringify(summaryJson, null, 2)}

Explanation:
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      // Using Llama 3.3 70b via Groq for fast, high-quality inference
      model: "llama-3.3-70b-versatile", 
      temperature: 0.5,
      max_tokens: 150,
      top_p: 1,
      stream: false,
      stop: null
    });

    return {
        explanation: chatCompletion.choices[0]?.message?.content || "No explanation returned.",
        model: "llama-3.3-70b-versatile (via Groq)"
    };

  } catch (error: any) {
    console.warn("AI Generation failed", error);
    return { 
        explanation: "", 
        model: "", 
        error: `Groq API Error: ${error.message}` 
    };
  }
}
