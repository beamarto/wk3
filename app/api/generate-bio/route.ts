export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error("DEEPSEEK_API_KEY is not set");
    return new Response("Server configuration error.", { status: 500 });
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
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const name = body.name?.trim();
  const title = body.title?.trim();
  const business = body.business?.trim();
  const category = body.category?.trim() || "professional services";

  if (!name || !title || !business) {
    return new Response(
      JSON.stringify({
        error: "Name, title, and business are required.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const prompt = `Write a 2–3 sentence third-person professional biography for ${name}, who works as ${title} at ${business}${category ? ` in the ${category} space` : ""}. Keep it warm, concise, and suitable for a business directory. Do not use bullet points. Output only the bio text.`;

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
          stream: true,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
        }),
      },
    );
  } catch (err) {
    console.error("DeepSeek fetch failed:", err);
    return new Response("Failed to reach DeepSeek API.", { status: 502 });
  }

  if (!deepseekResponse.ok) {
    const errText = await deepseekResponse.text();
    console.error("DeepSeek error:", deepseekResponse.status, errText);
    return new Response("DeepSeek API error.", { status: 502 });
  }

  if (!deepseekResponse.body) {
    return new Response("No response body from DeepSeek.", { status: 502 });
  }

  const reader = deepseekResponse.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) controller.enqueue(encoder.encode(content));
            } catch {
              // skip malformed SSE chunks
            }
          }
        }
      } catch (err) {
        console.error("Stream error:", err);
        controller.error(err);
        return;
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
