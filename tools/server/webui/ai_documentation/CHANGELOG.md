# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Created ARCHITECTURE.md with comprehensive documentation of the WebUI architecture
- Created QWEN.md with collaboration instructions for AI-assisted development
- Added message deletion functionality allowing users to delete individual messages
- Added keyboard shortcuts for common actions:
  - Ctrl/Cmd + K: Create new chat
  - Ctrl/Cmd + Shift + D: Delete current chat
- Added tool calling support with client-side tool execution:
  - Get current editor code
  - Set editor code
  - Find and replace in editor code
- Added integrated HTML code editor with live preview
- Added visual display of tool calls and results
- Added database storage for tool calls and tool results

### Changed
- Enhanced chat store to handle tool calling workflows
- Improved chat service to support tool calling API
- Updated database schema to include tool call fields
- Enhanced message editing to properly handle tool calls
- Improved context error handling to account for tool calls
- Enhanced streaming response handling to process tool calls
- Updated UI components to display tool calls and results
- Improved file upload error handling with better user feedback
- Improved code editor toggle button styling and tooltip to match attachment button
- Fixed code editor sizing to maintain 50:50 split with chat area
- Fixed code editor view mode buttons visibility by adding proper text colors
- Fixed code editor positioning to prevent overlap with top bar
- Fixed syntax error in ChatScreen component template

### Deprecated
- None

### Removed
- None

### Security
- None

## [0.0.1] - 2025-08-10

Initial version - project setup and first AI-assisted documentation.

[Unreleased]: https://github.com/Danmoreng/llama.cpp/compare/danmoreng/svelte-webui...HEAD
