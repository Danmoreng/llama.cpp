import { ChatService } from '$lib/services/chat';
import { DatabaseService } from '$lib/services';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { extractPartialThinking } from '$lib/utils/thinking';
import { config } from '$lib/stores/settings.svelte';
import type { ApiToolCall } from '$lib/types/api';
import { editorTools, executeEditorTool } from '$lib/tools/editorTools';
import { slotsService } from '$lib/services/slots';

class ChatStore {
	activeConversation = $state<DatabaseConversation | null>(null);
	activeMessages = $state<DatabaseMessage[]>([]);
	conversations = $state<DatabaseConversation[]>([]);
	currentResponse = $state('');
	isInitialized = $state(false);
	isLoading = $state(false);
	maxContextError = $state<{
		message: string;
		estimatedTokens: number;
		maxContext: number;
	} | null>(null);
	private chatService = new ChatService();

	constructor() {
		if (browser) {
			this.initialize();
		}
	}

	async initialize() {
		try {
			await this.loadConversations();

			// Clear any persisting context error state on initialization
			this.maxContextError = null;

			this.isInitialized = true;
		} catch (error) {
			console.error('Failed to initialize chat store:', error);
		}
	}

	async loadConversations() {
		this.conversations = await DatabaseService.getAllConversations();
	}

	async createConversation(name?: string): Promise<string> {
		const conversationName = name || `Chat ${new Date().toLocaleString()}`;
		const conversation = await DatabaseService.createConversation(conversationName);

		this.conversations.unshift(conversation);

		this.activeConversation = conversation;
		this.activeMessages = [];

		// Clear any context error state when creating a new conversation
		this.maxContextError = null;

		await goto(`/chat/${conversation.id}`);

		return conversation.id;
	}

	async loadConversation(convId: string): Promise<boolean> {
		try {
			const conversation = await DatabaseService.getConversation(convId);

			if (!conversation) {
				return false;
			}

			this.activeConversation = conversation;
			this.activeMessages = await DatabaseService.getConversationMessages(convId);

			// Clear any context error state when loading a conversation
			this.maxContextError = null;

			return true;
		} catch (error) {
			console.error('Failed to load conversation:', error);

			return false;
		}
	}

	async addMessage(
		role: ChatRole,
		content: string,
		type: ChatMessageType = 'text',
		parent: string = '-1',
		extras?: DatabaseMessageExtra[]
	): Promise<DatabaseMessage | null> {
		if (!this.activeConversation) {
			console.error('No active conversation when trying to add message');

			return null;
		}

		try {
			const message = await DatabaseService.addMessage({
				convId: this.activeConversation.id,
				role,
				content,
				type,
				timestamp: Date.now(),
				parent,
				thinking: '',
				children: [],
				extra: extras
			});

			this.activeMessages.push(message);

			// Update conversation timestamp
			this.updateConversationTimestamp();

			return message;
		} catch (error) {
			console.error('Failed to add message:', error);

			return null;
		}
	}

