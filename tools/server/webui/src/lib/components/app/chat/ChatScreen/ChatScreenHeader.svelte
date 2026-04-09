<script lang="ts">
	import { Layout, Settings } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import { getChatSettingsDialogContext } from '$lib/contexts';

	interface Props {
		showEditor: boolean;
		onToggleEditor: () => void;
	}

	let { showEditor, onToggleEditor }: Props = $props();

	const sidebar = useSidebar();
	const chatSettingsDialog = getChatSettingsDialogContext();
</script>

<header
	class="pointer-events-none fixed top-0 right-0 left-0 z-50 flex items-center justify-end p-2 duration-200 ease-linear md:p-4 {sidebar.open
		? 'md:left-[var(--sidebar-width)]'
		: ''}"
>
	<div class="pointer-events-auto flex items-center space-x-2">
		<Button
			variant={showEditor ? 'default' : 'ghost'}
			size="icon-lg"
			onclick={onToggleEditor}
			title="Toggle code editor"
			class="rounded-full backdrop-blur-lg"
		>
			<Layout class="h-4 w-4" />
		</Button>
		<Button
			variant="ghost"
			size="icon-lg"
			onclick={() => chatSettingsDialog.open()}
			title="Chat settings"
			class="rounded-full backdrop-blur-lg"
		>
			<Settings class="h-4 w-4" />
		</Button>
	</div>
</header>
