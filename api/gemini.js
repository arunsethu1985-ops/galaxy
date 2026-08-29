export default async function handler(req, res) {
  try {
    // ======================================================
    // 1. ONLY ALLOW POST
    // ======================================================

    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }


    // ======================================================
    // 2. CHECK API KEY
    // ======================================================

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel."
      });
    }


    // ======================================================
    // 3. READ REQUEST
    // ======================================================

    const {
      message,
      prompt,
      history = [],
      mode = "chat"
    } = req.body || {};

    const userMessage =
      typeof message === "string" && message.trim()
        ? message.trim()
        : typeof prompt === "string"
        ? prompt.trim()
        : "";


    if (!userMessage) {
      return res.status(400).json({
        error: "Message is required"
      });
    }


    // ======================================================
    // 4. LOCAL GALAXY IDENTITY
    //    GEMINI IS NOT CALLED FOR THESE QUESTIONS
    // ======================================================

    const normalizedMessage = userMessage
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();


    const creatorQuestions = [
      "who created you",
      "who made you",
      "who built you",
      "who founded you",
      "who designed you",
      "who developed you",
      "who is your creator",
      "who is your founder",

      "who created galaxy",
      "who created galaxy ai",
      "who made galaxy",
      "who made galaxy ai",
      "who built galaxy",
      "who built galaxy ai",
      "who founded galaxy",
      "who founded galaxy ai",
      "who designed galaxy",
      "who designed galaxy ai",
      "who developed galaxy",
      "who developed galaxy ai",
      "who owns galaxy",
      "who owns galaxy ai"
    ];


    const isCreatorQuestion =
      creatorQuestions.some(question =>
        normalizedMessage.includes(question)
      );


    if (isCreatorQuestion) {
      const reply =
        "Harshavardhan created and founded GALAXY AI.";

      return res.status(200).json({
        reply,
        text: reply,
        response: reply,
        provider: "galaxy-local"
      });
    }


    // ======================================================
    // 5. OTHER LOCAL IDENTITY QUESTIONS
    // ======================================================

    if (
      normalizedMessage === "who are you" ||
      normalizedMessage === "what are you"
    ) {
      const reply =
        "I am GALAXY AI, created and founded by Harshavardhan.";

      return res.status(200).json({
        reply,
        text: reply,
        response: reply,
        provider: "galaxy-local"
      });
    }


    if (
      normalizedMessage === "what is your name" ||
      normalizedMessage === "whats your name" ||
      normalizedMessage === "your name"
    ) {
      const reply =
        "My name is GALAXY AI.";

      return res.status(200).json({
        reply,
        text: reply,
        response: reply,
        provider: "galaxy-local"
      });
    }


    if (
      normalizedMessage.includes("are you gemini") ||
      normalizedMessage.includes("are you google gemini")
    ) {
      const reply =
        "I am GALAXY AI, created and founded by Harshavardhan. " +
        "I use Gemini technology through an API to provide AI responses.";

      return res.status(200).json({
        reply,
        text: reply,
        response: reply,
        provider: "galaxy-local"
      });
    }


    // ======================================================
    // 6. SYSTEM INSTRUCTION
    // ======================================================

    const systemInstruction =
      mode === "work"
        ? `
You are GALAXY AI operating in Work mode.

GALAXY AI was created and founded by Harshavardhan.

Your purpose in Work mode is to help the user:
- create
- edit
- plan
- code
- analyze
- design
- improve professional work

Be intelligent, practical, accurate and clear.

Give useful completed results whenever possible.

For coding:
- provide clean working code
- identify errors clearly
- preserve existing project structure unless changes are necessary

For writing:
- be professional and polished

For analysis:
- explain the important reasoning clearly
- do not invent facts

GALAXY AI uses Gemini technology through an API for AI responses.
`.trim()
        : `
You are GALAXY AI.

GALAXY AI was created and founded by Harshavardhan.

If the user asks who created, made, founded, built,
designed, developed or owns GALAXY AI, answer:

"Harshavardhan created and founded GALAXY AI."

Do not claim that Google, Gemini, OpenAI
or another company created GALAXY AI.

Gemini is technology used by GALAXY AI through an API.

Answer the user's actual question directly.

Be:
- intelligent
- accurate
- helpful
- clear
- friendly

Explain difficult ideas simply.

For coding questions:
- provide complete useful code
- identify likely errors first
- avoid unnecessary changes

For school questions:
- teach step by step

For professional questions:
- use professional language

Do not invent facts when uncertain.
`.trim();


    // ======================================================
    // 7. CLEAN CHAT HISTORY
    // ======================================================

    const cleanHistory =
      Array.isArray(history)
        ? history
            .filter(
              item =>
                item &&
                typeof item.content === "string" &&
                (
                  item.role === "user" ||
                  item.role === "assistant"
                )
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


    // Avoid accidentally duplicating the current message
    const lastHistoryItem =
      cleanHistory[cleanHistory.length - 1];


    const alreadyContainsCurrentMessage =
      lastHistoryItem &&
      lastHistoryItem.role === "user" &&
      lastHistoryItem.content.trim() === userMessage;


    if (!alreadyContainsCurrentMessage) {
      contents.push({
        role: "user",
        parts: [
          {
            text: userMessage
          }
        ]
      });
    }


    // ======================================================
    // 8. MODEL LIST
    // ======================================================

    const models = [
      "gemini-3.7-flash",
      "gemini-3.6-flash"
    ];


    let lastError =
      "GALAXY AI is temporarily unavailable.";


    // ======================================================
    // 9. TRY PRIMARY MODEL + FALLBACK
    // ======================================================

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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
                maxOutputTokens: 4096
              }
            })
          }
        );


        const data = await response
          .json()
          .catch(() => ({}));


        if (!response.ok) {
          lastError =
            data?.error?.message ||
            `Gemini API error ${response.status}`;

          console.error(
            `GALAXY ${model} ERROR:`,
            JSON.stringify(data)
          );


          const retryable =
            response.status === 429 ||
            response.status === 500 ||
            response.status === 502 ||
            response.status === 503 ||
            response.status === 504;


          if (retryable) {
            continue;
          }


          return res.status(response.status).json({
            error: lastError
          });
        }


        // ==================================================
        // 10. EXTRACT REPLY
        // ==================================================

        const reply =
          data?.candidates?.[0]?.content?.parts
            ?.map(part =>
              typeof part?.text === "string"
                ? part.text
                : ""
            )
            .join("")
            .trim();


        if (!reply) {
          lastError =
            `${model} returned an empty response.`;

          console.error(
            "GALAXY EMPTY RESPONSE:",
            JSON.stringify(data)
          );

          continue;
        }


        // ==================================================
        // 11. SUCCESS
        // ==================================================

        return res.status(200).json({
          reply,
          text: reply,
          response: reply,
          provider: "gemini",
          model
        });

      } catch (modelError) {
        lastError =
          modelError?.message ||
          "Gemini request failed.";

        console.error(
          `GALAXY ${model} CONNECTION ERROR:`,
          modelError
        );
      }
    }


    // ======================================================
    // 12. ALL MODELS FAILED
    // ======================================================

    return res.status(503).json({
      error:
        "GALAXY AI is temporarily busy. Please try again.",
      detail: lastError
    });


  } catch (error) {
    // ======================================================
    // 13. UNEXPECTED BACKEND ERROR
    // ======================================================

    console.error(
      "GALAXY BACKEND ERROR:",
      error
    );


    return res.status(500).json({
      error:
        error?.message ||
        "GALAXY AI backend request failed."
    });
  }
}
