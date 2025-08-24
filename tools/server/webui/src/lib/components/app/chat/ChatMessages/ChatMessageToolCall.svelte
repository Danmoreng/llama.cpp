<script lang="ts">
    import ToolCallCard from './ToolCallCard.svelte';
    const { assistantMessage, getToolMessage } = $props<{
        assistantMessage: DatabaseMessage;
        getToolMessage: (id: string) => DatabaseMessage | undefined;
    }>();
</script>

{#if assistantMessage?.toolCalls?.length}
    <div class="tool-calls">
        {#each assistantMessage.toolCalls as call (call.id)}
            <ToolCallCard {call} toolMsg={getToolMessage?.(call.id)} />
        {/each}
    </div>
{/if}

<style>
    .tool-calls { margin-top: 16px; }
</style>
