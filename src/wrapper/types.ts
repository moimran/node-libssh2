/**
 * Type definitions for high-level SSH wrapper
 */

/**
 * SSH connection configuration
 */
export interface SSHConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  privateKeyPath?: string;
  passphrase?: string;
  timeout?: number;
  keepaliveInterval?: number;
  strictHostKeyChecking?: boolean;
  knownHostsFile?: string;
  agentPath?: string;
}

/**
 * Authentication methods
 */
export interface AuthConfig {
  username: string;
  password?: string;
  privateKey?: string;
  privateKeyPath?: string;
  passphrase?: string;
  useAgent?: boolean;
}

/**
 * Command execution result
 */
export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  signal?: string;
  success: boolean;
}

/**
 * SFTP file information
 */
export interface FileInfo {
  name: string;
  size: number;
  mode: number;
  uid: number;
  gid: number;
  atime: Date;
  mtime: Date;
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
}

/**
 * SFTP transfer options
 */
export interface TransferOptions {
  preserveTimestamps?: boolean;
  mode?: number;
  createDirectories?: boolean;
  overwrite?: boolean;
  progress?: (transferred: number, total: number) => void;
}

/**
 * Port forwarding configuration
 */
export interface ForwardConfig {
  localHost?: string;
  localPort: number;
  remoteHost: string;
  remotePort: number;
}

/**
 * SSH connection events
 */
export interface SSHEvents {
  connect: () => void;
  disconnect: () => void;
  error: (error: Error) => void;
  data: (data: Buffer) => void;
  timeout: () => void;
}

/**
 * Shell options
 */
export interface ShellOptions {
  term?: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
}

/**
 * Connection state
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  ERROR = 'error'
}

/**
 * SSH error types
 */
export class SSHError extends Error {
  constructor(message: string, public code?: number) {
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

export class SSHTimeoutError extends SSHError {
  constructor(message: string, code?: number) {
    super(message, code);
    this.name = 'SSHTimeoutError';
  }
}

export class SFTPError extends SSHError {
  constructor(message: string, code?: number) {
    super(message, code);
    this.name = 'SFTPError';
  }
}
