# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-14

### Added

- Initial release of @quill/agent package
- Agent factory with `createQuillAgent()` function
- OpenAI integration with automatic usage logging via `withUsageLogging()`
- Tool system with Zod schema validation
- Content tools: `expandOutlineTool`, `generatePostsTool`
- Engagement tools: `listTargetsTool`, `scoreFeedTool`
- Schedule tools: `schedulePostTool`
- Tool preset functions: `contentTools()`, `engagementTools()`, `scheduleTools()`, `allTools()`
- BYOK (Bring Your Own Key) support for platform-specific credentials
- Optional logger interface for debugging
- Security helper: `redactSecrets()` for sanitizing sensitive data
- Comprehensive TypeScript types and interfaces
- ESM and CJS build outputs with type declarations
- Unit tests with 90%+ coverage
- Complete documentation and usage examples

### Features

- Single-step agent planning (AI selects appropriate tool)
- Direct answer fallback when no tools available
- Non-blocking database logging (failures don't block responses)
- Injected Prisma client (no singleton dependencies)
- Platform-specific content generation guidelines
- Token usage tracking for cost monitoring
- Extensible tool architecture

### Documentation

- README with quick start and API reference
- Comprehensive examples file with 6 usage patterns
- Implementation summary document
- Inline JSDoc comments on all public APIs
- TypeScript types for IDE autocomplete

[0.1.0]: https://github.com/hadoan/QuillSocial/releases/tag/@quill/agent@0.1.0
