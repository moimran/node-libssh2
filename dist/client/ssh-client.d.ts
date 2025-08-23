/**
 * High-performance SSH Client
 *
 * Provides an easy-to-use interface for SSH connections with optimized performance.
 */
import { SSHConnectionOptions, CommandResult } from '../types/index.js';
/**
 * High-performance SSH client with optimized command execution
 *
 * Features:
 * - Fast command execution (5-50ms response times)
 * - Automatic resource management
 * - Connection reuse for multiple commands
 * - Smart output reading with EOF detection
 * - Comprehensive error handling
 */
export declare class SSHClient {
    private lib;
    private session;
    private nodeSocket;
    private nativeSocket;
    private platformLib;
    private connected;
    private connectionOptions;
    /**
     * Connect to SSH server with password authentication
     *
     * @param options Connection configuration
     */
    connect(options: SSHConnectionOptions): Promise<void>;
    /**
     * Execute a command and return the result with optimized performance
     *
     * @param command Command to execute
     * @returns Command result with output and exit code
     */
    executeCommand(command: string): Promise<CommandResult>;
    /**
     * Optimized channel output reading with smart EOF detection
     *
     * This method provides 5-10x faster command execution compared to naive approaches
     * by eliminating artificial delays and using smart EOF detection.
     */
    private readChannelOutputOptimized;
    /**
     * Check if connected to SSH server
     */
    isConnected(): boolean;
    /**
     * Get connection information
     */
    getConnectionInfo(): SSHConnectionOptions | null;
    /**
     * Disconnect from SSH server and cleanup all resources
     */
    disconnect(): void;
    /**
     * Create cross-platform socket connection
     */
    private createSocketConnection;
    /**
     * Create Node.js socket for connection management
     */
    private createNodeSocket;
    /**
     * Create platform-specific native socket for libssh2
     */
    private createNativeSocket;
    /**
     * Create Windows socket using ws2_32.dll
     */
    private createWindowsSocket;
    /**
     * Create Unix socket using libc
     */
    private createUnixSocket;
}
//# sourceMappingURL=ssh-client.d.ts.map