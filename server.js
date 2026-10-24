
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GROQ_API_KEY is missing in Render Environment."
      });
    }

    const body = req.body || {};
    let messages = [];

    if (Array.isArray(body.messages)) {
      messages = body.messages
        .filter(m =>
          m &&
          ["user", "assistant", "system"].includes(m.role) &&
          typeof m.content === "string"
        )
        .slice(-20);
    } else {
      const prompt =
        typeof body.message === "string" ? body.message :
        typeof body.prompt === "string" ? body.prompt : "";

      if (prompt.trim()) {
        messages = [{ role: "user", content: prompt.trim() }];
      }
    }

    if (!messages.length) {
      return res.status(400).json({
        error: "Please send a message."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "You are Slate AI, a helpful AI assistant. Explain topics clearly and accurately."
            },
            ...messages
          ],
          max_completion_tokens: 1024
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", response.status, data);
      return res.status(502).json({
        error: data?.error?.message || "Groq API request failed."
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (typeof reply !== "string") {
      return res.status(502).json({
        error: "Invalid response from Groq."
      });
    }

    return res.json({
      reply: reply,
      response: reply,
      message: reply
    });

  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      error: "Unable to connect to the AI service."
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Slate AI running on port ${PORT}`);
});
