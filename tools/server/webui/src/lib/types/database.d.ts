export interface DatabaseAppSettings {
	id: string;
	theme: 'light' | 'dark' | 'system';
	model: string;
	temperature: number;
}

export interface DatabaseConversation {
	currNode: string | null;
	id: string;
	lastModified: number;
	name: string;
}

export interface DatabaseMessageExtraAudioFile {
	type: 'audioFile';
	name: string;
	base64Data: string;
	mimeType: string;
}

export interface DatabaseMessageExtraImageFile {
	type: 'imageFile';
	name: string;
	base64Url: string;
}

export interface DatabaseMessageExtraTextFile {
	type: 'textFile';
	name: string;
	content: string;
}

export interface DatabaseMessageExtraPdfFile {
	type: 'pdfFile';
	name: string;
	content: string; // Text content extracted from PDF
	images?: string[]; // Optional: PDF pages as base64 images
	processedAsImages: boolean; // Whether PDF was processed as images
}

export type DatabaseMessageExtra = DatabaseMessageExtraImageFile | DatabaseMessageExtraTextFile | DatabaseMessageExtraAudioFile | DatabaseMessageExtraPdfFile;

export interface DatabaseToolCall {
	id: string;                 // set by model if provided; otherwise generate
	type: 'function';
	name: string;
	arguments: string;          // JSON-encoded args
}

export interface DatabaseUsage {
	promptTokens?: number;
	completionTokens?: number;
	totalTokens?: number;
}

export interface DatabaseMessage {
  id: string;
  convId: string;
  type: ChatMessageType;
  timestamp: number;
  role: ChatRole;

  // Legacy single-string content remains for back-compat
  content: string;

  // NEW: rich multipart content (mirrors ApiChatMessageContentPart[])
  contentParts?: ApiChatMessageContentPart[] | null;

  // Threading
  parent: string;
  thinking: string;
  children: string[];

  // NEW: assistant tool calls (present when role==='assistant' and it called tools)
  toolCalls?: DatabaseToolCall[] | null;

  // NEW: tool message fields (present when role==='tool')
  toolCallId?: string | null;  // must match assistant.toolCalls[i].id
  toolName?: string | null;    // optional convenience (function name)

  // Optional metadata
  finishReason?: ApiFinishReason | null;
  usage?: DatabaseUsage | null;

  extra?: DatabaseMessageExtra[];
}
