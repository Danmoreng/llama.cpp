import { config } from '$lib/stores/settings.svelte';
import type {
	ApiChatCompletionRequest,
	ApiChatCompletionResponse,
	ApiChatCompletionStreamChunk,
	ApiChatMessageContentPart,
	ApiChatMessageData,
	ApiFunctionTool,
	ApiRequestMessage,
	ApiToolCall,
	ApiToolChoice,
	ApiToolMessageData
} from '$lib/types/api';

type ToolOptions = {
	tools?: ApiFunctionTool[];
	tool_choice?: ApiToolChoice;
	onToolCalls?: (calls: ApiToolCall[]) => void;
};


/**
 * Service class for handling chat completions with the llama.cpp server.
 * Provides methods for sending messages, handling streaming responses, and managing chat sessions.
 */
export class ChatService {
	private abortController: AbortController | null = null;

	/**
	 * Sends a chat completion request to the llama.cpp server.
	 * Supports both streaming and non-streaming responses with comprehensive parameter configuration.
	 *
	 * @param messages - Array of chat messages to send to the API
	 * @param options - Configuration options for the chat completion request. See `SettingsChatServiceOptions` type for details.
	 * @returns {Promise<string | void>} that resolves to the complete response string (non-streaming) or void (streaming)
	 * @throws {Error} if the request fails or is aborted
	 */
	async sendMessage(
		messages: ApiChatMessageData[],
		options: SettingsChatServiceOptions & ToolOptions = {}
	): Promise<string | void> {
		const {
			stream,
			onChunk,
			onComplete,
			onError,
			// Generation parameters
			temperature,
			max_tokens,
			// Sampling parameters
			dynatemp_range,
			dynatemp_exponent,
			top_k,
			top_p,
			min_p,
			xtc_probability,
			xtc_threshold,
			typical_p,
			// Penalty parameters
			repeat_last_n,
			repeat_penalty,
			presence_penalty,
			frequency_penalty,
			dry_multiplier,
			dry_base,
			dry_allowed_length,
			dry_penalty_last_n,
			// Other parameters
			samplers,
			custom,
			// tools
			tools,
			tool_choice,
			onToolCalls
		} = options;

		// Cancel any ongoing request and create a new abort controller
		this.abort();
		this.abortController = new AbortController();

		// Build base request body with system message injection
		const processedMessages = this.injectSystemMessage(messages);
		const requestBody: ApiChatCompletionRequest = {
			messages: processedMessages,
			stream
		};

		// pass tool calling config
		if (tools?.length) requestBody.tools = tools;
		if (tool_choice) requestBody.tool_choice = tool_choice;

		// Add generation parameters if provided
		if (temperature !== undefined) requestBody.temperature = temperature;
		if (max_tokens !== undefined) requestBody.max_tokens = max_tokens;

		// Add sampling parameters if provided
		if (dynatemp_range !== undefined) requestBody.dynatemp_range = dynatemp_range;
		if (dynatemp_exponent !== undefined) requestBody.dynatemp_exponent = dynatemp_exponent;
		if (top_k !== undefined) requestBody.top_k = top_k;
		if (top_p !== undefined) requestBody.top_p = top_p;
		if (min_p !== undefined) requestBody.min_p = min_p;
		if (xtc_probability !== undefined) requestBody.xtc_probability = xtc_probability;
		if (xtc_threshold !== undefined) requestBody.xtc_threshold = xtc_threshold;
		if (typical_p !== undefined) requestBody.typical_p = typical_p;

		// Add penalty parameters if provided
		if (repeat_last_n !== undefined) requestBody.repeat_last_n = repeat_last_n;
		if (repeat_penalty !== undefined) requestBody.repeat_penalty = repeat_penalty;
		if (presence_penalty !== undefined) requestBody.presence_penalty = presence_penalty;
		if (frequency_penalty !== undefined) requestBody.frequency_penalty = frequency_penalty;
		if (dry_multiplier !== undefined) requestBody.dry_multiplier = dry_multiplier;
		if (dry_base !== undefined) requestBody.dry_base = dry_base;
		if (dry_allowed_length !== undefined) requestBody.dry_allowed_length = dry_allowed_length;
		if (dry_penalty_last_n !== undefined) requestBody.dry_penalty_last_n = dry_penalty_last_n;

		// Add sampler configuration if provided
		if (samplers !== undefined) {
			requestBody.samplers =
				typeof samplers === 'string'
					? samplers.split(';').filter((s: string) => s.trim())
					: samplers;
		}

		// Add custom parameters if provided
		if (custom) {
			try {
				const customParams = typeof custom === 'string' ? JSON.parse(custom) : custom;
				Object.assign(requestBody, customParams);
			} catch (error) {
				console.warn('Failed to parse custom parameters:', error);
			}
		}

		try {
			const response = await fetch(`/v1/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody),
				signal: this.abortController.signal
			});

			if (!response.ok) {
				let errorMessage = `Server error (${response.status})`;

				switch (response.status) {
					case 400:
						errorMessage = 'Invalid request - check your message format';
						break;
					case 401:
						errorMessage = 'Unauthorized - check server authentication';
						break;
					case 404:
						errorMessage =
							'Chat endpoint not found - server may not support chat completions';
						break;
					case 500:
						errorMessage = 'Server internal error - check server logs';
						break;
					case 503:
						errorMessage = 'Server unavailable - try again later';
						break;
					default:
						errorMessage = `Server error (${response.status}): ${response.statusText}`;
				}

				throw new Error(errorMessage);
			}

			if (stream) {
				return this.handleStreamResponse(
					response,
					onChunk,
					onComplete,
					onError,
					onToolCalls
				);
			} else {
				return this.handleNonStreamResponse(response, onComplete, onError, onToolCalls);
			}
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				console.log('Chat completion request was aborted');
				return;
			}

			// Handle network errors with user-friendly messages
			let friendlyError: Error;
			if (error instanceof Error) {
				if (error.name === 'TypeError' && error.message.includes('fetch')) {
					friendlyError = new Error(
						'Unable to connect to server - please check if the server is running'
					);
				} else if (error.message.includes('ECONNREFUSED')) {
					friendlyError = new Error('Connection refused - server may be offline');
				} else if (error.message.includes('ETIMEDOUT')) {
					friendlyError = new Error('Request timeout - server may be overloaded');
				} else {
					friendlyError = error;
				}
			} else {
				friendlyError = new Error('Unknown error occurred while sending message');
			}

			console.error('Error in sendMessage:', error);
			if (onError) {
				onError(friendlyError);
			}
			throw friendlyError;
		}
	}

	/**
	 * Handles streaming response from the chat completion API.
	 * Processes server-sent events and extracts content chunks from the stream.
	 *
	 * @param response - The fetch Response object containing the streaming data
	 * @param onChunk - Optional callback invoked for each content chunk received
	 * @param onComplete - Optional callback invoked when the stream is complete with full response
	 * @param onError - Optional callback invoked if an error occurs during streaming
	 * @param onToolCalls - Optional callback invoked when model chooses tool call(s)
	 * @returns {Promise<void>} Promise that resolves when streaming is complete
	 * @throws {Error} if the stream cannot be read or parsed
	 */
	private async handleStreamResponse(
		response: Response,
		onChunk?: (chunk: string) => void,
		onComplete?: (response: string) => void,
		onError?: (error: Error) => void,
		onToolCalls?: (calls: ApiToolCall[]) => void
	): Promise<void> {
		const reader = response.body?.getReader();

		if (!reader) {
			throw new Error('No response body');
		}

		const decoder = new TextDecoder();
		let fullResponse = '';
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		let thinkContent = '';
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		let regularContent = '';
		let insideThinkTag = false;
		let hasReceivedData = false;
		let sawToolCalls = false;

		const toolCallBuffer = new Map<number, ApiToolCall>();
		const flushToolCalls = () => {
			if (!toolCallBuffer.size) return;
			const calls = Array.from(toolCallBuffer.entries())
				.sort((a, b) => a[0] - b[0])
				.map(([, v]) => v)
				.filter((c) => c.function?.name);
			if (calls.length) onToolCalls?.(calls);
			toolCallBuffer.clear();
		};

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (!line.startsWith('data: ')) continue;
					const data = line.slice(6);
					if (data === '[DONE]') {
						// ✅ End of stream. If we saw tool calls OR any text, this is NOT a context error.
						flushToolCalls();
						if (!hasReceivedData && !sawToolCalls) {
							const contextError = new Error(
								'The request exceeds the available context size. Try increasing the context size or enable context shift.'
							);
							(contextError as any).name = 'ContextError';
							onError?.(contextError as Error);
							return;
						}
						onComplete?.(fullResponse);
						return;
					}

					try {
						const parsed: ApiChatCompletionStreamChunk = JSON.parse(data);
						const choice = parsed.choices?.[0];
						const delta = choice?.delta;

						if (delta?.tool_calls?.length) {
							sawToolCalls = true;
							for (const tc of delta.tool_calls) {
								const idx = tc.index ?? 0;
								let entry = toolCallBuffer.get(idx);
								if (!entry) {
									entry = {
										id: undefined,
										type: 'function',
										function: { name: '', arguments: '' }
									};
									toolCallBuffer.set(idx, entry);
								}
								if (tc.id) entry.id = tc.id;
								if (tc.function?.name) entry.function.name = tc.function.name;
								if (tc.function?.arguments)
									entry.function.arguments += tc.function.arguments;
							}
						}

						const content = delta?.content ?? '';
						if (content) {
							hasReceivedData = true;
							fullResponse += content;

							// Process content character by character to handle think tags
							insideThinkTag = this.processContentForThinkTags(
								content,
								insideThinkTag,
								(thinkChunk) => {
									thinkContent += thinkChunk;
								},
								(regularChunk) => {
									regularContent += regularChunk;
								}
							);

							onChunk?.(content);
						}
						// If model finishes specifically for tool calls, emit immediately
						if (choice?.finish_reason === 'tool_calls') {
							flushToolCalls();
						}
					} catch (e) {
						console.error('Error parsing JSON chunk:', e);
					}
				}
			}

			// Stream ended without [DONE]. Treat as error only if we truly saw nothing.
			if (!hasReceivedData && !sawToolCalls) {
				const contextError = new Error(
					'The request exceeds the available context size. Try increasing the context size or enable context shift.'
				);
				(contextError as any).name = 'ContextError';
				onError?.(contextError as Error);
				return;
			}

			// Be lenient: flush any buffered calls and complete.
			flushToolCalls();
			onComplete?.(fullResponse);
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Stream error');
			onError?.(err);
			throw err;
		} finally {
			reader.releaseLock();
		}
	}

	/**
	 * Handles non-streaming response from the chat completion API.
	 * Parses the JSON response and extracts the generated content.
	 *
	 * @param response - The fetch Response object containing the JSON data
	 * @param onComplete - Optional callback invoked when response is successfully parsed
	 * @param onError - Optional callback invoked if an error occurs during parsing
	 * @param onToolCalls - Optional callback invoked when model chooses tool call(s)
	 * @returns {Promise<string>} Promise that resolves to the generated content string
	 * @throws {Error} if the response cannot be parsed or is malformed
	 */
	private async handleNonStreamResponse(
		response: Response,
		onComplete?: (response: string) => void,
		onError?: (error: Error) => void,
		onToolCalls?: (calls: ApiToolCall[]) => void
	): Promise<string> {
		try {
			const responseText = await response.text();
			if (!responseText.trim()) {
				// True empty body → keep as real context error
				const contextError = new Error(
					'The request exceeds the available context size. Try increasing the context size or enable context shift.'
				);
				(contextError as any).name = 'ContextError';
				onError?.(contextError as Error);
				throw contextError;
			}

			const data: ApiChatCompletionResponse = JSON.parse(responseText);
			const msg = data.choices?.[0]?.message;
			const content = msg?.content ?? '';
			const toolCalls = msg?.tool_calls ?? [];

			if (toolCalls.length) onToolCalls?.(toolCalls);

			// If tool calls exist, an empty content is OK. Do NOT raise ContextError.
			if (!content.trim() && toolCalls.length) {
				onComplete?.(''); // allow the outer loop to continue with tools
				return '';
			}

			// If no content and no tool calls → likely a real context issue
			if (!content.trim() && !toolCalls.length) {
				const contextError = new Error(
					'The request exceeds the available context size. Try increasing the context size or enable context shift.'
				);
				(contextError as any).name = 'ContextError';
				onError?.(contextError as Error);
				throw contextError;
			}

			onComplete?.(content);
			return content;
		} catch (error) {
			if (error instanceof Error && error.name === 'ContextError') throw error;
			const err = error instanceof Error ? error : new Error('Parse error');
			onError?.(err);
			throw err;
		}
	}

	/**
	 * Converts a database message with attachments to API chat message format.
	 * Processes various attachment types (images, text files, PDFs) and formats them
	 * as content parts suitable for the chat completion API.
	 *
	 * @param message - Database message object with optional extra attachments
	 * @param message.content - The text content of the message
	 * @param message.role - The role of the message sender (user, assistant, system)
	 * @param message.extra - Optional array of message attachments (images, files, etc.)
	 * @returns {ApiChatMessageData} object formatted for the chat completion API
	 * @static
	 */
	static convertMessageToChatServiceData(
		message: DatabaseMessage & { extra?: DatabaseMessageExtra[] }
	): ApiRequestMessage {
		// (A) TOOL RESULT MESSAGE
		if (message.role === 'tool') {
			return {
				role: 'tool',
				content: message.content ?? '',
				tool_call_id: (message as any).toolCallId ?? undefined,
				name: (message as any).toolName ?? undefined
			};
		}

		// Build multimodal content array if extras exist
		const hasExtras = Array.isArray(message.extra) && message.extra.length > 0;
		const contentParts: ApiChatMessageContentPart[] = [];

		if (hasExtras) {
			if (message.content) {
				contentParts.push({ type: 'text', text: message.content });
			}

			const imageFiles = (message.extra || []).filter(
				(e: DatabaseMessageExtra): e is DatabaseMessageExtraImageFile =>
					e.type === 'imageFile'
			);
			for (const image of imageFiles) {
				contentParts.push({ type: 'image_url', image_url: { url: image.base64Url } });
			}

			const textFiles = (message.extra || []).filter(
				(e: DatabaseMessageExtra): e is DatabaseMessageExtraTextFile =>
					e.type === 'textFile'
			);
			for (const t of textFiles) {
				contentParts.push({
					type: 'text',
					text: `\n\n--- File: ${t.name} ---\n${t.content}`
				});
			}

			const audioFiles = (message.extra || []).filter(
				(e: DatabaseMessageExtra): e is DatabaseMessageExtraAudioFile =>
					e.type === 'audioFile'
			);
			for (const a of audioFiles) {
				contentParts.push({
					type: 'input_audio',
					input_audio: {
						data: a.base64Data,
						format: a.mimeType.includes('wav') ? 'wav' : 'mp3'
					}
				});
			}

			const pdfFiles = (message.extra || []).filter(
				(e: DatabaseMessageExtra): e is DatabaseMessageExtraPdfFile => e.type === 'pdfFile'
			);
			for (const p of pdfFiles) {
				if (p.processedAsImages && p.images?.length) {
					for (const img of p.images) {
						contentParts.push({ type: 'image_url', image_url: { url: img } });
					}
				} else {
					contentParts.push({
						type: 'text',
						text: `\n\n--- PDF File: ${p.name} ---\n${p.content}`
					});
				}
			}
		}

		// (B) ASSISTANT TOOL CALL MESSAGE
		const toolCalls = (message as any).toolCalls as
			| Array<{ id: string; type: 'function'; name: string; arguments: string }>
			| undefined;

		if (message.role === 'assistant' && toolCalls?.length) {
			return {
				role: 'assistant',
				content: message.content ?? '',
				tool_calls: toolCalls.map((tc) => ({
					id: tc.id,
					type: 'function',
					function: { name: tc.name, arguments: tc.arguments }
				}))
			} as unknown as ApiRequestMessage;
		}

		// (C) NORMAL SYSTEM/USER/ASSISTANT MESSAGE
		return {
			role: message.role as Exclude<ChatRole, 'tool'>,
			content: hasExtras ? contentParts : (message.content ?? '')
		};
	}

	/**
	 * Unified method to send chat completions supporting both ApiChatMessageData and DatabaseMessage types.
	 * Automatically converts database messages with attachments to the appropriate API format.
	 *
	 * @param messages - Array of messages in either API format or database format with attachments
	 * @param options - Configuration options for the chat completion
	 * @param options.stream - Whether to use streaming response (default: true)
	 * @param options.temperature - Controls randomness in generation (default: 0.7)
	 * @param options.max_tokens - Maximum number of tokens to generate (default: 2048)
	 * @param options.onChunk - Callback for streaming response chunks
	 * @param options.onComplete - Callback when response is complete
	 * @param options.onError - Callback for error handling
	 * @returns Promise that resolves to the complete response string or void for streaming
	 */
	async sendChatCompletion(
		messages:
			| (ApiRequestMessage[] | DatabaseMessage[])
			| (DatabaseMessage & { extra?: DatabaseMessageExtra[] })[],
		options: {
			stream?: boolean;
			temperature?: number;
			max_tokens?: number;
			onChunk?: (chunk: string) => void;
			onComplete?: (response?: string) => void;
			onError?: (error: Error) => void;
		} & ToolOptions = {}
	): Promise<string | void> {
		// Preserve API-shaped objects; convert only DB messages
		const normalizedMessages: ApiRequestMessage[] = messages.map((msg: any) => {
			if ('id' in msg && 'convId' in msg && 'timestamp' in msg) {
				// DatabaseMessage → ApiRequestMessage
				return ChatService.convertMessageToChatServiceData(
					msg as DatabaseMessage & { extra?: DatabaseMessageExtra[] }
				);
			}
			// Already API-shaped (may include tool_calls / tool_call_id)
			return msg as ApiRequestMessage;
		});

		const finalOptions = {
			stream: true,
			temperature: 0.7,
			max_tokens: 2048,
			...options
		};

		return this.sendMessage(normalizedMessages, finalOptions);
	}

	/**
	 * Static method for backward compatibility with the legacy ApiService.
	 * Creates a temporary ChatService instance and sends a chat completion request.
	 *
	 * @param messages - Array of database messages to send
	 * @param onChunk - Optional callback for streaming response chunks
	 * @param onComplete - Optional callback when response is complete
	 * @param onError - Optional callback for error handling
	 * @returns Promise that resolves to the complete response string
	 * @static
	 * @deprecated Use ChatService instance methods instead
	 */
	static async sendChatCompletion(
		messages: DatabaseMessage[],
		onChunk?: (content: string) => void,
		onComplete?: () => void,
		onError?: (error: Error) => void
	): Promise<string> {
		const service = new ChatService();
		const result = await service.sendChatCompletion(messages, {
			stream: true,
			temperature: 0.7,
			max_tokens: 2048,
			onChunk,
			onComplete: () => onComplete?.(),
			onError
		});
		return result as string;
	}

	/**
	 * Get server properties - static method for API compatibility
	 */
	static async getServerProps(): Promise<ApiLlamaCppServerProps> {
		try {
			const response = await fetch(`/props`, {
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch server props: ${response.status}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Error fetching server props:', error);
			throw error;
		}
	}

	/**
	 * Processes content to separate thinking tags from regular content.
	 * Parses <think> and </think> tags to route content to appropriate handlers.
	 *
	 * @param content - The content string to process
	 * @param currentInsideThinkTag - Current state of whether we're inside a think tag
	 * @param addThinkContent - Callback to handle content inside think tags
	 * @param addRegularContent - Callback to handle regular content outside think tags
	 * @returns Boolean indicating if we're still inside a think tag after processing
	 * @private
	 */
	private processContentForThinkTags(
		content: string,
		currentInsideThinkTag: boolean,
		addThinkContent: (chunk: string) => void,
		addRegularContent: (chunk: string) => void
	): boolean {
		let i = 0;
		let insideThinkTag = currentInsideThinkTag;

		while (i < content.length) {
			// Check for opening <think> tag
			if (!insideThinkTag && content.substring(i, i + 7) === '<think>') {
				insideThinkTag = true;
				i += 7; // Skip the <think> tag
				continue;
			}

			// Check for closing </think> tag
			if (insideThinkTag && content.substring(i, i + 8) === '</think>') {
				insideThinkTag = false;
				i += 8; // Skip the </think> tag
				continue;
			}

			// Add character to appropriate content bucket
			if (insideThinkTag) {
				addThinkContent(content[i]);
			} else {
				addRegularContent(content[i]);
			}

			i++;
		}

		return insideThinkTag;
	}

	/**
	 * Aborts any ongoing chat completion request.
	 * Cancels the current request and cleans up the abort controller.
	 *
	 * @public
	 */
	public abort(): void {
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}
	}

	/**
	 * Injects a system message at the beginning of the conversation if configured in settings.
	 * Checks for existing system messages to avoid duplication and retrieves the system message
	 * from the current configuration settings.
	 *
	 * @param messages - Array of chat messages to process
	 * @returns Array of messages with system message injected at the beginning if configured
	 * @private
	 */
	private injectSystemMessage(messages: ApiRequestMessage[]): ApiRequestMessage[] {
		const currentConfig = config();
		const systemMessage = currentConfig.systemMessage?.toString().trim();
		if (!systemMessage) return messages;

		const first = messages[0] as any;
		if (first && first.role === 'system') return messages;

		const systemMsg: ApiRequestMessage = { role: 'system', content: systemMessage };
		return [systemMsg, ...messages];
	}
}
