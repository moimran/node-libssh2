"use strict";
/**
 * SSH Utility Functions
 *
 * Provides convenient static methods for common SSH operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSHUtils = void 0;
const ssh_client_js_1 = require("./ssh-client.js");
/**
 * Utility class for common SSH operations
 *
 * Provides static methods for quick SSH operations without managing connections manually.
 */
class SSHUtils {
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
    static async executeCommand(connectionOptions, command) {
        const client = new ssh_client_js_1.SSHClient();
        try {
            await client.connect(connectionOptions);
            return await client.executeCommand(command);
        }
        finally {
            client.disconnect();
        }
    }
    /**
     * Test SSH connection without executing any commands
     *
     * @param connectionOptions SSH connection configuration
     * @returns true if connection successful, false otherwise
     */
    static async testConnection(connectionOptions) {
        const client = new ssh_client_js_1.SSHClient();
        try {
            await client.connect(connectionOptions);
            return true;
        }
        catch (error) {
            return false;
        }
        finally {
            client.disconnect();
        }
    }
    /**
     * Get comprehensive system information from remote host
     *
     * @param connectionOptions SSH connection configuration
     * @returns System information object
     */
    static async getSystemInfo(connectionOptions) {
        const client = new ssh_client_js_1.SSHClient();
        try {
            await client.connect(connectionOptions);
            // Execute multiple commands in parallel for better performance
            const [hostname, os, uptime, user, pwd] = await Promise.all([
                client.executeCommand('hostname').catch(() => ({ output: 'unknown', exitCode: 1, success: false })),
                client.executeCommand('uname -a').catch(() => ({ output: 'unknown', exitCode: 1, success: false })),
                client.executeCommand('uptime').catch(() => ({ output: 'unknown', exitCode: 1, success: false })),
                client.executeCommand('whoami').catch(() => ({ output: 'unknown', exitCode: 1, success: false })),
                client.executeCommand('pwd').catch(() => ({ output: 'unknown', exitCode: 1, success: false }))
            ]);
            // Extract kernel version from uname output
            const osOutput = os.output || '';
            const kernelMatch = osOutput.match(/(\d+\.\d+\.\d+)/);
            const kernel = kernelMatch ? kernelMatch[1] : 'Unknown';
            return {
                hostname: (hostname.output || 'unknown').trim(),
                os: osOutput.trim(),
                kernel,
                uptime: (uptime.output || 'unknown').trim(),
                currentUser: (user.output || 'unknown').trim(),
                currentDirectory: (pwd.output || '/').trim()
            };
        }
        finally {
            client.disconnect();
        }
    }
    /**
     * Execute multiple commands efficiently using a single connection
     *
     * @param connectionOptions SSH connection configuration
     * @param commands Array of commands to execute
     * @returns Array of command results
     */
    static async executeCommands(connectionOptions, commands) {
        const client = new ssh_client_js_1.SSHClient();
        try {
            await client.connect(connectionOptions);
            const results = [];
            for (const command of commands) {
                const result = await client.executeCommand(command);
                results.push(result);
            }
            return results;
        }
        finally {
            client.disconnect();
        }
    }
    /**
     * Check if a remote file or directory exists
     *
     * @param connectionOptions SSH connection configuration
     * @param path Path to check
     * @returns true if path exists, false otherwise
     */
    static async pathExists(connectionOptions, path) {
        try {
            const result = await this.executeCommand(connectionOptions, `test -e "${path}"`);
            return result.success ?? (result.exitCode === 0);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get file information from remote host
     *
     * @param connectionOptions SSH connection configuration
     * @param path Path to file/directory
     * @returns File information or null if not found
     */
    static async getFileInfo(connectionOptions, path) {
        try {
            const result = await this.executeCommand(connectionOptions, `stat -c "%F|%s|%A|%U|%Y" "${path}" 2>/dev/null || echo "not_found"`);
            if (!(result.success ?? (result.exitCode === 0)) || result.output.includes('not_found')) {
                return null;
            }
            const [type, size, permissions, owner, modified] = result.output.trim().split('|');
            return {
                exists: true,
                isFile: type === 'regular file',
                isDirectory: type === 'directory',
                size: parseInt(size, 10) || 0,
                permissions: permissions || 'unknown',
                owner: owner || 'unknown',
                modified: new Date(parseInt(modified, 10) * 1000).toISOString()
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Create a directory on remote host
     *
     * @param connectionOptions SSH connection configuration
     * @param path Directory path to create
     * @param recursive Create parent directories if needed
     * @returns true if successful
     */
    static async createDirectory(connectionOptions, path, recursive = false) {
        try {
            const command = recursive ? `mkdir -p "${path}"` : `mkdir "${path}"`;
            const result = await this.executeCommand(connectionOptions, command);
            return result.success ?? (result.exitCode === 0);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Remove a file or directory on remote host
     *
     * @param connectionOptions SSH connection configuration
     * @param path Path to remove
     * @param recursive Remove directories recursively
     * @returns true if successful
     */
    static async removePath(connectionOptions, path, recursive = false) {
        try {
            const command = recursive ? `rm -rf "${path}"` : `rm "${path}"`;
            const result = await this.executeCommand(connectionOptions, command);
            return result.success ?? (result.exitCode === 0);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get disk usage information
     *
     * @param connectionOptions SSH connection configuration
     * @param path Path to check (default: current directory)
     * @returns Disk usage information
     */
    static async getDiskUsage(connectionOptions, path = '.') {
        try {
            const result = await this.executeCommand(connectionOptions, `df -h "${path}" | tail -n 1`);
            if (!(result.success ?? (result.exitCode === 0))) {
                return null;
            }
            const parts = result.output.trim().split(/\s+/);
            if (parts.length < 6) {
                return null;
            }
            return {
                filesystem: parts[0],
                total: parts[1],
                used: parts[2],
                available: parts[3],
                percentage: parts[4]
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Get running processes on remote host
     *
     * @param connectionOptions SSH connection configuration
     * @returns Array of process information
     */
    static async getProcesses(connectionOptions) {
        try {
            const result = await this.executeCommand(connectionOptions, 'ps aux --no-headers | head -20');
            if (!(result.success ?? (result.exitCode === 0))) {
                return [];
            }
            return result.output
                .trim()
                .split('\n')
                .map(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length < 11)
                    return null;
                return {
                    pid: parts[1],
                    user: parts[0],
                    cpu: parts[2],
                    memory: parts[3],
                    command: parts.slice(10).join(' ')
                };
            })
                .filter(Boolean);
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Measure command execution performance
     *
     * @param connectionOptions SSH connection configuration
     * @param command Command to measure
     * @returns Performance metrics
     */
    static async measurePerformance(connectionOptions, command) {
        const startTime = Date.now();
        const client = new ssh_client_js_1.SSHClient();
        try {
            const connectStart = Date.now();
            await client.connect(connectionOptions);
            const connectionTime = Date.now() - connectStart;
            const execStart = Date.now();
            const result = await client.executeCommand(command);
            const executionTime = Date.now() - execStart;
            return {
                executionTime,
                connectionTime,
                result
            };
        }
        finally {
            client.disconnect();
        }
    }
}
exports.SSHUtils = SSHUtils;
//# sourceMappingURL=ssh-utils.js.map