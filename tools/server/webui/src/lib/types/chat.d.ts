export type ChatMessageType = 'root' | 'text' | 'think';
export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatUploadedFile {
	id: string;
	name: string;
	size: number;
	type: string;
	file: File;
	preview?: string;
	textContent?: string;
}
