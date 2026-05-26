export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    console.error("DEEPSEEK_API_KEY is not set");
    return jsonError(
      "Bio generation is not configured. Add DEEPSEEK_API_KEY in Vercel environment variables.",
      500,
    );
  }

  let body: {
    name?: string;
    title?: string;
    business?: string;
    category?: string;
  };

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const name = body.name?.trim();
  const title = body.title?.trim() || "Professional";
  const business = body.business?.trim() || name;
  const category = body.category?.trim() || "professional services";

  if (!name) {
    return jsonError("Name is required to generate a bio.", 400);
  }

  const prompt = `Write a 2–3 sentence third-person professional biography for ${name}, who works as ${title} at ${business} in the ${category} space. Keep it warm, concise, and suitable for a business directory. Do not use bullet points. Output only the bio text.`;

  let deepseekResponse: Response;
  try {
    deepseekResponse = await fetch(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          stream: false,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
        }),
        signal: AbortSignal.timeout(25_000),
      },
    );
  } catch (err) {
    console.error("DeepSeek fetch failed:", err);
    return jsonError(
      "Could not reach DeepSeek. Check your API key and account balance.",
      502,
    );
  }

  const responseText = await deepseekResponse.text();

  if (!deepseekResponse.ok) {
    console.error("DeepSeek error:", deepseekResponse.status, responseText);
    let detail = `DeepSeek API error (${deepseekResponse.status}).`;
    try {
      const errJson = JSON.parse(responseText) as {
        error?: { message?: string };
        message?: string;
      };
      detail =
        errJson.error?.message ??
        errJson.message ??
        detail;
    } catch {
      if (responseText.length < 200) detail = responseText || detail;
    }
    if (deepseekResponse.status === 401) {
      detail = "Invalid DeepSeek API key. Check DEEPSEEK_API_KEY on Vercel.";
    }
    return jsonError(detail, 502);
  }

  let bio = "";
  try {
    const parsed = JSON.parse(responseText) as {
      choices?: { message?: { content?: string } }[];
    };
    bio = parsed.choices?.[0]?.message?.content?.trim() ?? "";
  } catch {
    console.error("DeepSeek parse failed:", responseText.slice(0, 500));
    return jsonError("Unexpected response from DeepSeek.", 502);
  }

  if (!bio) {
    return jsonError("DeepSeek returned an empty bio.", 502);
  }

  return new Response(bio, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
