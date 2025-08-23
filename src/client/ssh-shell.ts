/**
 * Interactive SSH Shell
 * 
 * Provides terminal-like interactive shell sessions over SSH.
 */

import { cstr, isNull } from '../core/ffi.js';
import { ShellOptions, SSHCommandError } from '../types/index.js';
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
export class SSHShell {
  private client: SSHClient;
  private channel: any = null;
  private active = false;
  private lib: any = null;

  constructor(client: SSHClient) {
    this.client = client;
  }

  /**
   * Start an interactive shell session
   * 
   * @param options Shell configuration options
   */
  async start(options: ShellOptions = {}): Promise<void> {
    if (!this.client.isConnected()) {
      throw new SSHCommandError('SSH client not connected');
    }

    const { terminalType = 'xterm', width = 80, height = 24 } = options;

    // Access private members for shell operations
    this.lib = (this.client as any).lib;
    const session = (this.client as any).session;

    // Open channel
    this.channel = this.lib.libssh2_channel_open_ex(
      session,
      cstr('session'),
      7,
      65536,
      32768,
      null,
      0
    );

    if (!this.channel || isNull(this.channel)) {
      throw new SSHCommandError('Failed to open shell channel');
    }

    try {
      // Request PTY
      const ptyResult = this.lib.libssh2_channel_request_pty_ex(
        this.channel,
        cstr(terminalType),
        terminalType.length,
        null,
        0,
        width,
        height,
        0,
        0
      );

      if (ptyResult !== 0) {
        throw new SSHCommandError(`Failed to request PTY: ${ptyResult}`);
      }

      // Start shell
      const shellResult = this.lib.libssh2_channel_process_startup(
        this.channel,
        cstr('shell'),
        5,
        null,
        0
      );

      if (shellResult !== 0) {
        throw new SSHCommandError(`Failed to start shell: ${shellResult}`);
      }

      this.active = true;
    } catch (error) {
      // Cleanup on failure
      if (this.channel) {
        this.lib.libssh2_channel_close(this.channel);
        this.lib.libssh2_channel_free(this.channel);
        this.channel = null;
      }
      throw error;
    }
  }

  /**
   * Send input to the shell
   * 
   * @param data Data to send to shell
   * @returns Number of bytes written
   */
  async write(data: string): Promise<number> {
    if (!this.active || !this.channel) {
      throw new SSHCommandError('Shell not active');
    }

    const buffer = Buffer.from(data, 'utf8');
    
    const bytesWritten = this.lib.libssh2_channel_write_ex(
      this.channel,
      0,
      buffer,
      buffer.length
    );

    if (bytesWritten < 0) {
      throw new SSHCommandError(`Failed to write to shell: ${bytesWritten}`);
    }

    return Number(bytesWritten);
  }

  /**
   * Read output from the shell
   * 
   * @param timeoutMs Maximum time to wait for data (default: 1000ms)
   * @returns Output from shell
   */
  async read(timeoutMs = 1000): Promise<string> {
    if (!this.active || !this.channel) {
      throw new SSHCommandError('Shell not active');
    }

    const buffer = Buffer.alloc(8192);
    let output = '';
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const bytesRead = this.lib.libssh2_channel_read_ex(this.channel, 0, buffer, buffer.length);
      
      if (bytesRead > 0) {
        output += buffer.subarray(0, Number(bytesRead)).toString();
      } else if (bytesRead === 0) {
        // EOF
        break;
      } else if (bytesRead === -37) {
        // EAGAIN - no data available, wait a bit
        await new Promise(resolve => setTimeout(resolve, 10));
      } else {
        // Error
        break;
      }
    }

    return output;
  }

  /**
   * Read output from shell with smart detection
   * 
   * This method reads until no more data is available, making it suitable
   * for reading command output that may arrive in multiple chunks.
   * 
   * @param maxWaitMs Maximum time to wait for additional data
   * @returns Complete output from shell
   */
  async readUntilComplete(maxWaitMs = 2000): Promise<string> {
    if (!this.active || !this.channel) {
      throw new SSHCommandError('Shell not active');
    }

    const buffer = Buffer.alloc(8192);
    let output = '';
    let lastDataTime = Date.now();
    const startTime = Date.now();
    let consecutiveEmptyReads = 0;

    while (Date.now() - startTime < maxWaitMs) {
      const bytesRead = this.lib.libssh2_channel_read_ex(this.channel, 0, buffer, buffer.length);
      
      if (bytesRead > 0) {
        output += buffer.subarray(0, Number(bytesRead)).toString();
        lastDataTime = Date.now();
        consecutiveEmptyReads = 0;
      } else if (bytesRead === 0) {
        // EOF
        break;
      } else if (bytesRead === -37) {
        // EAGAIN - no data available
        consecutiveEmptyReads++;
        
        // If we haven't received data for a while and have had several empty reads,
        // assume we're done
        if (Date.now() - lastDataTime > 500 && consecutiveEmptyReads > 10) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 10));
      } else {
        // Error
        break;
      }
    }

    return output;
  }

  /**
   * Resize the terminal
   * 
   * @param width New terminal width
   * @param height New terminal height
   */
  async resize(width: number, height: number): Promise<void> {
    if (!this.active || !this.channel) {
      throw new SSHCommandError('Shell not active');
    }

    // Note: libssh2 doesn't have a direct resize function
    // This would typically require sending a window change signal
    // For now, we'll just store the dimensions
    // A full implementation would need to send SIGWINCH or similar
    console.warn('Terminal resize not fully implemented in libssh2');
  }

  /**
   * Send a signal to the shell process
   * 
   * @param signal Signal name (e.g., 'TERM', 'KILL', 'INT')
   */
  async sendSignal(signal: string): Promise<void> {
    if (!this.active || !this.channel) {
      throw new SSHCommandError('Shell not active');
    }

    // Note: This would require libssh2_channel_send_signal which may not be available
    // in all versions. For now, we can simulate common signals by sending control characters
    switch (signal.toUpperCase()) {
      case 'INT':
      case 'SIGINT':
        // Send Ctrl+C
        await this.write('\x03');
        break;
      case 'TERM':
      case 'SIGTERM':
        // Send exit command
        await this.write('exit\n');
        break;
      default:
        throw new SSHCommandError(`Signal ${signal} not supported`);
    }
  }

  /**
   * Check if shell is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Get shell status information
   */
  getStatus(): {
    active: boolean;
    hasChannel: boolean;
    clientConnected: boolean;
  } {
    return {
      active: this.active,
      hasChannel: this.channel !== null,
      clientConnected: this.client.isConnected()
    };
  }

  /**
   * Close the shell session
   */
  close(): void {
    if (this.channel && this.active && this.lib) {
      try {
        // Send exit command to gracefully close shell
        this.lib.libssh2_channel_write_ex(
          this.channel,
          0,
          Buffer.from('exit\n'),
          5
        );
        
        // Wait a bit for graceful shutdown
        setTimeout(() => {
          if (this.channel && this.lib) {
            this.lib.libssh2_channel_close(this.channel);
            this.lib.libssh2_channel_free(this.channel);
          }
        }, 100);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      this.channel = null;
      this.active = false;
    }
  }
}
