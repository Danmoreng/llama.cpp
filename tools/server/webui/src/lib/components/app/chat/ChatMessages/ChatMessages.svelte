<script lang="ts">
    import { ChatMessage } from '$lib/components/app';
    import { DatabaseStore } from '$lib/stores/database';
    import {
        activeConversation,
        deleteMessage,
        navigateToSibling,
        editMessageWithBranching,
        regenerateMessageWithBranching,
        updateMessage,
        regenerateMessage
    } from '$lib/stores/chat.svelte';
    import { getMessageSiblings } from '$lib/utils/branching';

    interface Props {
        class?: string;
        messages?: DatabaseMessage[];
        onUserAction?: () => void;
    }

    let { class: className, messages = [], onUserAction }: Props = $props();

    let allConversationMessages = $state<DatabaseMessage[]>([]);

    function refreshAllMessages() {
        const conversation = activeConversation();

        if (conversation) {
            DatabaseStore.getConversationMessages(conversation.id).then((messages) => {
                allConversationMessages = messages;
            });
        } else {
            allConversationMessages = [];
        }
    }

    // Track conversation changes
    $effect(() => {
        const conversation = activeConversation();
        if (conversation) {
            refreshAllMessages();
        }
    });

    // Map: toolCallId -> tool message
    let toolMsgsById = $derived.by(
        () =>
            new Map(
                messages
                    .filter((m) => m.role === 'tool' && m.toolCallId)
                    .map((m) => [m.toolCallId!, m])
            )
    );

    // Hide raw tool rows that are already paired to an assistant tool_call
    function isPairedToolMessage(m: DatabaseMessage) {
        if (m.role !== 'tool' || !m.toolCallId) return false;
        return messages.some(
            (a) =>
                a.role === 'assistant' &&
                Array.isArray(a.toolCalls) &&
                a.toolCalls.some((tc) => tc.id === m.toolCallId)
        );
    }

    // Filtered list for display (hide paired tool messages)
    let filteredMessages = $derived.by(() =>
        messages.filter((m) => !(m.role === 'tool' && isPairedToolMessage(m)))
    );

    // Attach sibling info to each displayed message
    let displayMessages = $derived.by(() => {
        if (!filteredMessages.length) return [];

        return filteredMessages.map((message) => {
            const siblingInfo = getMessageSiblings(allConversationMessages, message.id);
            return {
                message,
                siblingInfo:
                    siblingInfo || {
                        message,
                        siblingIds: [message.id],
                        currentIndex: 0,
                        totalSiblings: 1
                    }
            };
        });
    });

    async function handleNavigateToSibling(siblingId: string) {
        await navigateToSibling(siblingId);
    }

    // Branching edit/regenerate (keep existing UX)
    async function handleEditWithBranching(message: DatabaseMessage, newContent: string) {
        onUserAction?.();
        await editMessageWithBranching(message.id, newContent);
        refreshAllMessages();
    }
    async function handleRegenerateWithBranching(message: DatabaseMessage) {
        onUserAction?.();
        await regenerateMessageWithBranching(message.id);
        refreshAllMessages();
    }

    // Non-branching update/regenerate (new events)
    async function handleUpdateMessage(message: DatabaseMessage, newContent: string) {
        onUserAction?.();
        await updateMessage(message.id, newContent);
        refreshAllMessages();
    }
    async function handleRegenerate(message: DatabaseMessage) {
        onUserAction?.();
        await regenerateMessage(message.id);
        refreshAllMessages();
    }

    async function handleDeleteMessage(message: DatabaseMessage) {
        await deleteMessage(message.id);
        refreshAllMessages();
    }
</script>

<div class="flex h-full flex-col space-y-10 pt-16 md:pt-24 {className}" style="height: auto;">
    {#each displayMessages as { message, siblingInfo } (message.id)}
        <ChatMessage
            class="mx-auto w-full max-w-[48rem]"
            {message}
            {siblingInfo}
            getToolMessage={(id) => toolMsgsById.get(id)}
            onDelete={handleDeleteMessage}
            onNavigateToSibling={handleNavigateToSibling}
            onEditWithBranching={handleEditWithBranching}
            onRegenerateWithBranching={handleRegenerateWithBranching}
            onUpdateMessage={handleUpdateMessage}
            onRegenerate={handleRegenerate}
        />
    {/each}
</div>
