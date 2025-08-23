/**
 * node-libssh2 - High-performance SSH client for Node.js
 *
 * This package provides native libssh2 bindings for Node.js applications,
 * offering high-performance SSH connections, command execution, and interactive shells.
 *
 * @author AtlasTerminal Team
 * @license MIT
 */
export { loadlibssh2, cstr, readCString, isNull } from './core/ffi.js';
export { Session } from './core/session.js';
export { Channel } from './core/channel.js';
export { SFTP } from './core/sftp.js';
export { SFTPHandle } from './core/sftp-handle.js';
export { Agent } from './core/agent.js';
export { KnownHost } from './core/knownhost.js';
export { Listener } from './core/listener.js';
export { sshExec, sshExecMultiple, sshTest, sshInfo } from './wrapper/ssh-async.js';
export { SSHClient, SSHTerminal, SSHShell } from './wrapper/index.js';
export type { SSHConfig, CommandResult, SSHClientOptions, SSHTerminalOptions, TerminalDimensions, TerminalData } from './wrapper/index.js';
export type { SSHConnectionOptions } from './types/index.js';
export declare const VERSION = "1.0.0";
export declare const LIBSSH2_VERSION = "1.11.2_DEV";
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
//# sourceMappingURL=index.d.ts.map