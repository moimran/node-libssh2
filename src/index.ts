/**
 * node-libssh2 - High-performance SSH client for Node.js
 *
 * This package provides native libssh2 bindings for Node.js applications,
 * offering high-performance SSH connections, command execution, and interactive shells.
 *
 * @author AtlasTerminal Team
 * @license MIT
 */

// Core FFI bindings
export { loadlibssh2, cstr, readCString, isNull } from './core/ffi.js';

// Core low-level classes (ssh2-python compatible)
export { Session } from './core/session.js';
export { Channel } from './core/channel.js';
export { SFTP } from './core/sftp.js';
export { SFTPHandle } from './core/sftp-handle.js';
export { Agent } from './core/agent.js';
export { KnownHost } from './core/knownhost.js';
export { Listener } from './core/listener.js';

// High-level async wrapper functions (recommended for most users)
export { sshExec, sshExecMultiple, sshTest, sshInfo } from './wrapper/ssh-async.js';

// Type definitions from wrapper
export type {
  SSHConfig,
  CommandResult
} from './wrapper/ssh-async.js';

// Type definitions from types
export type {
  SSHConnectionOptions
} from './types/index.js';

// Version info
export const VERSION = '1.0.0';
export const LIBSSH2_VERSION = '1.11.2_DEV';

/**
 * Quick start examples:
 *
 * High-level async functions (recommended):
 * ```javascript
 * const { sshExec, sshTest } = require('node-libssh2');
 *
 * // Test connection
 * const connected = await sshTest({
 *   host: '192.168.1.100',
 *   username: 'root',
 *   password: 'password'
 * });
 *
 * // Execute command
 * const result = await sshExec({
 *   host: '192.168.1.100',
 *   username: 'root',
 *   password: 'password'
 * }, 'pwd');
 *
 * console.log(result.stdout);
 * ```
 *
 * Low-level core classes (for advanced users):
 * ```javascript
 * const { Session, Channel } = require('node-libssh2');
 *
 * const session = new Session();
 * // ... low-level session operations
 * ```
 */
