<script lang="ts">
    import { BadgeCheck, Wrench, ChevronDown } from '@lucide/svelte';
    import { MarkdownContent } from '$lib/components/app';

    // props (Svelte 5 runes)
    const { call, toolMsg } = $props<{
        call: { id: string; name: string; arguments?: string };
        toolMsg?: { content: string };
    }>();

    // local open/close state (per card instance)
    let open = $state(false);

    function tryParseJSON(s?: string) {
        if (!s) return null;
        try { return JSON.parse(s); } catch { return null; }
    }
</script>

<div class="tool-card" data-open={open}>
    <div class="tool-card-header">
        <div class="left-side">
            <div class="tool-icon"><Wrench class="icon-16" /></div>
            <div class="tool-title">
                {call.name}
                <span class="tool-id">#{call.id.slice(0, 6)}</span>
            </div>
        </div>

        <div class="right-side">
            {#if toolMsg}
        <span class="status status--ok">
          <BadgeCheck class="icon-14 icon-inline" />
          <span>result received</span>
        </span>
            {:else}
                <span class="status status--waiting">waiting…</span>
            {/if}

            <button
                class="collapse-btn"
                aria-expanded={open}
                aria-controls={"section-" + call.id}
                onclick={() => (open = !open)}
                title={open ? "Collapse" : "Expand"}
            >
                <ChevronDown class="icon-16 chevron" />
                <span class="visually-hidden">{open ? 'Collapse' : 'Expand'}</span>
            </button>
        </div>
    </div>

    <div id={"section-" + call.id} class="tool-card-body" hidden={!open}>
    <pre class="code-block">
{JSON.stringify(tryParseJSON(call.arguments) ?? call.arguments, null, 2)}
    </pre>

        {#if toolMsg}
            {@const parsed = tryParseJSON(toolMsg.content)}
            <div class="divider">
                {#if parsed}
          <pre class="code-block">
{JSON.stringify(parsed, null, 2)}
          </pre>
                {:else}
                    <div class="result-label">Result</div>
                    <div class="markdown">
                        <MarkdownContent content={toolMsg.content} />
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    :root {
        --card-bg: rgba(0, 0, 0, 0.03);
        --card-border: rgba(125, 125, 125, 0.35);
        --code-bg: rgba(0, 0, 0, 0.06);
        --text: #111;
        --text-muted: #6b7280;
        --ring: rgba(59, 130, 246, 0.45);
    }
    @media (prefers-color-scheme: dark) {
        :root {
            --card-bg: rgba(255, 255, 255, 0.06);
            --card-border: rgba(255, 255, 255, 0.15);
            --code-bg: rgba(255, 255, 255, 0.07);
            --text: #e5e7eb;
            --text-muted: #9ca3af;
            --ring: rgba(96, 165, 250, 0.5);
        }
    }

    .tool-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; overflow: hidden; }
    .tool-card + .tool-card { margin-top: 12px; }

    .tool-card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px; }
    .left-side { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .right-side { display: inline-flex; align-items: center; gap: 8px; }

    .tool-icon { color: var(--text-muted); }
    .icon-16 { width: 16px; height: 16px; }
    .icon-14 { width: 14px; height: 14px; }
    .icon-inline { margin-right: 4px; }

    .tool-title { font-size: 14px; font-weight: 600; color: var(--text); display: inline-flex; align-items: baseline; gap: 6px; min-width: 0; }
    .tool-id { font-size: 12px; color: var(--text-muted); }

    .status { font-size: 12px; display: inline-flex; align-items: center; color: rgba(17, 17, 17, 0.8); }
    .status--waiting { color: var(--text-muted); }

    .collapse-btn { display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--card-border); background: transparent; border-radius: 8px; padding: 4px; line-height: 1; cursor: pointer; transition: transform 150ms ease, background 150ms ease, border-color 150ms ease, box-shadow 150ms ease; }
    .collapse-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--ring); }
    .collapse-btn:hover { background: var(--code-bg); }
    .tool-card[data-open="true"] .chevron { transform: rotate(180deg); }
    .chevron { transition: transform 150ms ease; }

    .tool-card-body { padding: 0 12px 12px 12px; animation: fadeIn 160ms ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }

    .code-block { margin-top: 8px; background: var(--code-bg); padding: 8px; border-radius: 8px; font-size: 12px; line-height: 1.4; overflow: auto; max-height: 360px; }
    .divider { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--card-border); }
    .result-label { font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
    .markdown { max-width: none; font-size: 0.9rem; color: var(--text); }
    .markdown :global(a) { text-decoration: underline; }

    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
</style>
