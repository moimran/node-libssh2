/**
 * Interactive SSH Shell
 *
 * Provides terminal-like interactive shell sessions over SSH.
 */
import { ShellOptions, TerminalDimensions } from '../types/index.js';
import { SSHClient } from './ssh-client.js';
import { EventEmitter } from 'events';
/**
 * Interactive SSH shell for terminal-like sessions
 *
 * Features:
 * - PTY (pseudo-terminal) support
 * - Real-time input/output streaming
 * - Terminal resizing
 * - Event-based data handling
 * - Proper shell cleanup
 *
 * Events:
 * - 'data': Emitted when data is received from the shell
 * - 'error': Emitted when an error occurs
 * - 'close': Emitted when the shell is closed
 * - 'ready': Emitted when the shell is ready for input
 */
export declare class SSHShell extends EventEmitter {
    private client;
    private channel;
    private active;
    private lib;
    private currentWidth;
    private currentHeight;
    private streamingActive;
    private streamingInterval;
    private correlationId;
    private sessionStartTime;
    private lastCommandTime;
    constructor(client: SSHClient);
    /**
     * Start an interactive shell session
     *
     * @param options Shell configuration options
     */
    start(options?: ShellOptions): Promise<void>;
    /**
     * Start data streaming with on-demand reading (no continuous polling)
     */
    private startStreaming;
    /**
     * Perform a single read operation to check for available data
     * This is called on-demand rather than in a continuous loop
     */
    private performSingleRead;
    /**
     * Trigger a read operation (called after write operations to check for responses)
     */
    triggerRead(): void;
    /**
     * Stop data streaming
     */
    private stopStreaming;
    /**
     * Read available data with robust error handling
     * @returns true if data was read, false otherwise
     */
    readAvailableData(): boolean;
    /**
     * Send input to the shell (synchronous, non-blocking)
     *
     * @param data Data to send to shell
     * @returns Number of bytes written
     */
    write(data: string): number;
    /**
     * Read output from the shell (optimized for speed)
     *
     * @param timeoutMs Maximum time to wait for data (default: 1000ms)
     * @returns Output from shell
     */
    read(timeoutMs?: number): Promise<string>;
    /**
     * Read output from shell with smart detection (optimized)
     *
     * This method reads until no more data is available, making it suitable
     * for reading command output that may arrive in multiple chunks.
     *
     * @param maxWaitMs Maximum time to wait for additional data
     * @returns Complete output from shell
     */
    readUntilComplete(maxWaitMs?: number): Promise<string>;
    /**
     * Read output from a long-running command with real-time streaming
     *
     * This method is designed for commands that may take minutes to complete
     * and provides real-time output streaming with progress callbacks.
     *
     * @param maxWaitMs Maximum time to wait for command completion (default: 10 minutes)
     * @param onData Callback for real-time data streaming
     * @param promptPattern Pattern to detect command completion (default: shell prompt)
     * @returns Complete output from the long-running command
     */
    readLongRunningCommand(maxWaitMs?: number, // 10 minutes default
    onData?: (chunk: string) => void, promptPattern?: RegExp): Promise<string>;
    /**
     * Execute a command and read its output quickly (optimized for speed)
     *
     * @param command Command to execute
     * @param timeoutMs Maximum time to wait for output
     * @returns Command output
     */
    executeCommand(command: string, timeoutMs?: number): Promise<string>;
    /**
     * Read until we see a shell prompt (much faster than timeout-based reading)
     */
    readUntilPrompt(timeoutMs?: number): Promise<string>;
    /**
     * Check if the output contains a shell prompt
     */
    private hasPrompt;
    /**
     * Resize the terminal
     *
     * @param width New terminal width (columns)
     * @param height New terminal height (rows)
     */
    resize(width: number, height: number): Promise<void>;
    /**
     * Resize the terminal using cols/rows (alias for resize)
     *
     * @param cols Number of columns
     * @param rows Number of rows
     */
    resizeTerminal(cols: number, rows: number): Promise<void>;
    /**
     * Get current terminal dimensions
     *
     * @returns Object with current width and height
     */
    getDimensions(): TerminalDimensions;
    /**
     * Send a signal to the shell process
     *
     * @param signal Signal name (e.g., 'TERM', 'KILL', 'INT')
     */
    sendSignal(signal: string): Promise<void>;
    /**
     * Check if shell is active
     */
    isActive(): boolean;
    /**
     * Get shell status information
     */
    getStatus(): {
        active: boolean;
        hasChannel: boolean;
        clientConnected: boolean;
    };
    /**
     * Close the shell session (optimized)
     */
    close(): void;
}
//# sourceMappingURL=ssh-shell.d.ts.map