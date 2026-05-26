const TYPEWRITER_MS = 30;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type GenerateBioInput = {
  name: string;
  title: string;
  business: string;
  category?: string;
};

export async function streamBioIntoTextarea(
  input: GenerateBioInput,
  onUpdate: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/generate-bio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    let message = "Bio generation failed.";
    try {
      const json = JSON.parse(errText) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      if (errText) message = errText;
    }
    throw new Error(message);
  }

  if (!res.body) throw new Error("No response stream.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let incoming = "";
  let displayed = "";
  let streamDone = false;

  onUpdate("");

  const drainTypewriter = async () => {
    while (incoming.length > 0 || !streamDone) {
      if (signal?.aborted) throw new Error("Cancelled");

      if (incoming.length > 0) {
        displayed += incoming[0];
        incoming = incoming.slice(1);
        onUpdate(displayed);
        await sleep(TYPEWRITER_MS);
      } else if (!streamDone) {
        await sleep(10);
      } else {
        break;
      }
    }
  };

  const readStream = async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        streamDone = true;
        break;
      }
      incoming += decoder.decode(value, { stream: true });
    }
  };

  await Promise.all([readStream(), drainTypewriter()]);
}
