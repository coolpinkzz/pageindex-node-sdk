## PageIndex Node SDK (`pageindex-node-sdk`)

**Node-first TypeScript SDK for the [PageIndex](https://docs.pageindex.ai/) API.**  
PageIndex is a vectorless, reasoning-based RAG framework that turns long, complex documents into a tree-structured index and lets LLMs perform agentic reasoning over that structure for context‑aware, traceable retrieval — with **no vector database** and **no chunking** required.  
This SDK wraps the core HTTP endpoints (PDF upload, document status/tree/OCR, listing, deletion, and Chat API with streaming) for easy use from Node.js.

### Install

```bash
npm install pageindex-node-sdk
# or
yarn add pageindex-node-sdk
```

### Requirements

- **Node.js >= 18** (uses built‑in `fetch`, `FormData`, `ReadableStream`)
- A PageIndex API key from the [Developer Dashboard](https://dash.pageindex.ai/)

---

### Quickstart (TypeScript / ESM)

```ts
import { PageIndexClient } from "pageindex-node-sdk";

const client = new PageIndexClient({
  apiKey: process.env.PAGEINDEX_API_KEY!,
});

async function main() {
  // 1) Upload a PDF
  const { doc_id } = await client.submitDocumentFromPath({
    path: "./2023-annual-report.pdf",
  });
  console.log("doc_id:", doc_id);

  // 2) Poll until tree processing is complete
  let status = "processing";
  while (status !== "completed") {
    const doc = await client.getTree(doc_id);
    status = doc.status;
    console.log("status:", status, "retrieval_ready:", doc.retrieval_ready);
    if (status !== "completed") {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // 3) Non‑streaming chat
  const chat = await client.chatCompletions({
    doc_id,
    messages: [
      { role: "user", content: "What are the key findings in this document?" },
    ],
    enable_citations: true,
  });
  console.log(chat.choices?.[0]?.message?.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

---

### Streaming chat example

```ts
import { PageIndexClient } from "pageindex-node-sdk";

const client = new PageIndexClient({
  apiKey: process.env.PAGEINDEX_API_KEY!,
});

async function streamChat(docId: string) {
  for await (const evt of client.chatCompletionsStream({
    doc_id: docId,
    messages: [
      { role: "user", content: "Summarize this document in 5 bullet points." },
    ],
    enable_citations: true,
  })) {
    if (evt.type === "data") {
      const delta = evt.data.choices?.[0]?.delta?.content ?? "";
      if (delta) process.stdout.write(delta);
    } else if (evt.type === "done") {
      break;
    }
  }
  process.stdout.write("\n");
}
```

---

### API overview

All methods live on `PageIndexClient`:

- **Constructor**
  - `new PageIndexClient({ apiKey, baseUrl?, fetch? })`
    - `apiKey` (**required**): your PageIndex API key (sent via `api_key` header).
    - `baseUrl` (optional): defaults to `https://api.pageindex.ai`.
    - `fetch` (optional): custom `fetch` implementation (e.g. for tests).

- **PDF processing**
  - `submitDocument({ file, filename?, mode? })`
    - Wraps `POST /doc/` with `multipart/form-data`.
  - `submitDocumentFromPath({ path, filename?, mode? })`
    - Node‑only helper that reads a local PDF and calls `submitDocument`.

- **Document results**
  - `getDocument(docId, { type?, format?, summary? })`
    - Generic wrapper over `GET /doc/{doc_id}/`.
  - `getTree(docId, { summary? })`
    - Convenience wrapper for `type=tree`.
  - `getOcr(docId, { format? })`
    - Convenience wrapper for `type=ocr` + `format=page|node|raw`.

- **Metadata & management**
  - `getDocumentMetadata(docId)`
    - `GET /doc/{doc_id}/metadata`
  - `listDocuments({ limit?, offset? })`
    - `GET /docs`
  - `deleteDocument(docId)`
    - `DELETE /doc/{doc_id}/`

- **Chat API (beta)**
  - `chatCompletions(request)`
    - Non‑streaming `POST /chat/completions`.
  - `chatCompletionsStream(request)`
    - Streaming via Server‑Sent Events (SSE); yields parsed events with:
      - `type: "data" | "done" | "comment"`
      - `data`: parsed chunk (when `type === "data"`).

The request/response shapes are aligned with the official [PageIndex API reference](https://docs.pageindex.ai/endpoints).

---

## Contribution Guidelines

- **Issues & feature requests**
  - Open a GitHub issue with:
    - A clear description of the problem or feature.
    - Steps to reproduce (if applicable).
    - Environment details (Node version, OS).

- **Pull requests**
  - Fork the repository.
  - Create a feature branch (`feat/my-feature` or `fix/my-bug`).
  - Ensure:
    - `npm run typecheck` passes.
    - `npm run lint` passes.
  - Write clear commit messages and, where useful, update this `README.md` or code comments for non-obvious behavior.

- **Code style**
  - Follow existing patterns in `src/pageindex-client.ts` and `src/types.ts`.
  - Prefer small, focused PRs.

---

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
