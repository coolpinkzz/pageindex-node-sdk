## Project Overview

**pageindex-node-sdk** is a **Node-first TypeScript SDK for the PageIndex API**.

It provides a strongly-typed `PageIndexClient` for:

- **Document ingestion** (upload PDFs from memory or disk)
- **Document retrieval** (tree / OCR views and summaries)
- **Document management** (metadata, list, delete)
- **Chat completions** over your documents (non-streaming and streaming via SSE)

The SDK is designed to be:

- **Node 18+ native** (uses built-in `fetch`, `ReadableStream`, and `FormData`)
- **ESM-only** (optimized for modern bundlers and runtimes)
- **Type-safe** for both requests and responses

---

## Features

- **Typed HTTP client**: `PageIndexClient` wraps all supported PageIndex API endpoints.
- **Document uploads**:
  - From a `Blob` (browser-like environments).
  - Directly from a file path (`submitDocumentFromPath`) in Node.
- **Flexible document retrieval**:
  - Tree vs OCR views via `DocResultType`.
  - OCR formats (`page`, `node`, `raw`) via `OcrFormat`.
  - Optional summaries.
- **Document management**:
  - Fetch metadata.
  - List documents with pagination.
  - Delete documents.
- **Chat completions**:
  - Standard (non-streaming) completions via `chatCompletions`.
  - Streaming completions over SSE via `chatCompletionsStream`.
- **First-class TypeScript support**:
  - Full type declarations distributed with the package.
  - Strict, modern TS configuration.

---

## Tech Stack

- **Language**: TypeScript (strict)
- **Runtime**: Node.js **>= 18** (required)
- **Module system**: ESM only (`"type": "module"`)
- **Build tool**: `tsup`
- **Linting**: `eslint` with `typescript-eslint`

---

## Project Structure

Important files and directories:

- **`package.json`**
  - Library metadata and NPM scripts.
  - ESM and type export configuration:
    - `main: "./dist/index.js"`
    - `types: "./dist/index.d.ts"`
    - `exports["."].import: "./dist/index.js"`
    - `exports["."].types: "./dist/index.d.ts"`
  - `engines.node: ">=18"`.

- **`tsconfig.json`**
  - TypeScript configuration targeting ES2022.
  - `moduleResolution: "Bundler"`, strict type checking, `include: ["src/**/*.ts"]`.

- **`tsup.config.ts`**
  - `tsup` build config:
    - Entry: `src/index.ts`
    - Format: `esm`
    - Generates `.d.ts` and sourcemaps
    - Cleans `dist` on build.

- **`eslint.config.js`**
  - Flat config using `typescript-eslint` recommended rules.
  - Ignores `dist/**` and `node_modules/**`.

- **`src/index.ts`**
  - Public entrypoint for the SDK.
  - Re-exports:
    - `PageIndexClient` and `PageIndexClientOptions` from `pageindex-client`.
    - All public types from `types`.

- **`src/pageindex-client.ts`**
  - Implementation of `PageIndexClient`, the main HTTP client.
  - Contains all public methods used by consumers of the SDK.

- **`src/types.ts`**
  - Public TypeScript types and interfaces:
    - Chat-related types (`PageIndexChatMessage`, `ChatCompletionsRequest`, `ChatCompletionsResponse`, etc.).
    - Document-related types (`SubmitDocumentResponse`, `DocumentMetadataResponse`, `ListDocumentsResponse`, `GetDocumentResponseBase`, etc.).
    - SSE event type (`SseEvent<T>`).

- **`src/sse.ts`**
  - Internal helper for parsing SSE streams (`parseSseStream`).
  - Not exported from the public entrypoint; used internally by `PageIndexClient.chatCompletionsStream`.

---

## Installation Guide

### 1. Requirements

- **Node.js >= 18**
  - Uses **built-in** `fetch`, `ReadableStream`, and `FormData`.
  - If you must run on older Node versions, supply your own `fetch` implementation via `PageIndexClientOptions.fetch` (see examples below).

### 2. Install the package

Using **npm**:

```bash
npm install pageindex-node-sdk
```

Using **yarn**:

```bash
yarn add pageindex-node-sdk
```

Using **pnpm**:

```bash
pnpm add pageindex-node-sdk
```

---

## Environment Variables

The SDK itself is agnostic to how you provide configuration, but the **recommended setup** is:

- **`PAGEINDEX_API_KEY`** (required)
  - **Description**: Your secret API key for authenticating requests to the PageIndex API.
  - **Used by**: `PageIndexClient` (passed to the constructor).
  - **Example**:
    - `.env`:

      ```bash
      PAGEINDEX_API_KEY=pi_sk_XXXXXXXXXXXXXXXXXXXXXXXX
      ```

    - App code:

      ```ts
      const client = new PageIndexClient({
        apiKey: process.env.PAGEINDEX_API_KEY!,
      });
      ```

- **`PAGEINDEX_BASE_URL`** (optional)
  - **Description**: Override the default API base URL (`https://api.pageindex.ai`).
  - **Common uses**: Point to staging, dev, or a proxy.
  - **Example**:

    ```bash
    PAGEINDEX_BASE_URL=https://staging-api.pageindex.ai
    ```

If you prefer, you can hard-code these values or load them from any config system; they are just constructor parameters.

---

## How to Run the Project Locally (SDK Development)

If you are **developing the SDK itself** (not just consuming it):

### 1. Clone and install dependencies

```bash
git clone <your-fork-or-repo-url>
cd pageindex-ts
npm install
```

### 2. Type-check the code

```bash
npm run typecheck
```

### 3. Lint the code

```bash
npm run lint
```

### 4. Run in watch mode (for local development)

```bash
npm run dev
```

This runs `tsup` in watch mode, rebuilding `dist` on every change.

---

## Build and Production Deployment

### Build the SDK

```bash
npm run build
```

This:

- Bundles `src/index.ts` to `dist/index.js` (ESM).
- Generates `dist/index.d.ts` type declarations.
- Emits sourcemaps for easier debugging.

### NPM Packaging

The `prepack` script is configured to build automatically:

```bash
npm pack
```

This will:

- Run `npm run build` (via `prepack`).
- Create a `.tgz` tarball with the published contents (primarily `dist/`).

To publish to npm:

```bash
npm publish
```

(Ensure `name`, `version`, and repository fields in `package.json` are correctly set and you are authenticated to npm.)

---

## Public API Documentation

### Class: `PageIndexClient`

**Import**

```ts
import { PageIndexClient } from "pageindex-node-sdk";
```

**Constructor**

```ts
new PageIndexClient(options: PageIndexClientOptions);
```

**`PageIndexClientOptions`**

```ts
interface PageIndexClientOptions {
  apiKey: string;              // Required API key
  baseUrl?: string;            // Optional base URL, defaults to https://api.pageindex.ai
  fetch?: typeof fetch;        // Optional custom fetch implementation
}
```

#### Example: Basic client setup

```ts
import { PageIndexClient } from "pageindex-node-sdk";

const client = new PageIndexClient({
  apiKey: process.env.PAGEINDEX_API_KEY!,
  // baseUrl: "https://staging-api.pageindex.ai", // optional
});
```

#### Example: With custom `fetch` (for non-Node environments)

```ts
import fetch from "node-fetch";
import { PageIndexClient } from "pageindex-node-sdk";

const client = new PageIndexClient({
  apiKey: process.env.PAGEINDEX_API_KEY!,
  fetch,
});
```

---

## Document APIs

### `submitDocument`

**Signature**

```ts
submitDocument(params: {
  file: Blob;
  filename?: string;
  mode?: "mcp";
}): Promise<SubmitDocumentResponse>;
```

**Purpose**

- Uploads a document from a `Blob` (e.g. when you already have file bytes in memory).

**Parameters**

- **`file`** (`Blob`, required): Contents of the document to upload (typically a PDF).
- **`filename`** (`string`, optional): Name to associate with the upload. Defaults to `"document.pdf"` if not provided.
- **`mode`** (`"mcp"`, optional): Optional mode flag passed through to the PageIndex API.

**Returns**

- `Promise<SubmitDocumentResponse>`

```ts
interface SubmitDocumentResponse {
  doc_id: string;
}
```

**Usage example**

```ts
const blob = new Blob([pdfBuffer], { type: "application/pdf" });

const { doc_id } = await client.submitDocument({
  file: blob,
  filename: "2023-annual-report.pdf",
});
```

**Underlying REST call**

- **Method**: `POST`
- **URL**: `/doc/`
- **Body**: `FormData` with fields:
  - `file`: binary content
  - `mode` (optional)