	/**
	 * Private helper method to handle streaming chat completion
	 * Reduces code duplication across sendMessage, updateMessage, and regenerateMessage
	 */
	private async streamChatCompletion(
		allMessages: DatabaseMessage[],
		assistantMessage: DatabaseMessage,
		onComplete?: (content: string) => Promise<void>,
		onError?: (error: Error) => void
	): Promise<void> {
		let streamedContent = '';
		const currentConfig = config();

		const apiOptions = {
			stream: true,
			temperature: Number(currentConfig.temperature) || 0.8,
			max_tokens: Number(currentConfig.max_tokens) || 2048,
			dynatemp_range: Number(currentConfig.dynatemp_range) || 0.0,
			dynatemp_exponent: Number(currentConfig.dynatemp_exponent) || 1.0,
			top_k: Number(currentConfig.top_k) || 40,
			top_p: Number(currentConfig.top_p) || 0.95,
			min_p: Number(currentConfig.min_p) || 0.05,
			xtc_probability: Number(currentConfig.xtc_probability) || 0.0,
			xtc_threshold: Number(currentConfig.xtc_threshold) || 0.1,
			typical_p: Number(currentConfig.typical_p) || 1.0,
			repeat_last_n: Number(currentConfig.repeat_last_n) || 64,
			repeat_penalty: Number(currentConfig.repeat_penalty) || 1.0,
			presence_penalty: Number(currentConfig.presence_penalty) || 0.0,
			frequency_penalty: Number(currentConfig.frequency_penalty) || 0.0,
			dry_multiplier: Number(currentConfig.dry_multiplier) || 0.0,
			dry_base: Number(currentConfig.dry_base) || 1.75,
			dry_allowed_length: Number(currentConfig.dry_allowed_length) || 2,
			dry_penalty_last_n: Number(currentConfig.dry_penalty_last_n) || -1,
			samplers: currentConfig.samplers || 'top_k;tfs_z;typical_p;top_p;min_p;temperature',
			custom: currentConfig.custom || ''
		};

		// Helpers
		const MAX_TOOL_ROUNDS = 10;
		let round = 0;
		let didFinalComplete = false;
		const seenCalls = new Set<string>();

		const summarizeMessages = (msgs: any[]) =>
			msgs.map((m, i) => {
				const role = m.role || m.type || 'unknown';
				const hasToolCalls = Array.isArray(m.tool_calls) && m.tool_calls.length > 0;
				const content = (m.content ?? '').toString();
				return {
					i,
					role,
					hasToolCalls,
					preview: content.length > 120 ? content.slice(0, 120) + '…' : content
				};
			});

		// This tail contains only API-shaped messages emitted during this assistant turn
		let historyTail: any[] = [];

		const convId = this.activeConversation?.id ?? '';

		while (true) {
			round++;
			if (round > MAX_TOOL_ROUNDS) {
				console.warn(`⚠️ Reached MAX_TOOL_ROUNDS(${MAX_TOOL_ROUNDS}). Stopping tool loop.`);
				break;
			}

			streamedContent = '';

			// Track per-round assistant TEXT message (distinct message each round)
			let roundAssistantMsg: DatabaseMessage | null = null;
			let createdRoundAssistantMsg = false; // created in this round (so we can delete if no text)
			let roundHadText = false;

			// For round 1 reuse the initially created assistantMessage; for later rounds create a fresh one now
			if (round === 1) {
				roundAssistantMsg = assistantMessage;
			} else {
				// parent = last message currently in the UI (tool or assistant from previous step)
				const parentId = this.activeMessages.length
					? this.activeMessages[this.activeMessages.length - 1].id
					: (assistantMessage.parent ?? '-1');

				roundAssistantMsg = await DatabaseService.addMessage({
					convId,
					role: 'assistant',
					content: '',
					type: 'text',
					timestamp: Date.now(),
					parent: parentId,
					thinking: '',
					children: [],
					extra: undefined
				});
				this.activeMessages.push(roundAssistantMsg);
				this.updateConversationTimestamp();
				createdRoundAssistantMsg = true;
			}

			// Collect tool-calls and construct API assistant tool-call msg
			let assistantToolCallApiMsg: any | null = null;
			let assistantToolCallDbMsg: DatabaseMessage | null = null;
			const collectedToolCalls: ApiToolCall[] = [];

			const outgoing = [...allMessages, ...historyTail];
			console.groupCollapsed(`🌀 Tool round #${round}`);
			console.log('→ Outgoing messages:', summarizeMessages(outgoing));

			await this.chatService.sendChatCompletion(outgoing, {
				...apiOptions,
				tools: editorTools,
				tool_choice: 'auto',

				onChunk: (chunk: string) => {
					streamedContent += chunk;
					this.currentResponse = streamedContent;

					const partialThinking = extractPartialThinking(streamedContent);
					const clean = partialThinking.remainingContent || streamedContent;

					// Mark that we had text in this round if non-empty delta assembled so far
					if (clean && clean.trim().length > 0) {
						roundHadText = true;
					}

					// Update the current round's assistant text message in the UI
					if (roundAssistantMsg) {
						const idx = this.activeMessages.findIndex(
							(m) => m.id === roundAssistantMsg!.id
						);
						if (idx !== -1) {
							this.activeMessages[idx].content = clean;
						}
					}
				},

				onToolCalls: async (calls: ApiToolCall[]) => {
					// Ensure each call has an id (needed to link tool results)
					for (const c of calls) {
						if (!c.id) {
							c.id =
								globalThis.crypto?.randomUUID?.() ??
								Math.random().toString(36).slice(2);
						}
						console.log('🛠 tool call:', {
							id: c.id,
							name: c.function?.name ?? (c as any).name,
							args: c.function?.arguments ?? (c as any).arguments
						});
					}
					collectedToolCalls.push(...calls);

					// API-shaped assistant message that *requests* tools
					assistantToolCallApiMsg = {
						role: 'assistant',
						content: '',
						tool_calls: calls.map((c) => ({
							id: c.id,
							type: 'function',
							function: {
								name: c.function.name,
								arguments: c.function.arguments
							}
						}))
					};

					// Persist a DB assistant message that holds the toolCalls
					try {
						const dbMsgPayload: any = {
							convId,
							role: 'assistant',
							content: '',
							type: 'text',
							timestamp: Date.now(),
							parent: roundAssistantMsg?.id ?? assistantMessage.parent ?? '-1',
							thinking: '',
							children: [],
							toolCalls: calls.map((c) => ({
								id: c.id!,
								type: 'function',
								name: c.function.name,
								arguments: c.function.arguments
							}))
						};

						assistantToolCallDbMsg = await DatabaseService.addMessage(dbMsgPayload);
						this.activeMessages.push(assistantToolCallDbMsg);
						this.updateConversationTimestamp();

						historyTail = [...historyTail, assistantToolCallApiMsg];

						console.log('💾 stored assistant tool_call message in DB:', {
							id: assistantToolCallDbMsg.id,
							toolCalls: assistantToolCallDbMsg.toolCalls?.length ?? 0
						});
					} catch (err) {
						console.warn('Failed to persist assistant tool_call message:', err);
					}
				},

				onComplete: async () => {
					console.log(
						'✅ stream complete. Final assembled text length:',
						streamedContent.length
					);

					// Save the final clean text for THIS ROUND's assistant text message (if any)
					const finalClean = ((): string => {
						const pt = extractPartialThinking(streamedContent);
						return pt.remainingContent || streamedContent || '';
					})();

					if (roundHadText && roundAssistantMsg) {
						await DatabaseService.updateMessage(roundAssistantMsg.id, {
							content: finalClean
						});
					}

					// 4) If there was assistant TEXT this round,
					//    insert it *before* the assistant(tool_calls) we already pushed.
					if (roundHadText && finalClean.trim()) {
						if (assistantToolCallApiMsg) {
							// find the last occurrence we just pushed and insert before it
							const idx = historyTail.lastIndexOf(assistantToolCallApiMsg);
							if (idx >= 0) {
								historyTail.splice(idx, 0, {
									role: 'assistant',
									content: finalClean
								});
							} else {
								historyTail.push({ role: 'assistant', content: finalClean });
							}
						} else {
							// no tool calls → just append
							historyTail.push({ role: 'assistant', content: finalClean });
						}
					}
				},

				onError: (error: Error) => {
					if (error.name === 'AbortError' || error instanceof DOMException) {
						console.log('⛔ Generation aborted by user.');
						this.isLoading = false;
						this.currentResponse = '';
						console.groupEnd();
						return;
					}

					if (error.name === 'ContextError') {
						console.warn('Context error detected:', error.message);
						this.isLoading = false;
						this.currentResponse = '';
						slotsService.stopPolling();

						// remove the placeholder created this round if it has no text
						if (createdRoundAssistantMsg && roundAssistantMsg && !roundHadText) {
							const rmIdx = this.activeMessages.findIndex(
								(m) => m.id === roundAssistantMsg!.id
							);
							if (rmIdx !== -1) this.activeMessages.splice(rmIdx, 1);
							DatabaseService.deleteMessage(roundAssistantMsg.id).catch(
								console.error
							);
						}

						this.maxContextError = {
							message: error.message,
							estimatedTokens: 0,
							maxContext: 4096
						};

						if (onError) onError(error);
						console.groupEnd();
						return;
					}

					console.error('Streaming error:', error);
					this.isLoading = false;
					this.currentResponse = '';

					if (roundAssistantMsg) {
						const idx = this.activeMessages.findIndex(
							(m: DatabaseMessage) => m.id === roundAssistantMsg!.id
						);
						if (idx !== -1) {
							this.activeMessages[idx].content = `Error: ${error.message}`;
						}
					}

					if (onError) onError(error);
					console.groupEnd();
				}
			});

			// Decide whether to finish or run tools and continue
			if (collectedToolCalls.length === 0) {
				console.log('🏁 No tool calls this round — finishing.');

				// If we created a placeholder but never got text, clean it up
				if (createdRoundAssistantMsg && roundAssistantMsg && !roundHadText) {
					const rmIdx = this.activeMessages.findIndex(
						(m) => m.id === roundAssistantMsg!.id
					);
					if (rmIdx !== -1) this.activeMessages.splice(rmIdx, 1);
					await DatabaseService.deleteMessage(roundAssistantMsg.id).catch(console.error);
				}

				if (!didFinalComplete && onComplete) {
					didFinalComplete = true;
					await onComplete(streamedContent);
				}
				this.isLoading = false;
				this.currentResponse = '';
				console.groupEnd();
				break;
			}

			// We have tool calls. Build the tool outputs and extend the history in correct order:
			// assistant(TEXT?) → assistant(tool_calls) → tool …

			// 1) If this round produced assistant TEXT, add it to historyTail as a normal assistant message
			const finalRoundText = ((): string => {
				const pt = extractPartialThinking(streamedContent);
				return pt.remainingContent || streamedContent || '';
			})();
			const roundHasNonEmptyText = roundHadText && finalRoundText.trim().length > 0;

			// If we created a placeholder but ended with no text, remove it
			if (createdRoundAssistantMsg && roundAssistantMsg && !roundHasNonEmptyText) {
				const rmIdx = this.activeMessages.findIndex((m) => m.id === roundAssistantMsg!.id);
				if (rmIdx !== -1) this.activeMessages.splice(rmIdx, 1);
				await DatabaseService.deleteMessage(roundAssistantMsg.id).catch(console.error);
			}

			// 2) Execute tools and persist results
			const toolApiMsgs: any[] = [];
			for (let i = 0; i < collectedToolCalls.length; i++) {
				const c = collectedToolCalls[i];
				const fingerprint = `${c.function.name}:${c.function.arguments}`;
				if (seenCalls.has(fingerprint)) {
					console.warn('🔁 Repeated tool call detected (same name+args):', fingerprint);
				}
				seenCalls.add(fingerprint);

				console.groupCollapsed(`🔧 Executing ${c.function.name}`);
				console.log('args:', c.function.arguments);
				const t0 = performance.now();
				const toolApiMsg = await executeEditorTool(c); // expected shape: { role:'tool', content, tool_call_id, name? }
				const t1 = performance.now();
				console.log(
					'result (preview):',
					typeof toolApiMsg?.content === 'string'
						? toolApiMsg.content.length > 200
							? toolApiMsg.content.slice(0, 200) + '…'
							: toolApiMsg.content
						: toolApiMsg
				);
				console.log(`⏱ ${c.function.name} took ${(t1 - t0).toFixed(1)}ms`);
				console.groupEnd();

				// Ensure tool_call_id is present for API linking
				if (!toolApiMsg.tool_call_id) {
					toolApiMsg.tool_call_id = c.id!;
				}
				if (!toolApiMsg.name) {
					toolApiMsg.name = c.function.name;
				}

				toolApiMsgs.push(toolApiMsg);

				// Persist tool result message in DB + memory
				try {
					const dbToolMsg: any = {
						convId,
						role: 'tool',
						content: toolApiMsg.content,
						type: 'text',
						timestamp: (assistantToolCallDbMsg?.timestamp ?? Date.now()) + (i + 1),
						parent:
							assistantToolCallDbMsg?.id ??
							roundAssistantMsg?.id ??
							assistantMessage.parent ??
							'-1',
						thinking: '',
						children: [],
						toolCallId: toolApiMsg.tool_call_id,
						toolName: toolApiMsg.name ?? c.function.name
					};

					const savedToolMsg = await DatabaseService.addMessage(dbToolMsg);
					this.activeMessages.push(savedToolMsg);
					this.updateConversationTimestamp();

					console.log('💾 stored tool message in DB:', {
						id: savedToolMsg.id,
						toolCallId: savedToolMsg.toolCallId,
						name: savedToolMsg.toolName
					});
				} catch (err) {
					console.warn('Failed to persist tool message:', err);
				}
			}

			historyTail = [...historyTail, ...toolApiMsgs];

			console.log(
				'✓ Appended messages to historyTail (assistant text?, assistant tool_calls, tools).'
			);
			console.log('Next round historyTail summary:', summarizeMessages(historyTail));
			console.groupEnd();

			// Prepare for next while-iteration; the next round will create its own assistant text message
		}
	}

