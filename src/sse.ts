import type { SseEvent } from "./types.js";

export async function* parseSseStream<T = unknown>(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseEvent<T>, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).replace(/\r$/, "");
      buffer = buffer.slice(idx + 1);

      if (!line) continue;
      if (line.startsWith(":")) {
        yield { type: "comment", raw: line };
        continue;
      }
      if (!line.startsWith("data:")) continue;

      const raw = line.slice("data:".length).trimStart();
      if (raw === "[DONE]") {
        yield { type: "done", raw };
        return;
      }

      yield { type: "data", data: JSON.parse(raw) as T, raw };
    }
  }
}

