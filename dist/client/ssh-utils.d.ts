/**
 * SSH Utility Functions
 *
 * Provides convenient static methods for common SSH operations.
 */
import { SSHConnectionOptions, CommandResult, SystemInfo } from '../types/index.js';
/**
 * Utility class for common SSH operations
 *
 * Provides static methods for quick SSH operations without managing connections manually.
 */
export declare class SSHUtils {
    /**
     * Execute a single command on a remote server
     *
     * This method handles the complete lifecycle: connect, authenticate, execute, disconnect.
     * Perfect for one-off commands.
     *
     * @param connectionOptions SSH connection configuration
     * @param command Command to execute
     * @returns Command result
     */
    static executeCommand(connectionOptions: SSHConnectionOptions, command: string): Promise<CommandResult>;
    /**
     * Test SSH connection without executing any commands
     *
     * @param connectionOptions SSH connection configuration
     * @returns true if connection successful, false otherwise
     */
    static testConnection(connectionOptions: SSHConnectionOptions): Promise<boolean>;
    /**
     * Get comprehensive system information from remote host
     *
     * @param connectionOptions SSH connection configuration
     * @returns System information object
     */
    static getSystemInfo(connectionOptions: SSHConnectionOptions): Promise<SystemInfo>;
    /**
     * Execute multiple commands efficiently using a single connection
     *
     * @param connectionOptions SSH connection configuration
     * @param commands Array of commands to execute
     * @returns Array of command results
     */
    static executeCommands(connectionOptions: SSHConnectionOptions, commands: string[]): Promise<CommandResult[]>;
    /**
     * Check if a remote file or directory exists
     *
     * @param connectionOptions SSH connection configuration
     * @param path Path to check
     * @returns true if path exists, false otherwise
     */
    static pathExists(connectionOptions: SSHConnectionOptions, path: string): Promise<boolean>;
    /**
     * Get file information from remote host
     *
     * @param connectionOptions SSH connection configuration
     * @param path Path to file/directory
     * @returns File information or null if not found
     */
    static getFileInfo(connectionOptions: SSHConnectionOptions, path: string): Promise<{
        exists: boolean;
        isFile: boolean;
        isDirectory: boolean;
        size: number;
        permissions: string;
        owner: string;
        modified: string;
    } | null>;
    /**
     * Create a directory on remote host
     *
     * @param connectionOptions SSH connection configuration
     * @param path Directory path to create
     * @param recursive Create parent directories if needed
     * @returns true if successful
     */
    static createDirectory(connectionOptions: SSHConnectionOptions, path: string, recursive?: boolean): Promise<boolean>;
    /**
     * Remove a file or directory on remote host
     *
     * @param connectionOptions SSH connection configuration
     * @param path Path to remove
     * @param recursive Remove directories recursively
     * @returns true if successful
     */
    static removePath(connectionOptions: SSHConnectionOptions, path: string, recursive?: boolean): Promise<boolean>;
    /**
     * Get disk usage information
     *
     * @param connectionOptions SSH connection configuration
     * @param path Path to check (default: current directory)
     * @returns Disk usage information
     */
    static getDiskUsage(connectionOptions: SSHConnectionOptions, path?: string): Promise<{
        total: string;
        used: string;
        available: string;
        percentage: string;
        filesystem: string;
    } | null>;
    /**
     * Get running processes on remote host
     *
     * @param connectionOptions SSH connection configuration
     * @returns Array of process information
     */
    static getProcesses(connectionOptions: SSHConnectionOptions): Promise<Array<{
        pid: string;
        user: string;
        cpu: string;
        memory: string;
        command: string;
    }>>;
    /**
     * Measure command execution performance
     *
     * @param connectionOptions SSH connection configuration
     * @param command Command to measure
     * @returns Performance metrics
     */
    static measurePerformance(connectionOptions: SSHConnectionOptions, command: string): Promise<{
        executionTime: number;
        connectionTime: number;
        result: CommandResult;
    }>;
}
//# sourceMappingURL=ssh-utils.d.ts.map