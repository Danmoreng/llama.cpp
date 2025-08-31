<script lang="ts">
	import { ChatMessageThinkingBlock, MarkdownContent, ChatMessageToolCall } from '$lib/components/app';
	import { useProcessingState } from '$lib/hooks/use-processing-state.svelte';
	import { isLoading } from '$lib/stores/chat.svelte';
	import type { DatabaseMessage } from '$lib/types/database';
	import type { MessageSiblingInfo } from '$lib/utils/branching';
	import { fade } from 'svelte/transition';
	import ChatMessageActions from './ChatMessageActions.svelte';

	interface Props {
		class?: string;
		deletionInfo: {
			totalCount: number;
			userMessages: number;
			assistantMessages: number;
			messageTypes: string[];
		} | null;
		message: DatabaseMessage;
		messageContent: string | undefined;
		onCopy: () => void;
		onConfirmDelete: () => void;
		onDelete: () => void;
		onNavigateToSibling?: (siblingId: string) => void;
		onRegenerate: () => void;
		onShowDeleteDialogChange: (show: boolean) => void;
		showDeleteDialog: boolean;
		siblingInfo?: MessageSiblingInfo | null;
		thinkingContent: string | null;
		getToolMessage?: (id: string) => DatabaseMessage | undefined;
	}

	let {
		class: className = '',
		deletionInfo,
		message,
		messageContent,
		onConfirmDelete,
		onCopy,
		onDelete,
		onNavigateToSibling,
		onRegenerate,
		onShowDeleteDialogChange,
		showDeleteDialog,
		siblingInfo = null,
		thinkingContent,
		getToolMessage
	}: Props = $props();

	const processingState = useProcessingState();
</script>

<div
	class="text-md leading-7.5 group w-full {className}"
	role="group"
	aria-label="Assistant message with actions"
>
	{#if thinkingContent}
		<ChatMessageThinkingBlock
			reasoningContent={thinkingContent}
			isStreaming={!message.timestamp}
			hasRegularContent={!!messageContent?.trim()}
		/>
	{/if}

	{#if message?.role === 'assistant' && !message.content && isLoading()}
		<div class="w-full max-w-[48rem] mt-6" in:fade>
			<div class="processing-container">
				<span class="processing-text">
					{processingState.getProcessingMessage()}
				</span>

				{#if processingState.shouldShowDetails()}
					<div class="processing-details">
						{#each processingState.getProcessingDetails() as detail}
							<span class="processing-detail">{detail}</span>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if message.role === 'assistant'}
		<ChatMessageToolCall
			assistantMessage={message}
			getToolMessage={getToolMessage}
		/>
		<MarkdownContent content={messageContent} />
	{:else}
		<div class="whitespace-pre-wrap text-sm">
			{messageContent}
		</div>
	{/if}

	{#if message.timestamp}
		<ChatMessageActions
			{message}
			role="assistant"
			justify="start"
			actionsPosition="left"
			{siblingInfo}
			{showDeleteDialog}
			{deletionInfo}
			{onCopy}
			{onRegenerate}
			{onDelete}
			{onConfirmDelete}
			{onNavigateToSibling}
			{onShowDeleteDialogChange}
		/>
	{/if}
</div>

<style>
	.processing-container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.processing-text {
		background: linear-gradient(
			90deg,
			var(--muted-foreground),
			var(--foreground),
			var(--muted-foreground)
		);
		background-size: 200% 100%;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: shine 1s linear infinite;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.processing-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.processing-detail {
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}

	@keyframes shine {
		to {
			background-position: -200% 0;
		}
	}
</style>