	/**
	 * Private helper to handle abort errors consistently
	 */
	private isAbortError(error: unknown): boolean {
		return (
			error instanceof Error && (error.name === 'AbortError' || error instanceof DOMException)
		);
	}

	/**
	 * Private helper to update conversation lastModified timestamp and move to top
	 */
	private updateConversationTimestamp(): void {
		if (!this.activeConversation) return;

		const chatIndex = this.conversations.findIndex((c) => c.id === this.activeConversation!.id);

		if (chatIndex !== -1) {
			this.conversations[chatIndex].lastModified = Date.now();
			const updatedConv = this.conversations.splice(chatIndex, 1)[0];
			this.conversations.unshift(updatedConv);
		}
	}

	async sendMessage(content: string, extras?: DatabaseMessageExtra[]): Promise<void> {
		if ((!content.trim() && (!extras || extras.length === 0)) || this.isLoading) return;

		let isNewConversation = false;

		if (!this.activeConversation) {
			await this.createConversation();
			isNewConversation = true;
		}

		if (!this.activeConversation) {
			console.error('No active conversation available for sending message');
			return;
		}

		this.isLoading = true;
		this.currentResponse = '';

		let userMessage: DatabaseMessage | null = null;

		try {
			userMessage = await this.addMessage('user', content, 'text', '-1', extras);

			if (!userMessage) {
				throw new Error('Failed to add user message');
			}

			// If this is a new conversation, update the title with the first user prompt
			if (isNewConversation && content) {
				const title = content.trim();
				await this.updateConversationName(this.activeConversation.id, title);
			}

			const allMessages = await DatabaseService.getConversationMessages(
				this.activeConversation.id
			);
			const assistantMessage = await this.addMessage('assistant', '');

			if (!assistantMessage) {
				throw new Error('Failed to create assistant message');
			}

			await this.streamChatCompletion(
				allMessages,
				assistantMessage,
				undefined,
				(error: Error) => {
					// Handle context errors by also removing the user message
					if (error.name === 'ContextError' && userMessage) {
						slotsService.stopPolling();

						// Remove user message from UI
						const userMessageIndex = this.activeMessages.findIndex(
							(m: DatabaseMessage) => m.id === userMessage!.id
						);
						if (userMessageIndex !== -1) {
							this.activeMessages.splice(userMessageIndex, 1);
							// Remove from database
							DatabaseService.deleteMessage(userMessage.id).catch(console.error);
						}
					}
				}
			);
		} catch (error) {
			if (this.isAbortError(error)) {
				this.isLoading = false;
				return;
			}

			// Handle context errors by removing the user message if it was added
			if (error instanceof Error && error.name === 'ContextError' && userMessage) {
				slotsService.stopPolling();

				const userMessageIndex = this.activeMessages.findIndex(
					(m: DatabaseMessage) => m.id === userMessage.id
				);
				if (userMessageIndex !== -1) {
					this.activeMessages.splice(userMessageIndex, 1);
					DatabaseService.deleteMessage(userMessage.id).catch(console.error);
				}
			}

			console.error('Failed to send message:', error);
			this.isLoading = false;
		}
	}

