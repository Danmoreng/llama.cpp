<script lang="ts">
	import { editorStore } from '$lib/stores/editor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Code, Eye, Columns } from '@lucide/svelte';

	let viewMode = $state<'code' | 'result' | 'split'>('split');
</script>

<div class="flex h-full flex-col overflow-hidden bg-background">
	<div class="flex items-center justify-between border-b border-border p-2">
		<span class="px-2 text-sm font-medium">Code Editor</span>
		<div class="flex gap-1">
			<Button
				variant={viewMode === 'code' ? 'default' : 'ghost'}
				size="sm"
				onclick={() => (viewMode = 'code')}
				title="Code View"
			>
				<Code class="h-4 w-4" />
			</Button>
			<Button
				variant={viewMode === 'split' ? 'default' : 'ghost'}
				size="sm"
				onclick={() => (viewMode = 'split')}
				title="Split View"
			>
				<Columns class="h-4 w-4" />
			</Button>
			<Button
				variant={viewMode === 'result' ? 'default' : 'ghost'}
				size="sm"
				onclick={() => (viewMode = 'result')}
				title="Result View"
			>
				<Eye class="h-4 w-4" />
			</Button>
		</div>
	</div>

	<div class="flex-1 overflow-hidden">
		{#if viewMode === 'code'}
			<textarea
				class="h-full w-full resize-none bg-muted p-4 font-mono text-sm focus:outline-none"
				bind:value={editorStore.currentCode}
				placeholder="Enter your HTML code here..."
			></textarea>
		{:else if viewMode === 'result'}
			<div class="h-full w-full bg-white">
				<iframe
					class="h-full w-full border-0"
					title="HTML Preview"
					sandbox="allow-scripts"
					srcdoc={editorStore.currentCode}
				></iframe>
			</div>
		{:else}
			<div class="flex h-full flex-row divide-x divide-border">
				<textarea
					class="h-full flex-1 resize-none bg-muted p-4 font-mono text-sm focus:outline-none"
					bind:value={editorStore.currentCode}
					placeholder="Enter your HTML code here..."
				></textarea>
				<div class="h-full flex-1 bg-white">
					<iframe
						class="h-full w-full border-0"
						title="HTML Preview"
						sandbox="allow-scripts"
						srcdoc={editorStore.currentCode}
					></iframe>
				</div>
			</div>
		{/if}
	</div>
</div>
