# WebUI Migration Project Plan: React to SvelteKit

## Overview

This document provides a detailed comparison between the old React-based webui and the new SvelteKit-based webui, identifying which features and components have been migrated and which are still missing. This will serve as a roadmap for completing the migration.

## Architecture Comparison

### Old React WebUI
- **Framework**: React 18 with TypeScript
- **State Management**: React Context API
- **Routing**: React Router v7
- **Styling**: Tailwind CSS with DaisyUI
- **Database**: Dexie.js (IndexedDB wrapper)
- **Build Tool**: Vite

### New SvelteKit WebUI
- **Framework**: SvelteKit 2.x with Svelte 5 runes
- **State Management**: Svelte 5 runes (`$state`, `$derived`, `$effect`) and stores
- **Routing**: SvelteKit file-based routing
- **Styling**: Tailwind CSS with custom components
- **Database**: Dexie.js (IndexedDB wrapper)
- **Build Tool**: Vite with custom plugins

## Component Migration Status

### Core Components

| Component | Old React Status | New SvelteKit Status | Migration Status | Notes |
|-----------|------------------|----------------------|------------------|-------|
| **App Root** | Complete | Complete | ✅ Done | Main application wrapper |
| **Chat Screen** | Complete | Complete | ✅ Done | Main chat interface |
| **Chat Messages** | Complete | Complete | ✅ Done | Message display and rendering |
| **Chat Form** | Complete | Complete | ✅ Done | Message input and file handling |
| **Chat Sidebar** | Complete | Complete | ✅ Done | Conversation navigation |
| **Header** | Complete | Partial | ⚠️ WIP | Basic header implemented |
| **Settings Dialog** | Complete | Complete | ✅ Done | Configuration management |

### Feature-by-Feature Comparison

## 1. Chat Functionality

### Old React Implementation
- Real-time streaming responses
- Conversation history management with branching support
- Message editing and regeneration
- System message injection
- Token timing display
- Conversation grouping by date

### New SvelteKit Implementation
- ✅ Real-time streaming responses
- ✅ Conversation history management
- ✅ Message editing and regeneration
- ✅ System message injection
- ❌ Token timing display (partial)
- ❌ Conversation grouping by date

### Missing Features
1. **Token Timing Display**: The old version showed token generation timing information, which is not yet implemented in the new version.
2. **Conversation Grouping**: The old version grouped conversations by date (Today, Previous 7 Days, etc.), which is not yet implemented.

## 2. Multimodal Support

### Old React Implementation
- Image attachments (vision models)
- Text file uploads
- PDF processing (as text or images)
- Audio file support (audio models)
- Context management for attached files

### New SvelteKit Implementation
- ✅ Image attachments (vision models)
- ✅ Text file uploads
- ✅ PDF processing (as text or images)
- ✅ Audio file support (audio models)
- ✅ Context management for attached files

### Status
✅ **Complete** - All multimodal features have been migrated

## 3. Configuration & Settings

### Old React Implementation
- Extensive model parameter tuning through settings dialog
- Custom system prompts
- Theme customization with multiple DaisyUI themes
- Advanced sampling parameters (temperature, top-k, top-p, etc.)
- Custom JSON configuration for experimental features
- Reset to default functionality

### New SvelteKit Implementation
- ✅ Extensive model parameter tuning
- ✅ Custom system prompts
- ✅ Theme customization
- ✅ Advanced sampling parameters
- ✅ Custom JSON configuration
- ✅ Reset to default functionality

### Status
✅ **Complete** - All configuration features have been migrated

## 4. Conversation Management

### Old React Implementation
- Tree-based conversation structure
- Ability to edit previous messages and create new branches
- Navigation between different conversation paths
- Conversation renaming
- Conversation deletion
- Conversation downloading
- Date-based grouping

### New SvelteKit Implementation
- ✅ Linear conversation structure
- ✅ Ability to edit previous messages
- ✅ Conversation renaming
- ✅ Conversation deletion
- ❌ Conversation branching
- ❌ Conversation downloading
- ❌ Date-based grouping

### Missing Features
1. **Conversation Branching**: The old version supported tree-based conversation structures where users could edit a message and create new branches. The new version only supports linear conversations.
2. **Conversation Downloading**: The ability to export conversations as JSON files is missing.
3. **Date-based Grouping**: Conversations are not grouped by date in the sidebar.

## 5. UI/UX Features

### Old React Implementation
- Responsive design for mobile and desktop
- DaisyUI components with multiple themes
- Theme switcher with dropdown menu
- Drag and drop file uploads
- Keyboard shortcuts (Shift+Enter for new line)
- Toast notifications
- Modal dialogs for confirmation
- Skip to main content accessibility

