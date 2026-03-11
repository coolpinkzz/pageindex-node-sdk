import { readFile } from "node:fs/promises";

import { parseSseStream } from "./sse.js";
import type {
  ChatCompletionsRequest,
  ChatCompletionsResponse,
  DocResultType,
  DocumentMetadataResponse,
  GetDocumentResponseBase,
  ListDocumentsResponse,
  OcrFormat,
  SseEvent,
  SubmitDocumentResponse,
} from "./types.js";

export interface PageIndexClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

export class PageIndexClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: PageIndexClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? "https://api.pageindex.ai").replace(/\/+$/, "");
    this.fetchImpl = opts.fetch ?? fetch;
  }

  private headers(extra?: HeadersInit): HeadersInit {
    return {
      api_key: this.apiKey,
      ...extra,
    };
  }

  private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PageIndex API error ${res.status} ${res.statusText}: ${text}`);
    }
    return (await res.json()) as T;
  }

  async submitDocument(params: {
    file: Blob;
    filename?: string;
    mode?: "mcp";
  }): Promise<SubmitDocumentResponse> {
    const fd = new FormData();
    fd.set("file", params.file, params.filename ?? "document.pdf");
    if (params.mode) fd.set("mode", params.mode);

    return this.requestJson<SubmitDocumentResponse>("/doc/", {
      method: "POST",
      headers: this.headers(),
      body: fd,
    });
  }

  async submitDocumentFromPath(params: {
    path: string;
    filename?: string;
    mode?: "mcp";
  }): Promise<SubmitDocumentResponse> {
    const buf = await readFile(params.path);
    const blob = new Blob([buf], { type: "application/pdf" });
    return this.submitDocument({
      file: blob,
      filename: params.filename ?? params.path.split("/").pop() ?? "document.pdf",
      mode: params.mode,
    });
  }

  async getDocument(
    docId: string,
    opts?: { type?: DocResultType; format?: OcrFormat; summary?: boolean },
  ): Promise<GetDocumentResponseBase> {
    const qp = new URLSearchParams();
    if (opts?.type) qp.set("type", opts.type);
    if (opts?.format) qp.set("format", opts.format);
    if (typeof opts?.summary === "boolean") qp.set("summary", String(opts.summary));

    const q = qp.toString();
    return this.requestJson<GetDocumentResponseBase>(`/doc/${encodeURIComponent(docId)}/${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: this.headers(),
    });
  }

  async getTree(docId: string, opts?: { summary?: boolean }): Promise<GetDocumentResponseBase> {
    return this.getDocument(docId, { type: "tree", summary: opts?.summary });
  }

  async getOcr(docId: string, opts?: { format?: OcrFormat }): Promise<GetDocumentResponseBase> {
    return this.getDocument(docId, { type: "ocr", format: opts?.format });
  }

  async getDocumentMetadata(docId: string): Promise<DocumentMetadataResponse> {
    return this.requestJson<DocumentMetadataResponse>(`/doc/${encodeURIComponent(docId)}/metadata`, {
      method: "GET",
      headers: this.headers(),
    });
  }

  async listDocuments(opts?: { limit?: number; offset?: number }): Promise<ListDocumentsResponse> {
    const qp = new URLSearchParams();
    if (typeof opts?.limit === "number") qp.set("limit", String(opts.limit));
    if (typeof opts?.offset === "number") qp.set("offset", String(opts.offset));
    const q = qp.toString();
    return this.requestJson<ListDocumentsResponse>(`/docs${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: this.headers(),
    });
  }

  async deleteDocument(docId: string): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/doc/${encodeURIComponent(docId)}/`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PageIndex API error ${res.status} ${res.statusText}: ${text}`);
    }
  }

  async chatCompletions(req: ChatCompletionsRequest): Promise<ChatCompletionsResponse> {
    if (req.stream) {
      throw new Error('Use chatCompletionsStream() when "stream" is true.');
    }
    return this.requestJson<ChatCompletionsResponse>("/chat/completions", {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(req),
    });
  }

  async *chatCompletionsStream(
    req: Omit<ChatCompletionsRequest, "stream">,
  ): AsyncGenerator<SseEvent<ChatCompletionsResponse>, void, void> {
    const res = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ...req, stream: true }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PageIndex API error ${res.status} ${res.statusText}: ${text}`);
    }
    if (!res.body) throw new Error("Streaming response body was empty.");

    yield* parseSseStream<ChatCompletionsResponse>(res.body);
  }
}

