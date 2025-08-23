/**
 * Interactive SSH Shell
 *
 * Provides terminal-like interactive shell sessions over SSH.
 */
import { ShellOptions } from '../types/index.js';
import { SSHClient } from './ssh-client.js';
/**
 * Interactive SSH shell for terminal-like sessions
 *
 * Features:
 * - PTY (pseudo-terminal) support
 * - Real-time input/output
 * - Terminal resizing
 * - Proper shell cleanup
 */
export declare class SSHShell {
    private client;
    private channel;
    private active;
    private lib;
    constructor(client: SSHClient);
    /**
     * Start an interactive shell session
     *
     * @param options Shell configuration options
     */
    start(options?: ShellOptions): Promise<void>;
    /**
     * Send input to the shell
     *
     * @param data Data to send to shell
     * @returns Number of bytes written
     */
    write(data: string): Promise<number>;
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
     * @param width New terminal width
     * @param height New terminal height
     */
    resize(width: number, height: number): Promise<void>;
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