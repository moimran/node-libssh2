/**
 * Type definitions for node-libssh2
 */

/**
 * SSH connection configuration options
 */
export interface SSHConnectionOptions {
  /** SSH server hostname or IP address */
  hostname: string;
  
  /** SSH server port (default: 22) */
  port?: number;
  
  /** SSH username */
  username: string;
  
  /** SSH password */
  password: string;
  
  /** Connection timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Result of command execution
 */
export interface CommandResult {
  /** Command output (stdout) */
  output: string;
  
  /** Command exit code (0 = success) */
  exitCode: number;
  
  /** Whether command was successful (exitCode === 0) */
  success: boolean;
}

/**
 * Options for shell configuration
 */
export interface ShellOptions {
  /** Terminal type (default: 'xterm') */
  terminalType?: string;
  
  /** Terminal width in characters (default: 80) */
  width?: number;
  
  /** Terminal height in characters (default: 24) */
  height?: number;
}

/**
 * System information from remote host
 */
export interface SystemInfo {
  /** Remote hostname */
  hostname: string;
  
  /** Operating system information */
  os: string;
  
  /** Kernel version */
  kernel: string;
  
  /** System uptime */
  uptime: string;
  
  /** Current user */
  currentUser: string;
  
  /** Current working directory */
  currentDirectory: string;
}

/**
 * SSH connection state
 */
export interface SSHState {
  /** Whether currently connected */
  connected: boolean;
  
  /** Whether connection attempt is in progress */
  connecting: boolean;
  
  /** Last error message, if any */
  error: string | null;
  
  /** Result of last command execution */
  lastCommand: CommandResult | null;
}

/**
 * Library information
 */
export interface LibraryInfo {
  /** Operating system platform */
  platform: string;
  
  /** CPU architecture */
  arch: string;
  
  /** Path to libssh2 library */
  libraryPath: string;
  
  /** libssh2 version */
  version: string;
}

/**
 * Error types that can be thrown by the library
 */
export class SSHError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly errno?: number
  ) {
    super(message);
    this.name = 'SSHError';
  }
}

export class SSHConnectionError extends SSHError {
  constructor(message: string, code?: number) {
    super(message, code);
    this.name = 'SSHConnectionError';
  }
}

export class SSHAuthenticationError extends SSHError {
  constructor(message: string, code?: number) {
    super(message, code);
    this.name = 'SSHAuthenticationError';
  }
}

export class SSHCommandError extends SSHError {
  constructor(
    message: string,
    public readonly exitCode?: number,
    public readonly output?: string
  ) {
    super(message);
    this.name = 'SSHCommandError';
  }
}

/**
 * Event types for shell sessions
 */
export interface ShellEvents {
  /** Data received from shell */
  data: (data: string) => void;
  
  /** Shell session closed */
  close: (exitCode?: number) => void;
  
  /** Error occurred */
  error: (error: Error) => void;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Connection establishment time (ms) */
  connectionTime: number;
  
  /** Authentication time (ms) */
  authenticationTime: number;
  
  /** Command execution time (ms) */
  commandTime: number;
  
  /** Data transfer rate (bytes/sec) */
  transferRate: number;
}

/**
 * Advanced connection options
 */
export interface AdvancedSSHOptions extends SSHConnectionOptions {
  /** Keep-alive interval in seconds */
  keepAliveInterval?: number;
  
  /** Maximum number of keep-alive packets */
  keepAliveCountMax?: number;
  
  /** Compression level (0-9, 0 = no compression) */
  compression?: number;
  
  /** Preferred encryption algorithms */
  ciphers?: string[];
  
  /** Preferred MAC algorithms */
  macs?: string[];
  
  /** Preferred key exchange algorithms */
  kex?: string[];
}
