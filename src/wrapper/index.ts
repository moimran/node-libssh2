/**
 * SSH Wrapper - Built on Core libssh2 Classes
 *
 * This module provides both simple async functions and advanced classes
 * for SSH operations built on top of the low-level core classes.
 */

// Export SSH async functions
export {
  sshExec,
  sshExecMultiple,
  sshTest,
  sshInfo,
  SSHConfig,
  CommandResult
} from './ssh-async.js';

// Export SSH terminal classes
export { SSHClient } from './ssh-client.js';
export { SSHTerminal, SSHShell } from './ssh-terminal.js';

// Export additional types
export type {
  SSHClientOptions,
  SSHTerminalOptions,
  TerminalDimensions,
  TerminalData
} from './types.js';
