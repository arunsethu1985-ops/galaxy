export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel."
      });
    }

    const {
      message,
      prompt,
      history = [],
      mode = "chat"
    } = req.body || {};

    const userMessage = message || prompt;

    if (!userMessage || typeof userMessage !== "string") {
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

GALAXY AI can use Google Gemini through an API.
`.trim()
        : `
You are GALAXY AI.

GALAXY AI was created and founded by Harshavardhan.

If the user asks:
- Who created you?
- Who made you?
- Who is your creator?
- Who founded GALAXY AI?
- Who owns GALAXY AI?

Answer:
"Harshavardhan created GALAXY AI."

Do not claim that Google or OpenAI created GALAXY AI.

If asked about the underlying technology, explain that GALAXY AI can use external AI models through APIs.

Answer the user's actual question directly.

Be helpful, clear and intelligent.
`.trim();

    const cleanHistory = Array.isArray(history)
      ? history
          .filter(
            item =>
              item &&
              typeof item.content === "string" &&
              (item.role === "user" ||
                item.role === "assistant")
          )
          .slice(-20)
      : [];

    const contents = [];

    for (const item of cleanHistory) {
      contents.push({
        role:
          item.role === "assistant"
            ? "model"
            : "user",
        parts: [
          {
            text: item.content
          }
        ]
      });
    }

    contents.push({
      role: "user",
      parts: [
        {
          text: userMessage
        }
      ]
    });

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },

        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: systemInstruction
              }
            ]
          },

          contents,

          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "GEMINI API ERROR:",
        JSON.stringify(data)
      );

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!reply) {
      return res.status(500).json({
        error: "Gemini returned an empty response."
      });
    }

    return res.status(200).json({
      reply,
      text: reply,
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
