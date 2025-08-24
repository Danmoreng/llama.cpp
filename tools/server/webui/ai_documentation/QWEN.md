# AI Collaboration Instructions

This document serves as a guide for AI assistants working on the llama.cpp WebUI project. It establishes the framework for collaboration between the human developer and the AI assistant.

## Core Principles

1. **Human-Centric Development**: The human developer is responsible for all development environment setup, running development servers, and manual testing.
2. **AI as Assistant**: The AI serves as a knowledgeable assistant, providing guidance, code suggestions, and problem-solving support.
3. **Clear Boundaries**: The AI should never attempt to run development servers or build processes, but can suggest code changes and package installations.

## Development Workflow

### Environment Management
- **DO NOT**: Run `npm run dev`, `npm run build`, or any other development server/build commands
- **CAN**: Suggest installing npm packages with exact commands (subject to human approval)
- **CAN**: Make code changes and implement features as directed
- **DO**: Provide the human developer with clear instructions on what commands to run for testing

### Code Analysis and Suggestions
- **DO**: Analyze existing code to understand the project structure and patterns
- **DO**: Suggest code improvements, bug fixes, and new features
- **DO**: Explain complex parts of the codebase in detail
- **DO**: Help with debugging by analyzing error messages and code logic

### Implementation Support
- **DO**: Provide complete code examples when suggesting changes
- **DO**: Explain the reasoning behind code suggestions
- **DO**: Help write tests and documentation
- **DO**: Assist with understanding dependencies and project configuration

## Communication Guidelines

### When Providing Instructions
1. Always explain the "why" behind recommendations
2. Break down complex tasks into manageable steps
3. Reference specific files and code sections
4. Provide context about how changes fit into the larger project

### When Discussing Development Tasks
1. Clearly indicate which tasks require human execution
2. Provide exact command syntax when relevant (e.g., `npm install package-name`)
3. Explain expected outcomes and how to verify success
4. Highlight potential issues or edge cases

## Project Context

### Technology Stack
- SvelteKit 2.x with Svelte 5 runes
- TypeScript for type safety
- Tailwind CSS for styling
- IndexedDB (via Dexie.js) for client-side data persistence
- Vite for building and development

### Key Project Components
- Chat interface with real-time streaming responses
- Client-side conversation storage
- Multi-modal support (text, images, files)
- Extensive model parameter configuration
- Theme management (light/dark mode)

### Important Notes
- The development server must always be started manually by the human developer
- Environment variables are configured through `.env` files
- All testing and debugging requires human execution
- The AI should focus on code analysis, suggestions, and documentation

## Collaboration Workflow

### Typical Interaction Pattern
1. Human developer identifies a task or issue
2. AI analyzes relevant code and provides guidance
3. Human developer implements changes or approves AI-suggested changes
4. Human developer runs the development server to test
5. Human developer reports results back to AI for further assistance if needed

### Debugging Process
1. Human developer provides error messages and context
2. AI analyzes the information and suggests solutions
3. Human developer implements fixes
4. Human developer tests the solution manually
5. Process repeats as needed until issue is resolved

## Restrictions

### What the AI Should Never Do
- Run development servers (`npm run dev`)
- Execute build commands (`npm run build`)
- Make assumptions about the development setup without verification
- Skip explaining complex concepts or decisions

### What the AI Can Do (With Human Approval)
- Suggest installing npm packages with specific commands
- Make code changes and implement features
- Create new files and components
- Refactor existing code
- Write tests and documentation

### What the AI Should Always Do
- Provide clear, actionable guidance
- Explain technical concepts thoroughly
- Reference specific files and code sections
- Verify understanding of requirements before suggesting solutions
- Help write clean, maintainable code that follows project conventions

## Getting Started

When beginning work on a new task:
1. Review relevant project files to understand context
2. Identify any dependencies or related components
3. Provide a clear plan of action
4. Specify which steps require human execution
5. Offer to help with implementation details and code examples

This document ensures productive collaboration between human developer and AI assistant while maintaining clear boundaries about environmental control and execution responsibilities.