### New SvelteKit Implementation
- ✅ Responsive design for mobile and desktop
- ✅ Custom UI components with theme support
- ❌ Theme switcher with dropdown menu
- ✅ Drag and drop file uploads
- ✅ Keyboard shortcuts (Shift+Enter for new line)
- ✅ Toast notifications
- ✅ Dialogs for settings
- ⚠️ Partial accessibility support

### Missing Features
1. **Theme Switcher**: The old version had a dropdown menu for switching between multiple DaisyUI themes, which is completely missing from the new version.
2. **Modal Dialogs**: The old version had modal dialogs for confirmations, which are not yet implemented in the new version.
3. **Accessibility Features**: While basic accessibility is implemented, some features like skip links are missing.

## 6. Experimental Features

### Old React Implementation
- Python interpreter integration (using Pyodide)
- Debug features for importing demo conversations

### New SvelteKit Implementation
- ✅ Python interpreter integration (using Pyodide)
- ❌ Debug features for importing demo conversations

### Missing Features
1. **Demo Conversation Import**: The debug feature for importing demo conversations is not yet implemented.

## 7. Data Persistence

### Old React Implementation
- IndexedDB storage via Dexie.js
- LocalStorage for temporary UI state
- Migration from localStorage to IndexedDB
- Conversation metadata (name, last modified, current node)

### New SvelteKit Implementation
- ✅ IndexedDB storage via Dexie.js
- ✅ LocalStorage for temporary UI state
- ✅ Conversation metadata storage

### Status
✅ **Complete** - Data persistence features have been migrated

## 8. API Communication

### Old React Implementation
- REST API communication with llama.cpp server
- Streaming responses via Server-Sent Events
- Error handling and abort functionality
- Custom parameter configuration

### New SvelteKit Implementation
- ✅ REST API communication with llama.cpp server
- ✅ Streaming responses via Server-Sent Events
- ✅ Error handling and abort functionality
- ✅ Custom parameter configuration

### Status
✅ **Complete** - API communication features have been migrated

## Detailed Migration Roadmap

### Phase 1: Core Functionality (Completed)
- [x] Chat interface with message display
- [x] Message input and sending
- [x] Streaming responses
- [x] Basic conversation management
- [x] File attachment support
- [x] Settings management

### Phase 2: Enhanced Features (In Progress)
- [x] Theme customization
- [x] Multimodal support (images, files, audio)
- [ ] Conversation branching
- [ ] Token timing display
- [ ] Date-based conversation grouping
- [ ] Conversation downloading

### Phase 3: Advanced Features (Pending)
- [ ] Modal dialogs for confirmations
- [ ] Demo conversation import
- [ ] Enhanced accessibility features
- [ ] Advanced UI components

### Priority Recommendations

### High Priority (Next to implement)
1. **Conversation Branching** - This is a key differentiator of the old UI
2. **Token Timing Display** - Provides valuable performance feedback
3. **Date-based Conversation Grouping** - Improves UX for users with many conversations

### Medium Priority
1. **Theme Switcher** - Important for user customization and preferences
2. **Conversation Downloading** - Useful for data portability
3. **Modal Dialogs** - Improves user experience for destructive actions
4. **Enhanced Accessibility** - Skip links and improved ARIA attributes

### Low Priority
1. **Demo Conversation Import** - Debug feature, not critical for end users

## Technical Debt and Improvements

### Areas for Improvement in New Implementation
1. **Code Organization**: The SvelteKit version has better component organization
2. **State Management**: Svelte 5 runes provide better performance than React Context
3. **Reactivity**: Fine-grained reactivity in Svelte is more efficient than React's reconciliation
4. **Bundle Size**: Svelte typically produces smaller bundles than React

### Areas Where Old Implementation Was Better
1. **Feature Completeness**: The React version had more features implemented
2. **User Experience**: Some UX details like conversation grouping were better in the React version

## Conclusion

The migration from React to SvelteKit has made good progress with core chat functionality fully implemented. However, several key features from the old React version are still missing, particularly conversation branching and some UX enhancements. The roadmap above provides a clear path to feature parity while leveraging the improved architecture of the SvelteKit implementation.

The new SvelteKit version benefits from:
- Better performance with Svelte 5 runes
- More organized component structure
- Improved state management
- Smaller bundle sizes

However, it still needs to catch up on feature completeness compared to the old React version, particularly:
- Conversation branching (tree-based conversation structure)
- Theme switcher with multiple theme options
- Token timing display
- Date-based conversation grouping in the sidebar
- Conversation downloading
- Modal dialogs for confirmations