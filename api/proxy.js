module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Diagnostic — visit /api/proxy in browser to check if key is loaded
  if (req.method === "GET") {
    const KEY = process.env.ANTHROPIC_API_KEY || "";
    return res.status(200).json({
      keyFound: KEY.length > 0,
      keyStartsWith: KEY.length > 0 ? KEY.substring(0, 7) + "..." : "NOT SET",
      keyLength: KEY.length
    });
  }

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).end("Method Not Allowed"); return; }

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