	stopGeneration() {
		this.chatService.abort();
		this.savePartialResponseIfNeeded();
		this.isLoading = false;
		this.currentResponse = '';
	}

	/**
	 * Gracefully stop generation and save partial response
	 * This method handles both async and sync scenarios
	 */
	async gracefulStop(): Promise<void> {
		if (!this.isLoading) {
			return;
		}

		this.chatService.abort();
		await this.savePartialResponseIfNeeded();
		this.isLoading = false;
		this.currentResponse = '';
	}

	/**
	 * Clear context error state
	 */
	clearMaxContextError(): void {
		this.maxContextError = null;
	}

	// Allow external modules to set context error without importing heavy utils here
	setMaxContextError(
		error: { message: string; estimatedTokens: number; maxContext: number } | null
	): void {
		this.maxContextError = error;
	}

	private async savePartialResponseIfNeeded() {
		if (!this.currentResponse.trim() || !this.activeMessages.length) {
			return;
		}

		const lastMessage = this.activeMessages[this.activeMessages.length - 1];

		if (lastMessage && lastMessage.role === 'assistant') {
			try {
				const partialThinking = extractPartialThinking(this.currentResponse);

				const updateData: { content: string; thinking?: string } = {
					content: partialThinking.remainingContent || this.currentResponse
				};

				if (partialThinking.thinking) {
					updateData.thinking = partialThinking.thinking;
				}

				await DatabaseService.updateMessage(lastMessage.id, updateData);

				lastMessage.content = partialThinking.remainingContent || this.currentResponse;
			} catch (error) {
				lastMessage.content = this.currentResponse;
				console.error('Failed to save partial response:', error);
			}
		} else {
			console.error('Last message is not an assistant message');
		}
	}

