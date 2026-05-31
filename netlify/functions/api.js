exports.handler = async (event) => {

  // Diagnostic endpoint — visit /.netlify/functions/api in your browser
  // to confirm the key is being read correctly
  if (event.httpMethod === "GET") {
    const KEY = process.env.ANTHROPIC_API_KEY || "";
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        keyFound: KEY.length > 0,
        keyStartsWith: KEY.length > 0 ? KEY.substring(0, 7) + "..." : "NOT SET",
        keyLength: KEY.length
      })
    };
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" }
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: { message: "ANTHROPIC_API_KEY is not set in Netlify environment variables." } })
    };
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type":      "application/json",
        "x-api-key":         KEY,
        "anthropic-version": "2023-06-01"
      },
      body: event.body
    });

    return {
      statusCode: upstream.status,
      headers: {
        "content-type":                "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: await upstream.text()
    };

  } catch (err) {
    return {
      statusCode: 502,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: { message: "Function error: " + err.message } })
    };
  }
};
