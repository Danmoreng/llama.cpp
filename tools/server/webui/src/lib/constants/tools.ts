export const tools = [
	{
		type: 'function',
		function: {
			name: "replaceCode",
			description: "Replaces the entire HTML code.",
			parameters: {
				type: "object",
				properties: {
					newCode: {
						type: "string",
						description: "The new content to replace the complete HTML code."
					}
				},
				required: ["newCode"]
			}
		}
	},
	{
		type: 'function',
		function: {
			name: "updateCodePart",
			description: "Updates a specific part of the HTML code by finding and replacing a target string.",
			parameters: {
				type: "object",
				properties: {
					target: {
						type: "string",
						description: "The target string to find and replace within the code."
					},
					newContent: {
						type: "string",
						description: "The new content that will replace the target string."
					}
				},
				required: ["target", "newContent"]
			}
		}
	}
];
