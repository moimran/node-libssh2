/**
 * SSH Utility Functions
 * 
 * Provides convenient static methods for common SSH operations.
 */

import { SSHClient } from './ssh-client.js';
import { SSHConnectionOptions, CommandResult, SystemInfo } from '../types/index.js';

/**
 * Utility class for common SSH operations
 * 
 * Provides static methods for quick SSH operations without managing connections manually.
 */
export class SSHUtils {
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
  static async executeCommand(
    connectionOptions: SSHConnectionOptions,
    command: string
  ): Promise<CommandResult> {
    const client = new SSHClient();
    try {
      await client.connect(connectionOptions);
      return await client.executeCommand(command);
    } finally {
      client.disconnect();
    }
  }

  /**
   * Test SSH connection without executing any commands
   * 
   * @param connectionOptions SSH connection configuration
   * @returns true if connection successful, false otherwise
   */
  static async testConnection(connectionOptions: SSHConnectionOptions): Promise<boolean> {
    const client = new SSHClient();
    try {
      await client.connect(connectionOptions);
      return true;
    } catch (error) {
      return false;
    } finally {
      client.disconnect();
    }
  }

  /**
   * Get comprehensive system information from remote host
   * 
   * @param connectionOptions SSH connection configuration
   * @returns System information object
   */
  static async getSystemInfo(connectionOptions: SSHConnectionOptions): Promise<SystemInfo> {
    const client = new SSHClient();
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
      const kernelMatch = os.output.match(/(\d+\.\d+\.\d+)/);
      const kernel = kernelMatch ? kernelMatch[1] : 'Unknown';

      return {
        hostname: hostname.output.trim(),
        os: os.output.trim(),
        kernel,
        uptime: uptime.output.trim(),
        currentUser: user.output.trim(),
        currentDirectory: pwd.output.trim()
      };
    } finally {
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
  static async executeCommands(
    connectionOptions: SSHConnectionOptions,
    commands: string[]
  ): Promise<CommandResult[]> {
    const client = new SSHClient();
    try {
      await client.connect(connectionOptions);
      
      const results: CommandResult[] = [];
      for (const command of commands) {
        const result = await client.executeCommand(command);
        results.push(result);
      }
      
      return results;
    } finally {
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
  static async pathExists(
    connectionOptions: SSHConnectionOptions,
    path: string
  ): Promise<boolean> {
    try {
      const result = await this.executeCommand(connectionOptions, `test -e "${path}"`);
      return result.success;
    } catch (error) {
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
  static async getFileInfo(
    connectionOptions: SSHConnectionOptions,
    path: string
  ): Promise<{
    exists: boolean;
    isFile: boolean;
    isDirectory: boolean;
    size: number;
    permissions: string;
    owner: string;
    modified: string;
  } | null> {
    try {
      const result = await this.executeCommand(
        connectionOptions,
        `stat -c "%F|%s|%A|%U|%Y" "${path}" 2>/dev/null || echo "not_found"`
      );

      if (!result.success || result.output.includes('not_found')) {
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
    } catch (error) {
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
  static async createDirectory(
    connectionOptions: SSHConnectionOptions,
    path: string,
    recursive = false
  ): Promise<boolean> {
    try {
      const command = recursive ? `mkdir -p "${path}"` : `mkdir "${path}"`;
      const result = await this.executeCommand(connectionOptions, command);
      return result.success;
    } catch (error) {
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
  static async removePath(
    connectionOptions: SSHConnectionOptions,
    path: string,
    recursive = false
  ): Promise<boolean> {
    try {
      const command = recursive ? `rm -rf "${path}"` : `rm "${path}"`;
      const result = await this.executeCommand(connectionOptions, command);
      return result.success;
    } catch (error) {
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
  static async getDiskUsage(
    connectionOptions: SSHConnectionOptions,
    path = '.'
  ): Promise<{
    total: string;
    used: string;
    available: string;
    percentage: string;
    filesystem: string;
  } | null> {
    try {
      const result = await this.executeCommand(
        connectionOptions,
        `df -h "${path}" | tail -n 1`
      );

      if (!result.success) {
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
    } catch (error) {
      return null;
    }
  }

  /**
   * Get running processes on remote host
   * 
   * @param connectionOptions SSH connection configuration
   * @returns Array of process information
   */
  static async getProcesses(
    connectionOptions: SSHConnectionOptions
  ): Promise<Array<{
    pid: string;
    user: string;
    cpu: string;
    memory: string;
    command: string;
  }>> {
    try {
      const result = await this.executeCommand(
        connectionOptions,
        'ps aux --no-headers | head -20'
      );

      if (!result.success) {
        return [];
      }

      return result.output
        .trim()
        .split('\n')
        .map(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length < 11) return null;
          
          return {
            pid: parts[1],
            user: parts[0],
            cpu: parts[2],
            memory: parts[3],
            command: parts.slice(10).join(' ')
          };
        })
        .filter(Boolean) as Array<{
          pid: string;
          user: string;
          cpu: string;
          memory: string;
          command: string;
        }>;
    } catch (error) {
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
  static async measurePerformance(
    connectionOptions: SSHConnectionOptions,
    command: string
  ): Promise<{
    executionTime: number;
    connectionTime: number;
    result: CommandResult;
  }> {
    const startTime = Date.now();
    const client = new SSHClient();
    
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
    } finally {
      client.disconnect();
    }
  }
}
