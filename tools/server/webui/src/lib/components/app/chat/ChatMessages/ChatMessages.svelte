<script lang="ts">
	import {
		updateMessage,
		regenerateMessage,
		deleteMessage
	} from '$lib/stores/chat.svelte';
	import { ChatMessage } from '$lib/components/app';

	interface Props {
		class?: string;
		messages?: DatabaseMessage[];
	}

	let { class: className, messages = [] }: Props = $props();

  // Map: toolCallId -> tool message (runes-safe computed value)
  let toolMsgsById = $derived.by(() =>
    new Map(
      messages
        .filter((m) => m.role === 'tool' && m.toolCallId)
        .map((m) => [m.toolCallId!, m])
    )
  );

  // Optional: hide raw tool rows that are already paired to an assistant call
  function isPairedToolMessage(m: DatabaseMessage) {
    if (m.role !== 'tool' || !m.toolCallId) return false;
    return messages.some(
      (a) =>
        a.role === 'assistant' &&
        Array.isArray(a.toolCalls) &&
        a.toolCalls.some((tc) => tc.id === m.toolCallId)
    );
  }
</script>

<div class="flex h-full flex-col space-y-10 pt-16 md:pt-24 {className}" style="height:auto;">
  {#each messages as message (message.id)}
    {#if !(message.role === 'tool' && isPairedToolMessage(message))}
      <ChatMessage
        class="mx-auto w-full max-w-[48rem]"
        {message}

        getToolMessage={(id) => toolMsgsById.get(id)}
        onUpdateMessage={async (msg, newContent) => { await updateMessage(msg.id, newContent); }}
        onRegenerate={async (msg) => { await regenerateMessage(msg.id); }}
        onDelete={async (msg) => { await deleteMessage(msg.id); }}
      />
    {/if}
  {/each}
</div>
