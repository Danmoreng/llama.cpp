<script>
    import { editorStore } from "$lib/stores/editor.svelte.js";
    
    let { viewMode = 'split' } = $props();
</script>

<div class="flex flex-col h-full bg-background">
    {#if viewMode === 'code'}
        <textarea 
            class="flex-1 w-full p-4 font-mono text-sm bg-muted resize-none focus:outline-none rounded-b-lg" 
            bind:value={editorStore.currentCode}
            placeholder="Enter your HTML code here..."
        ></textarea>
    {:else if viewMode === 'result'}
        <div class="flex-1 w-full bg-white rounded-b-lg">
            <iframe 
                class="w-full h-full border-0 rounded-b-lg" 
                sandbox="allow-scripts" 
                srcdoc={editorStore.currentCode}
            ></iframe>
        </div>
    {:else}
        <div class="flex flex-col h-full">
            <div class="flex flex-row flex-1 min-h-0">
                <textarea 
                    class="flex-1 w-full p-4 font-mono text-sm bg-muted resize-none focus:outline-none border-border border-r rounded-bl-lg" 
                    bind:value={editorStore.currentCode}
                    placeholder="Enter your HTML code here..."
                ></textarea>
                <div class="flex-1 bg-white">
                    <iframe 
                        class="w-full h-full border-0 rounded-br-lg" 
                        sandbox="allow-scripts" 
                        srcdoc={editorStore.currentCode}
                    ></iframe>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    textarea {
        width: 100%;
        padding: 16px;
        background-color: #1e1e2f;
        border: none;
        font-family: 'Fira Code', 'Courier New', Courier, monospace;
        font-size: 14px;
        color: #f8f8f2;
        border-radius: 0 0 0 8px;
        resize: none;
        min-height: 0;
    }
    
    textarea:focus {
        outline: 2px solid #4f46e5;
    }
</style>
