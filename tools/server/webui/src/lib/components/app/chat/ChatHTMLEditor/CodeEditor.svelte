<script>
    import { editorStore } from "$lib/stores/editor.svelte.js";
</script>

<div class="flex flex-col flex-1 flex-grow bg-gray-600 pt-16">
    <h1>Header elements</h1>
    <div class="flex flex-row h-full">
        <input class="flex-1 bg-gray-800 text-amber-50" bind:value={editorStore.currentCode} />
        <div class="flex flex-1 border-2 border-gray-300">
            <iframe sandbox="allow-scripts" srcdoc={editorStore.currentCode}></iframe>
        </div>
    </div>
</div>
