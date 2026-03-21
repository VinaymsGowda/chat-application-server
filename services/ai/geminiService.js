const { GoogleGenAI } = require("@google/genai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const geminiAiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function buildPromptFromConversationHistory(
  conversationHistory,
  userMessage,
) {
  const systemPrompt =
    "You are a helpful assistant for a chat application. Answer the user's questions based on the conversation history.";

  const conversationPrompt = conversationHistory
    .map((entry) => {
      return `${entry.sender?.name || "User"}: ${entry.content}`;
    })
    .join("\n");

  return `${systemPrompt}
    Conversation History:${conversationPrompt}
    User: ${userMessage}
    Assistant:`;
}

/**
 * Stream a Gemini response, calling onChunk for each text chunk received.
 * Returns the full concatenated response string once the stream is complete.
 *
 * @param {string} prompt
 * @param {(chunk: string) => void} onChunk
 * @returns {Promise<string>}
 */
async function streamGeminiResponse(prompt, onChunk) {
  try {
    const stream = await geminiAiClient.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      
    });

    let fullText = "";
    for await (const chunk of stream) {
      const chunkText = chunk.text ?? "";
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Error streaming response from Gemini API:", error);
    throw error;
  }
}

const geminiService = {
  buildPromptFromConversationHistory,
  streamGeminiResponse,
};

module.exports = { geminiService };
