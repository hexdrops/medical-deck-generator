module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-app-password");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  // ── Password check ────────────────────────────────────────────────────────
  const APP_PASSWORD = process.env.APP_PASSWORD;
  const provided     = req.headers["x-app-password"];

  if (APP_PASSWORD && provided !== APP_PASSWORD) {
    return res.status(401).json({ error: { message: "Incorrect password." } });
  }

  // ── Verify endpoint (GET) — used by the login screen ─────────────────────
  if (req.method === "GET") {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") { res.status(405).end("Method Not Allowed"); return; }

  // ── Proxy to Anthropic ────────────────────────────────────────────────────
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) {
    return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY not configured on server." } });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type":      "application/json",
        "x-api-key":         KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(req.body)
    });

    const data = await upstream.text();
    res.status(upstream.status).setHeader("content-type", "application/json").send(data);
  } catch (err) {
    res.status(502).json({ error: { message: "Proxy error: " + err.message } });
  }
};
