<script lang="ts">
	import { browser } from '$app/environment';
	import { editorStore } from '$lib/stores/editor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { highlightCode } from '$lib/utils/code';
	import { ColorMode } from '$lib/enums';
	import { mode } from 'mode-watcher';
	import { Code, Eye, Columns } from '@lucide/svelte';

	import githubDarkCss from 'highlight.js/styles/github-dark.css?inline';
	import githubLightCss from 'highlight.js/styles/github.css?inline';

	let viewMode = $state<'code' | 'result' | 'split'>('split');
	let highlightedHtml = $state('&#8203;');
	let textareaRef = $state<HTMLTextAreaElement>();
	let highlightScrollRef = $state<HTMLDivElement>();

	const highlightThemeStyleId = `chat-html-editor-highlight-theme-${Math.random().toString(36).slice(2)}`;

	function loadHighlightTheme(isDark: boolean) {
		if (!browser) return;

		let style = document.getElementById(highlightThemeStyleId);

		if (!(style instanceof HTMLStyleElement)) {
			style = document.createElement('style');
			style.id = highlightThemeStyleId;
			document.head.appendChild(style);
		}

		style.textContent = isDark ? githubDarkCss : githubLightCss;
	}

	function removeHighlightTheme() {
		if (!browser) return;

		document.getElementById(highlightThemeStyleId)?.remove();
	}

	function syncHighlightScroll() {
		if (!textareaRef || !highlightScrollRef) return;

		highlightScrollRef.scrollTop = textareaRef.scrollTop;
		highlightScrollRef.scrollLeft = textareaRef.scrollLeft;
	}

	function handleTextareaScroll() {
		syncHighlightScroll();
	}

	function handleTextareaKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab' || event.shiftKey || !textareaRef) return;

		event.preventDefault();

		const { selectionStart, selectionEnd } = textareaRef;
		const nextCode =
			editorStore.currentCode.slice(0, selectionStart) +
			'\t' +
			editorStore.currentCode.slice(selectionEnd);
		const nextSelection = selectionStart + 1;

		editorStore.currentCode = nextCode;

		queueMicrotask(() => {
			textareaRef?.setSelectionRange(nextSelection, nextSelection);
			syncHighlightScroll();
		});
	}

	$effect(() => {
		const currentMode = mode.current;
		loadHighlightTheme(currentMode === ColorMode.DARK);
	});

	$effect(() => {
		const code = editorStore.currentCode;
		const nextHighlightedHtml = highlightCode(code, 'html');
		const needsSentinel = code.length === 0 || code.endsWith('\n');

		highlightedHtml = needsSentinel ? `${nextHighlightedHtml}&#8203;` : nextHighlightedHtml;
	});

	$effect(() => {
		textareaRef;
		highlightScrollRef;

		syncHighlightScroll();
	});

	$effect(() => {
		return () => {
			removeHighlightTheme();
		};
	});
</script>

{#snippet editorSurface()}
	<div class="code-editor-surface relative h-full w-full overflow-hidden bg-muted">
		<div
			bind:this={highlightScrollRef}
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 overflow-auto"
		>
			<pre class="editor-layer editor-pre m-0"><code class="hljs language-html"
					>{@html highlightedHtml}</code
				></pre>
		</div>

		<textarea
			bind:this={textareaRef}
			bind:value={editorStore.currentCode}
			aria-label="HTML code editor"
			autocapitalize="off"
			autocomplete="off"
			class="editor-layer editor-textarea absolute inset-0 h-full w-full resize-none overflow-auto border-0 bg-transparent text-transparent focus:outline-none"
			placeholder="Enter your HTML code here..."
			spellcheck="false"
			wrap="off"
			onkeydown={handleTextareaKeydown}
			onscroll={handleTextareaScroll}
		></textarea>
	</div>
{/snippet}

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
			{@render editorSurface()}
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
				<div class="min-w-0 flex-1">
					{@render editorSurface()}
				</div>
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

<style>
	.code-editor-surface {
		font-family:
			ui-monospace, SFMono-Regular, 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas,
			'Liberation Mono', Menlo, monospace;
	}

	.editor-layer {
		padding: 1rem;
		font-family: inherit;
		font-size: 0.875rem;
		line-height: 1.5rem;
		tab-size: 2;
		white-space: pre;
		word-break: normal;
		overflow-wrap: normal;
	}

	.editor-pre {
		min-width: max-content;
		background: transparent;
	}

	.editor-pre code {
		display: block;
		min-width: max-content;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		letter-spacing: inherit;
		tab-size: inherit;
		white-space: inherit;
		padding: 0;
		background: transparent;
	}

	.editor-textarea {
		color: transparent;
		caret-color: var(--foreground);
		-webkit-text-fill-color: transparent;
	}

	.editor-textarea::placeholder {
		color: var(--muted-foreground);
		-webkit-text-fill-color: var(--muted-foreground);
	}

	.editor-textarea::selection {
		background: color-mix(in srgb, var(--accent) 45%, transparent);
	}
</style>
