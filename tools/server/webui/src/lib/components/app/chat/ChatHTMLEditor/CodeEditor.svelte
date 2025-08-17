<script>
    import { editorStore } from "$lib/stores/editor.svelte.js";
</script>

<div class="flex flex-col flex-1 h-full flex-grow bg-gray-600 pt-16">
    <h1>Header elements</h1>
    <div class="flex flex-row h-full">
        <textarea class="flex-1" bind:value={editorStore.currentCode}></textarea>
        <div class="flex flex-1">
            <iframe class="w-full" sandbox="allow-scripts" srcdoc={editorStore.currentCode}></iframe>
        </div>
    </div>
</div>

<style>
    textarea {
        width: 100%;
        padding: 10px;
        background-color: #1e1e2f;
        border: none;
        font-family: 'Courier New', Courier, monospace;
        font-size: 14px;
        color: #f8f8f2;
        border-radius: 4px;
        resize: none;
        min-height: 0;
    }
</style>