	async updateMessage(messageId: string, newContent: string): Promise<void> {
		if (!this.activeConversation) return;

		// If currently loading, gracefully abort the ongoing generation
		if (this.isLoading) {
			this.stopGeneration();
		}

		try {
			const messageIndex = this.activeMessages.findIndex(
				(m: DatabaseMessage) => m.id === messageId
			);

			if (messageIndex === -1) {
				console.error('Message not found for update');
				return;
			}

			const messageToUpdate = this.activeMessages[messageIndex];
			const originalContent = messageToUpdate.content;

			if (messageToUpdate.role !== 'user') {
				console.error('Only user messages can be edited');
				return;
			}

			this.activeMessages[messageIndex].content = newContent;

			// Update the message in database immediately to ensure consistency
			// This prevents issues with rapid consecutive edits during regeneration
			await DatabaseService.updateMessage(messageId, { content: newContent });

			const messagesToRemove = this.activeMessages.slice(messageIndex + 1);
			for (const message of messagesToRemove) {
				await DatabaseService.deleteMessage(message.id);
			}

			this.activeMessages = this.activeMessages.slice(0, messageIndex + 1);

			// Update conversation timestamp
			this.updateConversationTimestamp();

			this.isLoading = true;
			this.currentResponse = '';

			try {
				// Use current in-memory messages which contain the updated content
				// instead of fetching from database which still has the old content
				const assistantMessage = await this.addMessage('assistant', '');

				if (!assistantMessage) {
					throw new Error('Failed to create assistant message');
				}

				await this.streamChatCompletion(
					this.activeMessages.slice(0, -1), // Exclude the just-added empty assistant message
					assistantMessage,
					undefined,
					(error: Error) => {
						// Restore original content on error
						const editedMessageIndex = this.activeMessages.findIndex(
							(m: DatabaseMessage) => m.id === messageId
						);
						if (editedMessageIndex !== -1) {
							this.activeMessages[editedMessageIndex].content = originalContent;
						}
					}
				);
			} catch (regenerateError) {
				console.error('Failed to regenerate response:', regenerateError);
				this.isLoading = false;

				const messageIndex = this.activeMessages.findIndex(
					(m: DatabaseMessage) => m.id === messageId
				);
				if (messageIndex !== -1) {
					this.activeMessages[messageIndex].content = originalContent;
				}
			}
		} catch (error) {
			if (this.isAbortError(error)) {
				return;
			}

			console.error('Failed to update message:', error);
		}
	}

