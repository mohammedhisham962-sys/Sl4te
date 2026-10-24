const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self)");
  next();
});

app.post("/api/chat", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "Server is not configured" });
  }

  const { system, messages } = req.body || {};
  if (
    typeof system !== "string" ||
    system.length > 70000 ||
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > 60
  ) {
    return res.status(400).json({ error: "Bad request" });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 1500,
        system,
        messages
      })
    });

    if (!upstream.ok) {
      // Avoid returning upstream details or secrets to the browser.
      return res.status(upstream.status === 429 ? 429 : 502)
        .json({ error: upstream.status === 429
          ? "AI service rate limit reached"
          : "AI service request failed" });
    }

    const data = await upstream.json();
    const text = (data.content || [])
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("\n");

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(502).json({ error: "Could not reach AI service" });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Slate server listening on port ${PORT}`);
});
