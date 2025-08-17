// src/lib/ai/editorTools.ts
import type { ApiFunctionTool, ApiToolCall, ApiToolMessageData } from '$lib/types/api'; // adjust path
import { editorStore } from '$lib/stores/editor.svelte';

// ---- JSON Schemas the model will see ----
export const editorTools: ApiFunctionTool[] = [
	{
		type: 'function',
		function: {
			name: 'get_editor_code',
			description: 'Return the current HTML in the editor.',
			parameters: { type: 'object', properties: {}, additionalProperties: false }
		}
	},
	{
		type: 'function',
		function: {
			name: 'set_editor_code',
			description: 'Replace the entire HTML code in the editor.',
			parameters: {
				type: 'object',
				properties: { code: { type: 'string', description: 'The full HTML to set in the editor.' } },
				required: ['code'],
				additionalProperties: false
			}
		}
	},
	{
		type: 'function',
		function: {
			name: 'replace_in_editor_code',
			description:
				'Find and replace text within the current HTML. Use isRegex for regex replacements.',
			parameters: {
				type: 'object',
				properties: {
					find: { type: 'string' },
					replace: { type: 'string' },
					isRegex: { type: 'boolean', default: false },
					flags: { type: 'string', default: 'g' }
				},
				required: ['find', 'replace'],
				additionalProperties: false
			}
		}
	}
];

// ---- Runtime implementations the app will run ----
function escapeRegExp(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const impl = {
	async get_editor_code(): Promise<string> {
		return editorStore.currentCode;
	},

	async set_editor_code(args: { code: string }): Promise<{ status: 'ok'; length: number }> {
		editorStore.setCode(args.code);
		return { status: 'ok', length: editorStore.currentCode.length };
	},

	async replace_in_editor_code(args: {
		find: string;
		replace: string;
		isRegex?: boolean;
		flags?: string;
	}): Promise<{ status: 'ok'; replacements: number; length: number }> {
		const src = editorStore.currentCode ?? '';
		const pattern = args.isRegex ? args.find : escapeRegExp(args.find);
		const flags = args.flags ?? 'g';
		const re = new RegExp(pattern, flags);

		let count = 0;
		const out = src.replace(re, (m) => { count++; return args.replace; });

		editorStore.setCode(out);
		return { status: 'ok', replacements: count, length: out.length };
	}
} as const;

export async function executeEditorTool(call: ApiToolCall): Promise<ApiToolMessageData> {
	const name = call.function?.name as keyof typeof impl;
	const argStr = call.function?.arguments ?? '{}';
	let args: any = {};
	try {
		args = argStr ? JSON.parse(argStr) : {};
	} catch (e) {
		return {
			role: 'tool',
			tool_call_id: call.id,
			name: call.function?.name,
			content: JSON.stringify({ error: 'Invalid JSON arguments', raw: argStr })
		};
	}

	if (!impl[name]) {
		return {
			role: 'tool',
			tool_call_id: call.id,
			name: call.function?.name,
			content: JSON.stringify({ error: `Unknown tool: ${String(name)}` })
		};
	}

	const result = await (impl[name] as any)(args);
	return {
		role: 'tool',
		tool_call_id: call.id,
		name: call.function?.name,
		content: typeof result === 'string' ? result : JSON.stringify(result)
	};
}