	async regenerateMessage(messageId: string): Promise<void> {
		if (!this.activeConversation || this.isLoading) return;

		try {
			const messageIndex = this.activeMessages.findIndex(
				(m: DatabaseMessage) => m.id === messageId
			);
			if (messageIndex === -1) {
				console.error('Message not found for regeneration');
				return;
			}

			const messageToRegenerate = this.activeMessages[messageIndex];

			if (messageToRegenerate.role !== 'assistant') {
				console.error('Only assistant messages can be regenerated');
				return;
			}

			const messagesToRemove = this.activeMessages.slice(messageIndex);

			for (const message of messagesToRemove) {
				await DatabaseService.deleteMessage(message.id);
			}

			this.activeMessages = this.activeMessages.slice(0, messageIndex);

			// Update conversation timestamp
			this.updateConversationTimestamp();

			this.isLoading = true;
			this.currentResponse = '';

			try {
				const allMessages = await DatabaseService.getConversationMessages(
					this.activeConversation.id
				);
				const assistantMessage = await this.addMessage('assistant', '');

				if (!assistantMessage) {
					throw new Error('Failed to create assistant message');
				}

				await this.streamChatCompletion(allMessages, assistantMessage);
			} catch (regenerateError) {
				console.error('Failed to regenerate response:', regenerateError);
				this.isLoading = false;
			}
		} catch (error) {
			if (this.isAbortError(error)) {
				return;
			}

			console.error('Failed to regenerate message:', error);
		}
	}

