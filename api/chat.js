module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is missing in Vercel."
    });
  }

  try {
    const body = req.body || {};
    const message = body.message || "";

    if (!message.trim()) {
      return res.status(400).json({
        error: "Message is required."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",

          instructions: `
You are GALAXY AI.

GALAXY AI was created and founded by Harshavardhan.

If anyone asks who created, made, founded, or owns GALAXY AI,
answer that Harshavardhan created GALAXY AI.

Do not claim that OpenAI or Google created GALAXY AI.

If asked about the underlying technology,
explain that GALAXY AI can use external AI models
through APIs depending on the selected provider.

Be helpful, clear, intelligent, and concise.
          `.trim(),

          input: message
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenAI API request failed."
      });
    }

    let reply = "";

    if (data.output_text) {
      reply = data.output_text;
    }

    if (!reply && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!Array.isArray(item.content)) continue;

        for (const content of item.content) {
          if (content.type === "output_text" && content.text) {
            reply += content.text;
          }
        }
      }
    }

    return res.status(200).json({
      reply: reply || "GALAXY did not return a response."
    });

  } catch (error) {
    console.error("GALAXY OpenAI backend error:", error);

    return res.status(500).json({
      error: error.message || "Internal server error."
    });
  }
};