---

### `submitDocumentFromPath`

**Signature**

```ts
submitDocumentFromPath(params: {
  path: string;
  filename?: string;
  mode?: "mcp";
}): Promise<SubmitDocumentResponse>;
```

**Purpose**

- Convenience helper to upload a document directly from the filesystem in Node.

**Parameters**

- **`path`** (`string`, required): Filesystem path to the document.
- **`filename`** (`string`, optional): Display name; defaults to the file basename.
- **`mode`** (`"mcp"`, optional).

**Returns**

- `Promise<SubmitDocumentResponse>` (same as `submitDocument`).

**Usage example**

```ts
const { doc_id } = await client.submitDocumentFromPath({
  path: "./docs/2023-annual-report.pdf",
});
```

**Underlying behavior**

- Reads file via `fs.promises.readFile`.
- Wraps it in a `Blob`.
- Delegates to `submitDocument`.

---

### `getDocument`

**Signature**

```ts
getDocument(
  docId: string,
  opts?: {
    type?: DocResultType;   // "tree" | "ocr"
    format?: OcrFormat;     // "page" | "node" | "raw" (for OCR)
    summary?: boolean;
  },
): Promise<GetDocumentResponseBase>;
```

**Purpose**

- Generic method to retrieve a processed document, supporting both tree and OCR views with optional summarization.

**Parameters**

- **`docId`** (`string`, required): Document ID returned from `submitDocument`.
- **`opts.type`** (`"tree" | "ocr"`, optional): Result type.
- **`opts.format`** (`"page" | "node" | "raw"`, optional): OCR format (only applies when `type: "ocr"`).
- **`opts.summary`** (`boolean`, optional): Whether to request a summarized result.

**Returns**

```ts
type DocResultType = "tree" | "ocr";

type OcrFormat = "page" | "node" | "raw";

interface GetDocumentResponseBase {
  doc_id: string;
  status: "processing" | "completed" | (string & {});
  retrieval_ready?: boolean;
  result?: unknown; // Shape depends on PageIndex server configuration
}
```

**Usage example**

```ts
const doc = await client.getDocument("doc_123", {
  type: "ocr",
  format: "page",
  summary: true,
});

if (doc.status === "completed") {
  console.log(doc.result);
}
```

**Underlying REST call**

- **Method**: `GET`
- **URL**: `/doc/{doc_id}/`
- **Query params**:
  - `type` (optional)
  - `format` (optional)
  - `summary` (optional)

---

### `getTree`

**Signature**

```ts
getTree(
  docId: string,
  opts?: { summary?: boolean },
): Promise<GetDocumentResponseBase>;
```

**Purpose**

- Convenience wrapper for `getDocument` with `type: "tree"`.

**Parameters**

- **`docId`** (`string`, required).
- **`opts.summary`** (`boolean`, optional).

**Returns**

- `Promise<GetDocumentResponseBase>`.

**Usage example**

```ts
const tree = await client.getTree(doc_id, { summary: true });

if (tree.status === "completed") {
  console.log(tree.result);
}
```

---

### `getOcr`

**Signature**

```ts
getOcr(
  docId: string,
  opts?: { format?: OcrFormat },
): Promise<GetDocumentResponseBase>;
```

**Purpose**

- Convenience wrapper for `getDocument` with `type: "ocr"`.

**Parameters**

- **`docId`** (`string`, required).
- **`opts.format`** (`"page" | "node" | "raw"`, optional).

**Returns**

- `Promise<GetDocumentResponseBase>`.

**Usage example**

```ts
const ocr = await client.getOcr(doc_id, { format: "raw" });

if (ocr.status === "completed") {
  console.log(ocr.result);
}
```

---

### `getDocumentMetadata`

**Signature**

```ts
getDocumentMetadata(docId: string): Promise<DocumentMetadataResponse>;
```

**Purpose**

- Retrieve high-level metadata for a document.

**Returns**

```ts
interface DocumentMetadataResponse {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt?: string;
  pageNum?: number;
}
```

**Usage example**

```ts
const metadata = await client.getDocumentMetadata(doc_id);
console.log(metadata.name, metadata.status);
```

**Underlying REST call**

- **Method**: `GET`
- **URL**: `/doc/{doc_id}/metadata`

---

### `listDocuments`

**Signature**

