/**
 * Simple SSH Wrapper - Built on Core libssh2 Classes
 *
 * This module provides simple async functions for SSH operations
 * built on top of the low-level core classes.
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
