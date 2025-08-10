# Architecture Documentation (Old React WebUI)

## Overview

This document describes the architecture of the old React-based web interface for the llama.cpp project. This interface provided a chat interface for interacting with large language models through a client-side single-page application that communicated with the llama.cpp server through REST APIs.

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS with DaisyUI components
- **State Management**: React Context API
- **Database**: Dexie.js (IndexedDB wrapper) for client-side data persistence
- **Build Tool**: Vite with custom plugins
- **UI Components**: React components with DaisyUI and Heroicons
- **Markdown Processing**: react-markdown with rehype and remark plugins

## Project Structure

```
src/
├── components/          # React components
│   ├── CanvasPyInterpreter.tsx
│   ├── ChatInputExtraContextItem.tsx
│   ├── ChatMessage.tsx
│   ├── ChatScreen.tsx
│   ├── Header.tsx
│   ├── MarkdownDisplay.tsx
│   ├── ModalProvider.tsx
│   ├── SettingDialog.tsx
│   ├── Sidebar.tsx
│   ├── useChatExtraContext.tsx
│   ├── useChatScroll.tsx
│   └── useChatTextarea.ts
├── utils/               # Utility functions and services
│   ├── app.context.tsx
│   ├── common.tsx
│   ├── llama-vscode.ts
│   ├── misc.ts
│   ├── storage.ts
│   └── types.ts
├── App.tsx              # Main application component
├── Config.ts            # Configuration constants
├── index.scss           # Global styles
├── main.tsx             # Application entry point
└── vite-env.d.ts        # TypeScript declarations
```

## Core Architecture Components

### 1. State Management

The application uses React Context API for state management:

- **AppContext** (`src/utils/app.context.tsx`): Centralized state management for the entire application
  - Manages conversations and messages
  - Handles API communication with the llama.cpp server
  - Controls canvas data (Python interpreter)
  - Manages application configuration
  - Tracks server properties

### 2. Data Persistence

- **IndexedDB** via Dexie.js for storing conversations, messages, and settings
- **LocalStorage** for temporary UI state and preferences
- **Database Schema**:
  - `conversations`: Stores conversation metadata
  - `messages`: Stores individual messages with parent-child relationships for branching

### 3. API Communication

- **Server Communication** handled in `app.context.tsx`
- **REST API Endpoints**:
  - `/v1/chat/completions`: For sending chat messages and receiving responses
  - `/props`: For retrieving server properties and capabilities
- **Streaming Responses**: Server-sent events (SSE) for real-time message streaming

### 4. UI Components

- **Component-based Architecture** with reusable React components
- **DaisyUI** for pre-styled components
- **Heroicons** for SVG icons
- **Responsive Design** for various screen sizes
- **Markdown Support** for rich text rendering with syntax highlighting

### 5. Routing

- **React Router** for client-side routing:
  - `/` - New conversation
  - `/chat/:convId` - Individual conversation view
- **Hash-based Routing** for compatibility
- **Dynamic Route Parameters** for conversation IDs

## Data Flow

1. **User Interaction**: User types a message and sends it through the chat form
2. **State Update**: Message is added to the app context and persisted to IndexedDB
3. **API Request**: App context formats the message and sends it to the llama.cpp server
4. **Streaming Response**: Server streams the response back, which is displayed in real-time
5. **State Persistence**: Completed response is saved to IndexedDB
6. **UI Updates**: Interface updates to show the new message and allow for further interaction

## Key Features

### Chat Functionality
- Real-time streaming responses
- Conversation history management with branching support
- Message editing and regeneration
- System message injection
- Token timing display

### Multimodal Support
- Image attachments (vision models)
- Text file uploads
- PDF processing
- Audio file support (audio models)
- Context management for attached files

### Configuration
- Extensive model parameter tuning through settings dialog
- Custom system prompts
- Theme customization with multiple DaisyUI themes
- Advanced sampling parameters (temperature, top-k, top-p, etc.)
- Custom JSON configuration for experimental features

### Conversation Branching
- Tree-based conversation structure
- Ability to edit previous messages and create new branches
- Navigation between different conversation paths

### Experimental Features
- Python interpreter integration (using Pyodide)
- Custom parameter configurations

## Build and Deployment

- **Vite Build System** for development and production builds
- **Static Site Generation** for deployment
- **Asset Optimization** with built-in Vite optimizations

## Comparison with New SvelteKit Version

### Key Differences
1. **Framework**: React vs SvelteKit 2.x with Svelte 5 runes
2. **State Management**: React Context vs Svelte 5 runes and stores
3. **Component Structure**: More granular component organization in SvelteKit
4. **Reactivity**: React's useState/useEffect vs Svelte's fine-grained reactivity
5. **File-based Routing**: Both use file-based routing but with different conventions

### Feature Parity
The old React version contained all core functionality that was later migrated to the SvelteKit version:
- Chat interface with streaming responses
- Conversation management with branching
- File attachment support
- Comprehensive settings system
- Theme customization
- IndexedDB persistence
- Python interpreter (experimental)