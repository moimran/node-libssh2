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

// Main SSH client classes
export { SSHClient } from './client/ssh-client.js';
export { SSHShell } from './client/ssh-shell.js';
export { SSHUtils } from './client/ssh-utils.js';

// Node-SSH compatible API (recommended)
export { NodeSSH } from './client/node-ssh.js';

// Type definitions
export type {
  SSHConnectionOptions,
  CommandResult,
  ShellOptions,
  SystemInfo,
  // Node-SSH compatible types
  Config,
  SSHExecCommandOptions,
  SSHExecCommandResponse,
  SSHExecOptions,
  SSHPutFilesOptions,
  SSHGetPutDirectoryOptions,
  FileTransfer,
  SSHError
} from './types/index.js';

// Version info
export const VERSION = '1.0.0';
export const LIBSSH2_VERSION = '1.11.2_DEV';

/**
 * Quick start examples:
 *
 * Node-SSH compatible API (recommended):
 * ```javascript
 * const { NodeSSH } = require('node-libssh2');
 *
 * const ssh = new NodeSSH();
 * await ssh.connect({
 *   host: '192.168.1.100',
 *   username: 'root',
 *   password: 'password'
 * });
 *
 * const result = await ssh.execCommand('pwd');
 * console.log(result.stdout);
 * ssh.dispose();
 * ```
 *
 * Original API (still supported):
 * ```javascript
 * const { SSHUtils } = require('node-libssh2');
 *
 * const result = await SSHUtils.executeCommand({
 *   hostname: '192.168.1.100',
 *   username: 'root',
 *   password: 'password'
 * }, 'pwd');
 *
 * console.log(result.output);
 * ```
 */