```ts
listDocuments(opts?: {
  limit?: number;
  offset?: number;
}): Promise<ListDocumentsResponse>;
```

**Purpose**

- List documents with pagination.

**Returns**

```ts
interface ListDocumentsResponse {
  documents: DocumentMetadataResponse[];
  total: number;
  limit: number;
  offset: number;
}
```

**Usage example**

```ts
const { documents, total } = await client.listDocuments({ limit: 20, offset: 0 });

console.log(`Total docs: ${total}`);
for (const doc of documents) {
  console.log(doc.id, doc.name, doc.status);
}
```

**Underlying REST call**

- **Method**: `GET`
- **URL**: `/docs`
- **Query params**:
  - `limit` (optional)
  - `offset` (optional)

---

### `deleteDocument`

**Signature**

```ts
deleteDocument(docId: string): Promise<void>;
```

**Purpose**

- Delete a document by ID.

**Usage example**

```ts
await client.deleteDocument(doc_id);
console.log("Document deleted");
```

**Underlying REST call**

- **Method**: `DELETE`
- **URL**: `/doc/{doc_id}/`

---

## Chat Completion APIs

### Types: Chat messages and responses

```ts
type PageIndexRole = "system" | "user" | "assistant" | "tool";

interface PageIndexChatMessage {
  role: PageIndexRole;
  content: string;
}

interface ChatCompletionsRequest {
  messages: PageIndexChatMessage[];
  stream?: boolean;
  doc_id?: string | string[];
  temperature?: number;
  enable_citations?: boolean;
}

interface ChatCompletionsResponse {
  id: string;
  choices: Array<{
    message?: PageIndexChatMessage;
    delta?: Partial<PageIndexChatMessage>;
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  block_metadata?: Record<string, unknown>;
}
```

---

### `chatCompletions` (non-streaming)

**Signature**

```ts
chatCompletions(req: ChatCompletionsRequest): Promise<ChatCompletionsResponse>;
```

**Purpose**

- Perform a standard (non-streaming) chat completion request, optionally grounded in one or more documents.

**Parameters**

- **`messages`** (`PageIndexChatMessage[]`, required): Conversation history.
- **`stream`** (`boolean`, optional): **Must not be `true`** for this method. If `true`, it will throw at runtime.
- **`doc_id`** (`string | string[]`, optional): One or more document IDs to condition the chat on.
- **`temperature`** (`number`, optional): Sampling temperature for the model.
- **`enable_citations`** (`boolean`, optional): Whether to request citations from the model (if supported).

**Returns**

- `Promise<ChatCompletionsResponse>`.

**Usage example**

```ts
const response = await client.chatCompletions({
  doc_id,
  messages: [
    {
      role: "user",
      content: "What are the key insights from this report?",
    },
  ],
  temperature: 0.2,
  enable_citations: true,
});

const answer = response.choices?.[0]?.message?.content ?? "";
console.log(answer);
```

**Underlying REST call**

- **Method**: `POST`
- **URL**: `/chat/completions`
- **Body**: JSON matching `ChatCompletionsRequest` with `stream` either `false` or omitted.

---

### `chatCompletionsStream` (streaming via SSE)

**Signature**

```ts
chatCompletionsStream(
  req: Omit<ChatCompletionsRequest, "stream">,
): AsyncGenerator<SseEvent<ChatCompletionsResponse>, void, void>;
```

**Purpose**

- Receive chat completions as a **stream** of SSE events, suitable for real-time token streaming in CLIs and servers.

**`SseEvent<T>` type**

```ts
type SseEvent<T> =
  | { type: "data"; data: T; raw: string }
  | { type: "done"; raw: string }
  | { type: "comment"; raw: string };
```

**Parameters**

- Same as `ChatCompletionsRequest`, **except**:
  - `stream` is **not allowed** (forced to `true` internally).

**Returns**

- `AsyncGenerator<SseEvent<ChatCompletionsResponse>, void, void>`:
  - Yields:
    - `type: "data"` with partial `ChatCompletionsResponse` chunks.
    - `type: "comment"` for SSE comments (can usually be ignored).
    - `type: "done"` when the stream completes.

**Usage example (Node CLI-style streaming)**

```ts
for await (const evt of client.chatCompletionsStream({
  doc_id,
  messages: [{ role: "user", content: "Summarize section 3." }],
})) {
  if (evt.type === "data") {
    const delta = evt.data.choices?.[0]?.delta?.content ?? "";
    if (delta) process.stdout.write(delta);
  }
}

process.stdout.write("\n");
```

