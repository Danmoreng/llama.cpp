<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {Square, ArrowUp, Code} from '@lucide/svelte';
    import ChatFormActionFileAttachments from './ChatFormActionFileAttachments.svelte';
    import ChatFormActionRecord from './ChatFormActionRecord.svelte';
    import * as Tooltip from '$lib/components/ui/tooltip';
    import { TOOLTIP_DELAY_DURATION } from '$lib/constants/tooltip-config';

    interface Props {
        disabled?: boolean;
        isLoading?: boolean;
        canSend?: boolean;
        onFileUpload?: (fileType?: 'image' | 'audio' | 'file' | 'pdf') => void;
        onStop?: () => void;
        onMicClick?: () => void;
        isRecording?: boolean;
        showCodeEditor?: boolean;
        onToggleCodeEditor?: () => void;
        class?: string;
    }

    let {
        disabled = false,
        isLoading = false,
        canSend = false,
        onFileUpload,
        onStop,
        onMicClick,
        isRecording = false,
        showCodeEditor = false,
        onToggleCodeEditor,
        class: className = ''
    }: Props = $props();
</script>

<div class="flex items-center justify-between gap-1 {className}">
    <div class="flex gap-2">
        <ChatFormActionFileAttachments
            disabled={disabled}
            {onFileUpload}
        />
        <Tooltip.Root delayDuration={TOOLTIP_DELAY_DURATION}>
            <Tooltip.Trigger>
                <Button
                    type="button"
                    onclick={onToggleCodeEditor}
                    class="text-muted-foreground bg-transparent hover:bg-foreground/10 hover:text-foreground h-8 w-8 rounded-full p-0"
                    aria-label={showCodeEditor ? "Hide code editor" : "Show code editor"}
                >
                    <span class="sr-only">{showCodeEditor ? "Hide code editor" : "Show code editor"}</span>
                    <Code class="h-4 w-4" />
                </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
                <p>{showCodeEditor ? "Hide code editor" : "Show code editor"}</p>
            </Tooltip.Content>
        </Tooltip.Root>
    </div>

    <div class="flex gap-2">

        {#if isLoading}
            <Button
                type="button"
                onclick={onStop}
                class="p-0 h-8 w-8 bg-transparent hover:bg-destructive/20"
            >
                <span class="sr-only">Stop</span>
                <Square class="h-8 w-8 fill-destructive stroke-destructive"/>
            </Button>
        {:else}
            <ChatFormActionRecord
                {disabled}
                {isLoading}
                {isRecording}
                {onMicClick}
            />

            <Button
                type="submit"
                disabled={!canSend || disabled || isLoading}
                class="h-8 w-8 rounded-full p-0"
            >
                <span class="sr-only">Send</span>
                <ArrowUp class="h-12 w-12"/>
            </Button>
        {/if}
    </div>
</div>
