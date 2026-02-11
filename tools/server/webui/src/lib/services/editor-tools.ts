import { editorStore } from '$lib/stores/editor.svelte';
import type { ApiChatCompletionToolCall } from '$lib/types/api';

export const editorToolDefinitions = [
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
			description: 'Find and replace text within the current HTML. Use isRegex for regex replacements.',
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

function escapeRegExp(s: string) {
	return s.replace(/[.*+?^${}()|[\]\]/g, '\$&');
}

const implementations = {
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
		const out = src.replace(re, () => {
			count++;
			return args.replace;
		});

		editorStore.setCode(out);
		return { status: 'ok', replacements: count, length: out.length };
	}
};

export async function executeEditorTool(call: ApiChatCompletionToolCall): Promise<string> {
	const name = call.function?.name as keyof typeof implementations;
	const argStr = call.function?.arguments ?? '{}';
	let args: any = {};
	
	try {
		args = JSON.parse(argStr);
	} catch (e) {
		return JSON.stringify({ error: 'Invalid JSON arguments', raw: argStr });
	}

	if (!implementations[name]) {
		return JSON.stringify({ error: `Unknown tool: ${String(name)}` });
	}

	const result = await (implementations[name] as any)(args);
	return typeof result === 'string' ? result : JSON.stringify(result);
}
