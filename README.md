# node-libssh2

High-performance SSH client for Node.js using libssh2 with native FFI bindings.

[![npm version](https://badge.fury.io/js/node-libssh2.svg)](https://badge.fury.io/js/node-libssh2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 **High Performance** - Native libssh2 bindings with FFI
- 🔐 **Secure** - Full SSH2 protocol support with authentication
- 🖥️ **Interactive Shells** - Real-time terminal sessions
- ⚡ **Fast Commands** - Optimized command execution (~5-50ms response times)
- 🎯 **Easy API** - Simple, intuitive interface
- 🔧 **TypeScript** - Full type definitions included
- 🌐 **Cross-platform** - Windows, Linux, macOS support

## Installation

```bash
npm install node-libssh2
```

## Quick Start

### Simple Command Execution

```javascript
const { SSHUtils } = require('node-libssh2');

// Execute a single command
const result = await SSHUtils.executeCommand({
  hostname: '192.168.1.100',
  username: 'root',
  password: 'password'
}, 'pwd');

console.log(result.output); // "/root"
console.log(result.success); // true
```

### Persistent Connection

```javascript
const { SSHClient } = require('node-libssh2');

const client = new SSHClient();

try {
  // Connect once
  await client.connect({
    hostname: '192.168.1.100',
    port: 22,
    username: 'root',
    password: 'password'
  });

  // Execute multiple commands efficiently
  const pwd = await client.executeCommand('pwd');
  const whoami = await client.executeCommand('whoami');
  const ls = await client.executeCommand('ls -la');

  console.log('Directory:', pwd.output);
  console.log('User:', whoami.output);
  console.log('Files:', ls.output);

} finally {
  client.disconnect();
}
```

### Interactive Shell

```javascript
const { SSHClient, SSHShell } = require('node-libssh2');

const client = new SSHClient();
await client.connect(options);

const shell = new SSHShell(client);
await shell.start();

// Send commands
await shell.write('pwd\n');
await shell.write('ls -la\n');

// Read output
const output = await shell.read(1000);
console.log(output);

shell.close();
client.disconnect();
```

## API Reference

### SSHClient

Main class for SSH connections.

#### Methods

- `connect(options)` - Connect to SSH server
- `executeCommand(command)` - Execute a command and return result
- `isConnected()` - Check connection status
- `disconnect()` - Close connection and cleanup

### SSHShell

Interactive shell for terminal sessions.

#### Methods

- `start(options)` - Start interactive shell
- `write(data)` - Send input to shell
- `read(timeout)` - Read output from shell
- `close()` - Close shell session

### SSHUtils

Utility functions for common operations.

#### Static Methods

- `executeCommand(options, command)` - Quick command execution
- `testConnection(options)` - Test SSH connectivity
- `getSystemInfo(options)` - Get remote system information

## Connection Options

```javascript
{
  hostname: 'string',      // SSH server hostname/IP
  port: 22,               // SSH port (optional, default: 22)
  username: 'string',     // SSH username
  password: 'string',     // SSH password
  timeout: 30000          // Connection timeout (optional, default: 30s)
}
```

## Performance

node-libssh2 is optimized for speed:

- **Command execution**: 5-50ms response times
- **Connection reuse**: Execute multiple commands on single connection
- **Smart reading**: No artificial delays, EOF detection
- **Non-blocking operations**: Optional ultra-fast mode

## Platform Support

- ✅ **Windows** (x64) - Fully tested
- ✅ **Linux** (x64, arm64) - Should work
- ✅ **macOS** (x64, arm64) - Should work

## Requirements

- Node.js 16.0.0 or higher
- Native libssh2 library (included for Windows)

## Error Handling

All methods throw descriptive errors:

```javascript
try {
  await client.connect(options);
} catch (error) {
  if (error.message.includes('Authentication failed')) {
    // Handle auth error
  } else if (error.message.includes('Connection timeout')) {
    // Handle timeout
  }
}
```

## Examples

See the `examples/` directory for complete working examples:

- `basic.js` - Simple command execution
- `interactive.js` - Interactive shell session
- `advanced.js` - Advanced usage patterns

## Development

This package uses native libssh2 bindings via FFI. The development environment includes:

- C reference implementations for testing
- Performance benchmarks
- Cross-platform build scripts

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests.

## Support

- 📖 [Documentation](https://github.com/atlasterminal/node-libssh2/wiki)
- 🐛 [Issues](https://github.com/atlasterminal/node-libssh2/issues)
- 💬 [Discussions](https://github.com/atlasterminal/node-libssh2/discussions)
