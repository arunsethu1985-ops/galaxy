import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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
      webSearch = false,
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

    const conversation = [
      {
        role: "developer",
        content:
          mode === "work"
            ? `
You are GALAXY AI operating in Work mode.

Help the user create, edit, plan, code, analyze, design and improve work.

Be intelligent, concise when appropriate, detailed when necessary, and practical.

Use Markdown when useful.

Do not mention internal API implementation unless specifically asked.
`.trim()
            : `
You are GALAXY AI.

You are an advanced general-purpose AI assistant.

Help with questions, research, writing, coding, analysis, planning, creativity, learning and problem solving.

Answer the user's actual question directly.

Be clear, intelligent and useful.

Use Markdown when useful.

Do not say that you are only a frontend.
Do not say that a backend needs to be connected.
Do not repeat implementation instructions unless the user asks about the website itself.
`.trim()
      },

      ...history
        .filter(
          item =>
            item &&
            typeof item.content === "string" &&
            (
              item.role === "user" ||
              item.role === "assistant"
            )
        )
        .slice(-20),

      {
        role: "user",
        content: message
      }
    ];

    const request = {
      model: "gpt-5.6",
      reasoning: {
        effort: "low"
      },
      input: conversation
    };

    if (webSearch) {
      request.tools = [
        {
          type: "web_search"
        }
      ];
    }

    const response =
      await client.responses.create(
        request
      );

    const reply =
      response.output_text?.trim();

    if (!reply) {
      return res.status(500).json({
        error:
          "The AI returned an empty response."
      });
    }

    return res.status(200).json({
      reply
    });
  } catch (error) {
    console.error(
      "GALAXY API ERROR:",
      error
    );

    return res.status(
      error?.status || 500
    ).json({
      error:
        error?.message ||
        "GALAXY AI request failed."
    });
  }
}
