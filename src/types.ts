export type PageIndexRole = "system" | "user" | "assistant" | "tool";

export interface PageIndexChatMessage {
  role: PageIndexRole;
  content: string;
}

export interface SubmitDocumentResponse {
  doc_id: string;
}

export interface DocumentMetadataResponse {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt?: string;
  pageNum?: number;
}

export interface ListDocumentsResponse {
  documents: DocumentMetadataResponse[];
  total: number;
  limit: number;
  offset: number;
}

export type DocResultType = "tree" | "ocr";
export type OcrFormat = "page" | "node" | "raw";

export interface GetDocumentResponseBase {
  doc_id: string;
  status: "processing" | "completed" | (string & {});
  retrieval_ready?: boolean;
  result?: unknown;
}

export interface ChatCompletionsRequest {
  messages: PageIndexChatMessage[];
  stream?: boolean;
  doc_id?: string | string[];
  temperature?: number;
  enable_citations?: boolean;
}

export interface ChatCompletionsResponse {
  id: string;
  choices: Array<{
    message?: { role: string; content: string };
    delta?: { content?: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  // Streaming can also include intermediate metadata
  block_metadata?: Record<string, unknown>;
}

export type SseEvent<T = unknown> =
  | { type: "data"; data: T; raw: string }
  | { type: "done"; raw: string }
  | { type: "comment"; raw: string };

