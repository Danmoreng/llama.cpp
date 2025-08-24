# Architecture Documentation

## Overview

This is a SvelteKit-based web interface for the llama.cpp project that provides a chat interface for interacting with large language models. The application is a client-side single-page application that communicates with the llama.cpp server through REST APIs.

## Technology Stack

- **Framework**: SvelteKit 2.x with Svelte 5 runes for reactivity
- **Styling**: Tailwind CSS with custom configuration
- **State Management**: Svelte 5 runes (`$state`, `$derived`, `$effect`) for local component state and stores
- **Database**: Dexie.js (IndexedDB wrapper) for client-side data persistence
- **Build Tool**: Vite with custom plugins
- **UI Components**: Custom component library built with Tailwind CSS
- **Testing**: Vitest with Playwright for unit and end-to-end tests
- **Documentation**: Storybook for component documentation

## Project Structure

```
src/
├── lib/                 # Shared libraries and components
│   ├── components/      # Reusable UI components
│   ├── constants/       # Application constants
│   ├── hooks/           # Custom Svelte hooks
│   ├── services/        # Business logic and API services
│   ├── stores/          # Application state management
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── routes/              # SvelteKit routes/pages
│   ├── chat/[id]/       # Individual chat conversation page
│   └── /                # Home page
└── app.html             # Main HTML template
```

## Core Architecture Components

### 1. State Management

The application uses Svelte 5 runes for state management:

- **Chat Store** (`src/lib/stores/chat.svelte.ts`): Manages the active conversation, messages, and chat-related state
- **Server Store** (`src/lib/stores/server.svelte.ts`): Manages server properties and capabilities
- **Settings Store** (`src/lib/stores/settings.svelte.ts`): Manages user preferences and configuration
- **Database Service** (`src/lib/stores/database.ts`): Wrapper around Dexie.js for IndexedDB operations

### 2. Data Persistence

- **IndexedDB** via Dexie.js for storing conversations, messages, and settings
- **LocalStorage** for temporary UI state and preferences
- **Schema Versioning** to handle database migrations

### 3. API Communication

- **Chat Service** (`src/lib/services/chat.ts`): Handles communication with the llama.cpp server
- **REST API Endpoints**:
  - `/v1/chat/completions`: For sending chat messages and receiving responses
  - `/props`: For retrieving server properties and capabilities

### 4. UI Components

- **Component-based Architecture** with reusable components
- **Tailwind CSS** for styling with a custom design system
- **Responsive Design** for various screen sizes
- **Markdown Support** for rich text rendering
- **File Handling** for multimodal inputs (images, text files, PDFs, audio)

### 5. Routing

- **SvelteKit File-based Routing**:
  - `/` - Main chat interface
  - `/chat/[id]` - Individual conversation view
- **Dynamic Route Parameters** for conversation IDs
- **Client-side Navigation** with proper state management

## Data Flow

1. **User Interaction**: User types a message and sends it through the chat form
2. **State Update**: Message is added to the chat store and persisted to IndexedDB
3. **API Request**: Chat service formats the message and sends it to the llama.cpp server
4. **Streaming Response**: Server streams the response back, which is displayed in real-time
5. **State Persistence**: Completed response is saved to IndexedDB
6. **UI Updates**: Interface updates to show the new message and allow for further interaction

## Key Features

### Chat Functionality
- Real-time streaming responses
- Conversation history management
- Message editing and regeneration
- Context window management with token estimation
- System message injection

### Multimodal Support
- Image attachments (vision models)
- Text file uploads
- PDF processing (as text or images)
- Audio file support (audio models)

### Configuration
- Extensive model parameter tuning
- Custom system prompts
- Theme customization (light/dark mode)
- Advanced sampling parameters

### Performance
- Client-side data persistence
- Efficient state management with Svelte 5 runes
- Auto-scrolling chat interface
- Drag-and-drop file uploads

## Build and Deployment

- **Static Site Generation** using `@sveltejs/adapter-static`
- **Asset Optimization** with gzip compression
- **Bundle Size Monitoring** to ensure small bundle sizes
- **Cross-Origin Security** headers for secure communication

## Testing

- **Unit Tests** with Vitest
- **Component Tests** with Vitest and Svelte testing utilities
- **End-to-End Tests** with Playwright
- **Component Documentation** with Storybook

## Security Considerations

- **Cross-Origin Security** policies configured in Vite
- **Client-side Only** architecture (no server-side rendering)
- **Secure File Handling** with proper MIME type validation
- **API Communication** through configured proxy settings

This architecture provides a robust, performant, and feature-rich interface for interacting with llama.cpp models while maintaining a clean separation of concerns and following modern web development best practices.