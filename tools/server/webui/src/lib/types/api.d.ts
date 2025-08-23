export interface ApiChatMessageContentPart {
	type: 'text' | 'image_url' | 'input_audio';
	text?: string;
	image_url?: {
		url: string;
	};
	input_audio?: {
		data: string;
		format: 'wav' | 'mp3';
	};
}

export interface ApiChatMessageData {
	role: ChatRole;
	content: string | ApiChatMessageContentPart[];
	timestamp?: number;
}

export interface ApiLlamaCppServerProps {
	default_generation_settings: {
		id: number;
		id_task: number;
		n_ctx: number;
		speculative: boolean;
		is_processing: boolean;
		params: {
			n_predict: number;
			seed: number;
			temperature: number;
			dynatemp_range: number;
			dynatemp_exponent: number;
			top_k: number;
			top_p: number;
			min_p: number;
			top_n_sigma: number;
			xtc_probability: number;
			xtc_threshold: number;
			typical_p: number;
			repeat_last_n: number;
			repeat_penalty: number;
			presence_penalty: number;
			frequency_penalty: number;
			dry_multiplier: number;
			dry_base: number;
			dry_allowed_length: number;
			dry_penalty_last_n: number;
			dry_sequence_breakers: string[];
			mirostat: number;
			mirostat_tau: number;
			mirostat_eta: number;
			stop: string[];
			max_tokens: number;
			n_keep: number;
			n_discard: number;
			ignore_eos: boolean;
			stream: boolean;
			logit_bias: any[];
			n_probs: number;
			min_keep: number;
			grammar: string;
			grammar_lazy: boolean;
			grammar_triggers: any[];
			preserved_tokens: any[];
			chat_format: string;
			reasoning_format: string;
			reasoning_in_content: boolean;
			thinking_forced_open: boolean;
			samplers: string[];
			'speculative.n_max': number;
			'speculative.n_min': number;
			'speculative.p_min': number;
			timings_per_token: boolean;
			post_sampling_probs: boolean;
			lora: any[];
		};
		prompt: string;
		next_token: {
			has_next_token: boolean;
			has_new_line: boolean;
			n_remain: number;
			n_decoded: number;
			stopping_word: string;
		};
	};
	total_slots: number;
	model_path: string;
	modalities: {
		vision: boolean;
		audio: boolean;
	};
	chat_template: string;
	bos_token: string;
	eos_token: string;
	build_info: string;
}

// function tool definition
export type ApiFunctionTool = {
	type: 'function';
	function: {
		name: string;
		description?: string;
		parameters: any; // If you have a JSONSchema type, use it here
	};
};

// NEW: Tool choice (auto/none or force a specific function)
export type ApiToolChoice =
	| 'none'
	| 'auto'
	| { type: 'function'; function: { name: string } };

// Completed tool call (non-stream responses or end of stream)
export type ApiToolCall = {
	id?: string;
	type: 'function';
	function: {
		name: string;
		arguments: string; // JSON-encoded args
	};
};

// Streaming delta for a tool call (arrives in pieces)
export type ApiToolCallDelta = {
	index: number;
	id?: string;
	type?: 'function';
	function?: {
		name?: string;
		arguments?: string; // append as it streams
	};
};

// Finish reason union (covers tool_calls)
export type ApiFinishReason = 'stop' | 'length' | 'tool_calls' | 'content_filter' | string;

// "tool" role message to return tool results back to the model
export interface ApiToolMessageData {
	role: 'tool';
	content: string;          // tool result payload (often JSON string)
	tool_call_id?: string;    // echo back the call id if provided by the model
	name?: string;            // optional: function name (some impls accept this)
}

// Request message union — keeps original message shape AND allows tool messages
export type ApiRequestMessage =
	| {
			role: Exclude<ChatRole, 'tool'>; // user/assistant/system (whatever ChatRole already allows)
			content: string | ApiChatMessageContentPart[];
	  }
	| ApiToolMessageData;

export interface ApiChatCompletionRequest {
	messages: ApiRequestMessage[];
	stream?: boolean;
	// Reasoning parameters
	reasoning_format?: string;
	// Generation parameters
	temperature?: number;
	max_tokens?: number;
	// Sampling parameters
	dynatemp_range?: number;
	dynatemp_exponent?: number;
	top_k?: number;
	top_p?: number;
	min_p?: number;
	xtc_probability?: number;
	xtc_threshold?: number;
	typical_p?: number;
	// Penalty parameters
	repeat_last_n?: number;
	repeat_penalty?: number;
	presence_penalty?: number;
	frequency_penalty?: number;
	dry_multiplier?: number;
	dry_base?: number;
	dry_allowed_length?: number;
	dry_penalty_last_n?: number;
	// Sampler configuration
	samplers?: string[];
	// tool calling
	tools?: ApiFunctionTool[];
	tool_choice?: ApiToolChoice;
	// Custom parameters (JSON object/string)
	custom?: any;
}

export interface ApiChatCompletionStreamChunk {
	choices: Array<{
		index?: number;
		delta: {
			role?: 'assistant';
			content?: string | null;
			tool_calls?: ApiToolCallDelta[];
			reasoning_content?: string;
		};
		finish_reason?: ApiFinishReason | null;
	}>;
	timings?: {
		prompt_n?: number;
		prompt_ms?: number;
		predicted_n?: number;
		predicted_ms?: number;
	};
}

export interface ApiChatCompletionResponse {
	choices: Array<{
		index?: number;
		message: {
			role: 'assistant';
			content?: string | null;
			tool_calls?: ApiToolCall[];
			reasoning_content?: string;
		};
		finish_reason?: ApiFinishReason | null;
	}>;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
}

export interface ApiSlotData {
	id: number;
	id_task: number;
	n_ctx: number;
	speculative: boolean;
	is_processing: boolean;
	params: {
		n_predict: number;
		seed: number;
		temperature: number;
		dynatemp_range: number;
		dynatemp_exponent: number;
		top_k: number;
		top_p: number;
		min_p: number;
		top_n_sigma: number;
		xtc_probability: number;
		xtc_threshold: number;
		typical_p: number;
		repeat_last_n: number;
		repeat_penalty: number;
		presence_penalty: number;
		frequency_penalty: number;
		dry_multiplier: number;
		dry_base: number;
		dry_allowed_length: number;
		dry_penalty_last_n: number;
		dry_sequence_breakers: string[];
		mirostat: number;
		mirostat_tau: number;
		mirostat_eta: number;
		stop: string[];
		max_tokens: number;
		n_keep: number;
		n_discard: number;
		ignore_eos: boolean;
		stream: boolean;
		logit_bias: any[];
		n_probs: number;
		min_keep: number;
		grammar: string;
		grammar_lazy: boolean;
		grammar_triggers: any[];
		preserved_tokens: any[];
		chat_format: string;
		reasoning_format: string;
		reasoning_in_content: boolean;
		thinking_forced_open: boolean;
		samplers: string[];
		'speculative.n_max': number;
		'speculative.n_min': number;
		'speculative.p_min': number;
		timings_per_token: boolean;
		post_sampling_probs: boolean;
		lora: any[];
	};
	prompt: string;
	next_token: {
		has_next_token: boolean;
		has_new_line: boolean;
		n_remain: number;
		n_decoded: number;
		stopping_word: string;
	};
}

export interface ApiProcessingState {
	status: 'initializing' | 'generating' | 'preparing' | 'idle';
	tokensDecoded: number;
	tokensRemaining: number;
	contextUsed: number;
	contextTotal: number;
	temperature: number;
	topP: number;
	speculative: boolean;
	hasNextToken: boolean;
}
