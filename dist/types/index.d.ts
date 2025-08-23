/**
 * Type definitions for node-libssh2
 *
 * Includes both original API types and node-ssh compatible types
 */
import stream from 'stream';
/**
 * SSH connection configuration options
 */
export interface SSHConnectionOptions {
    /** SSH server hostname or IP address */
    hostname?: string;
    /** SSH server host (alternative to hostname for node-ssh compatibility) */
    host?: string;
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
    success?: boolean;
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
 * Terminal dimensions
 */
export interface TerminalDimensions {
    /** Terminal width in characters */
    width: number;
    /** Terminal height in characters */
    height: number;
    /** Alias for width (columns) */
    cols: number;
    /** Alias for height (rows) */
    rows: number;
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
export declare class SSHError extends Error {
    code: string | number | null;
    errno?: number;
    constructor(message: string, code?: string | number | null, errno?: number);
}
export declare class SSHConnectionError extends SSHError {
    constructor(message: string, code?: number);
}
export declare class SSHAuthenticationError extends SSHError {
    constructor(message: string, code?: number);
}
export declare class SSHCommandError extends SSHError {
    readonly exitCode?: number | undefined;
    readonly output?: string | undefined;
    constructor(message: string, exitCode?: number | undefined, output?: string | undefined);
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
/**
 * Configuration for NodeSSH connection (node-ssh compatible)
 */
export interface Config extends SSHConnectionOptions {
    /** SSH server host */
    host?: string;
    /** Private key as string or Buffer */
    privateKey?: string | Buffer;
    /** Path to private key file */
    privateKeyPath?: string;
    /** Enable keyboard-interactive authentication */
    tryKeyboard?: boolean;
    /** Keyboard-interactive authentication handler */
    onKeyboardInteractive?: (name: string, instructions: string, lang: string, prompts: Array<{
        prompt: string;
        echo: boolean;
    }>, finish: (responses: string[]) => void) => void;
}
/**
 * Options for execCommand method
 */
export interface SSHExecCommandOptions {
    /** Working directory for command execution */
    cwd?: string;
    /** Input to send to command stdin */
    stdin?: string | stream.Readable;
    /** Text encoding for output */
    encoding?: BufferEncoding;
    /** Don't trim whitespace from output */
    noTrim?: boolean;
    /** Callback for stdout chunks */
    onStdout?: (chunk: Buffer) => void;
    /** Callback for stderr chunks */
    onStderr?: (chunk: Buffer) => void;
}
/**
 * Response from execCommand method
 */
export interface SSHExecCommandResponse {
    /** Standard output */
    stdout: string;
    /** Standard error */
    stderr: string;
    /** Exit code (null if not available) */
    code: number | null;
    /** Signal that terminated the process (null if not available) */
    signal: string | null;
}
/**
 * Options for exec method
 */
export interface SSHExecOptions extends SSHExecCommandOptions {
    /** Which stream to return ('stdout', 'stderr', or 'both') */
    stream?: 'stdout' | 'stderr' | 'both';
}
/**
 * Options for putFiles method
 */
export interface SSHPutFilesOptions {
    /** Number of concurrent transfers */
    concurrency?: number;
}
/**
 * Options for putDirectory and getDirectory methods
 */
export interface SSHGetPutDirectoryOptions extends SSHPutFilesOptions {
    /** Progress callback */
    tick?: (localFile: string, remoteFile: string, error: Error | null) => void;
    /** File validation callback */
    validate?: (path: string) => boolean;
    /** Enable recursive directory transfer */
    recursive?: boolean;
}
/**
 * File transfer specification
 */
export interface FileTransfer {
    /** Local file path */
    local: string;
    /** Remote file path */
    remote: string;
}
//# sourceMappingURL=index.d.ts.map