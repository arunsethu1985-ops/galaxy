import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const {
      message,
      history = [],
      mode = "chat"
    } = req.body || {};

    if (
      !message ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const systemInstruction =
      mode === "work"
        ? `
You are GALAXY AI operating in Work mode.

GALAXY AI was created and is owned by Harshavardhan.

Help the user create, edit, plan, code, analyze, design and improve work.

Be intelligent, practical, clear and useful.

You are powered by Google Gemini through the Gemini API.
`.trim()
        : `
You are GALAXY AI.

GALAXY AI was created and is owned by Harshavardhan.

If the user asks:
- Who created you?
- Who owns you?
- Who is your founder?
- Who built GALAXY AI?

Answer clearly that GALAXY AI was created and is owned by Harshavardhan.

You are powered by Google Gemini through the Gemini API.

Answer the user's actual question directly.

Be helpful, clear and intelligent.
`.trim();

    const cleanHistory = history
      .filter(
        item =>
          item &&
          typeof item.content === "string" &&
          (
            item.role === "user" ||
            item.role === "assistant"
          )
      )
      .slice(-20);

    const historyText = cleanHistory
      .map(
        item =>
          `${
            item.role === "assistant"
              ? "Assistant"
              : "User"
          }: ${item.content}`
      )
      .join("\n\n");

    const contents = historyText
      ? `
Conversation history:

${historyText}

Current user message:

${message}
`.trim()
      : message;

    const response =
      await ai.models.generateContent({
        model: "gemini-3.7-flash",

        contents,

        config: {
          systemInstruction
        }
      });

    const reply =
      response.text?.trim();

    if (!reply) {
      return res.status(500).json({
        error:
          "Gemini returned an empty response."
      });
    }

    return res.status(200).json({
      reply,
      provider: "gemini"
    });

  } catch (error) {
    console.error(
      "GALAXY GEMINI ERROR:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Gemini request failed."
    });
  }
}