	async updateConversationName(convId: string, name: string): Promise<void> {
		try {
			await DatabaseService.updateConversation(convId, { name });

			const convIndex = this.conversations.findIndex((c) => c.id === convId);

			if (convIndex !== -1) {
				this.conversations[convIndex].name = name;
			}

			if (this.activeConversation?.id === convId) {
				this.activeConversation.name = name;
			}
		} catch (error) {
			console.error('Failed to update conversation name:', error);
		}
	}

	async deleteConversation(convId: string): Promise<void> {
		try {
			await DatabaseService.deleteConversation(convId);

			this.conversations = this.conversations.filter((c) => c.id !== convId);

			if (this.activeConversation?.id === convId) {
				this.activeConversation = null;
				this.activeMessages = [];
				await goto('/?new_chat=true');
			}
		} catch (error) {
			console.error('Failed to delete conversation:', error);
		}
	}

	clearActiveConversation() {
		this.activeConversation = null;
		this.activeMessages = [];
		this.currentResponse = '';
		this.isLoading = false;
		this.maxContextError = null;
	}
}

export const chatStore = new ChatStore();

export const conversations = () => chatStore.conversations;
export const activeConversation = () => chatStore.activeConversation;
export const activeMessages = () => chatStore.activeMessages;
export const isLoading = () => chatStore.isLoading;
export const currentResponse = () => chatStore.currentResponse;
export const isInitialized = () => chatStore.isInitialized;
export const maxContextError = () => chatStore.maxContextError;

export const createConversation = chatStore.createConversation.bind(chatStore);
export const loadConversation = chatStore.loadConversation.bind(chatStore);
export const sendMessage = chatStore.sendMessage.bind(chatStore);
export const updateMessage = chatStore.updateMessage.bind(chatStore);
export const regenerateMessage = chatStore.regenerateMessage.bind(chatStore);
export const updateConversationName = chatStore.updateConversationName.bind(chatStore);
export const deleteConversation = chatStore.deleteConversation.bind(chatStore);
export const clearActiveConversation = chatStore.clearActiveConversation.bind(chatStore);
export const gracefulStop = chatStore.gracefulStop.bind(chatStore);
export const clearMaxContextError = chatStore.clearMaxContextError.bind(chatStore);
export const setMaxContextError = chatStore.setMaxContextError.bind(chatStore);

export function stopGeneration() {
	chatStore.stopGeneration();
}
export const messages = () => chatStore.activeMessages;
