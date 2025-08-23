# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-23

### Added
- Initial release of node-libssh2
- High-performance SSH client with native libssh2 bindings
- SSHClient class for persistent connections
- SSHShell class for interactive terminal sessions
- SSHUtils class for quick operations
- Full TypeScript support with type definitions
- Optimized command execution (5-50ms response times)
- Cross-platform support (Windows, Linux, macOS)
- Comprehensive error handling
- Complete API documentation
- Working examples and test suite

### Features
- Password authentication support
- Command execution with exit codes
- Interactive shell sessions with PTY support
- Smart output reading with EOF detection
- Connection pooling and reuse
- Non-blocking operations for maximum performance
- Automatic resource cleanup and memory management

### Performance
- Optimized reading algorithms
- No artificial delays
- Smart EOF detection
- Consecutive empty read detection
- Ultra-fast non-blocking mode option

### Platform Support
- Windows x64 (fully tested with included libssh2.dll)
- Linux x64/arm64 (should work with system libssh2)
- macOS x64/arm64 (should work with system libssh2)

### Dependencies
- koffi ^2.8.8 for FFI bindings
- Node.js 16.0.0+ required