**Underlying REST call**

- **Method**: `POST`
- **URL**: `/chat/completions`
- **Body**: JSON same as `ChatCompletionsRequest`, but with `stream: true` enforced.
- **Response**: Server-Sent Events, parsed by an internal `parseSseStream` helper.

---

## Underlying REST API Endpoints (Summary)

The SDK wraps the following REST endpoints of the PageIndex API:

- **`POST /doc/`** – Upload a document.
- **`GET /doc/{doc_id}/`** – Retrieve document processing results (tree/OCR/summary).
- **`GET /doc/{doc_id}/metadata`** – Get document metadata.
- **`GET /docs`** – List documents with pagination.
- **`DELETE /doc/{doc_id}/`** – Delete a document.
- **`POST /chat/completions`** – Chat completions (standard and streaming).

Authentication is handled via an `api_key` header (set internally by the client using your `apiKey`).

---

## Authentication Flow

- You obtain an **API key** from your PageIndex account.
- You pass that key as `apiKey` to `new PageIndexClient({ apiKey })`.
- The client automatically:
  - Injects `api_key: <your-key>` into the headers of each request.
  - Talks to the default base URL `https://api.pageindex.ai` unless overridden.

There is no built-in token refresh or OAuth flow in this SDK; auth is entirely API-key based.

---

## Error Handling

- All methods on `PageIndexClient` **throw** on non-OK HTTP responses.
- Errors typically originate from:
  - Network failures (DNS, timeouts, etc.).
  - Non-2xx responses from the PageIndex API.

Recommended pattern:

```ts
try {
  const { doc_id } = await client.submitDocumentFromPath({ path: "./document.pdf" });
  const tree = await client.getTree(doc_id);
  // ...
} catch (error) {
  // You can inspect error.message, or if using a custom fetch, the error shape it returns.
  console.error("PageIndex error:", error);
}
```

For streaming:

```ts
try {
  for await (const evt of client.chatCompletionsStream({
    doc_id,
    messages: [{ role: "user", content: "Explain the key points" }],
  })) {
    if (evt.type === "data") {
      process.stdout.write(evt.data.choices?.[0]?.delta?.content ?? "");
    }
  }
  process.stdout.write("\n");
} catch (error) {
  console.error("Streaming error:", error);
}
```

---

## Logging

The SDK itself does **not** perform any logging by default; all logging is controlled by your application.

If you want request/response logging:

- Wrap `fetch` yourself and pass it in via `PageIndexClientOptions.fetch`, adding logs around the call.
- Or intercept at a higher layer (e.g. log before/after calling client methods).

Example (minimal custom fetch wrapper):

```ts
async function loggingFetch(input: RequestInfo | URL, init?: RequestInit) {
  console.log("[PageIndex] Request:", input, init);
  const res = await fetch(input, init);
  console.log("[PageIndex] Response:", res.status);
  return res;
}

const client = new PageIndexClient({
  apiKey: process.env.PAGEINDEX_API_KEY!,
  fetch: loggingFetch as typeof fetch,
});
```

---

## Testing Instructions (for SDK contributors)

- **Run type-checks**

```bash
npm run typecheck
```

- **Run linter**

```bash
npm run lint
```

- **Manual integration tests**
  - Set `PAGEINDEX_API_KEY` in your environment.
  - Use a Node REPL or a small script to:
    - Upload a document.
    - Wait until `status === "completed"` using `getTree` or `getOcr`.
    - Call `chatCompletions` and `chatCompletionsStream` against the uploaded document.

Example integration script skeleton:

```ts
import { PageIndexClient } from "pageindex-node-sdk";

async function main() {
  const client = new PageIndexClient({ apiKey: process.env.PAGEINDEX_API_KEY! });

  const { doc_id } = await client.submitDocumentFromPath({ path: "./sample.pdf" });

  let status = "processing";
  while (status !== "completed") {
    const tree = await client.getTree(doc_id);
    status = tree.status;
    if (status !== "completed") {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  const chat = await client.chatCompletions({
    doc_id,
    messages: [{ role: "user", content: "Give me a summary of this document." }],
  });

  console.log(chat.choices?.[0]?.message?.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

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

