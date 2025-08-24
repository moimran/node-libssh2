/**
 * SSH Terminal - Interactive Terminal Operations
 * 
 * Provides SSH terminal functionality for building terminal applications.
 * Built on top of the low-level core classes.
 */

import { Channel } from '../core/channel.js';
import { SSHClient } from './ssh-client.js';
import { SSHTerminalOptions, TerminalDimensions, TerminalData, SSHError } from './types.js';

/**
 * SSH Terminal for interactive shell operations
 */
export class SSHTerminal {
  private client: SSHClient;
  private channel: Channel | null = null;
  private dimensions: TerminalDimensions;
  private isActive: boolean = false;

  constructor(client: SSHClient) {
    if (!client.isConnected) {
      throw new SSHError('SSH client must be connected before creating terminal');
    }
    this.client = client;
    this.dimensions = { cols: 80, rows: 24 };
  }

  /**
   * Start the terminal session
   */
  async start(options: SSHTerminalOptions = {}): Promise<void> {
    if (this.isActive) {
      throw new SSHError('Terminal is already active');
    }

    const {
      term = 'xterm-256color',
      cols = 80,
      rows = 24,
      env = {},
      modes = ''
    } = options;

    try {
      const session = this.client.getSession();

      // Open channel with async retry pattern (inspired by async-ssh2-lite)
      const rawChannel = await this.openSessionAsync(session);

      if (!rawChannel) {
        throw new SSHError('Failed to open SSH channel');
      }

      this.channel = new Channel(rawChannel, session['lib']);
      this.dimensions = { cols, rows };
      // Set environment variables
      for (const [key, value] of Object.entries(env)) {
        this.channel.setenv(key, value);
      }

      // Request PTY with async retry pattern
      await this.requestPtyAsync(term, modes, cols, rows);

      // Start shell with async retry pattern
      await this.startShellAsync();

      this.isActive = true;
    } catch (error) {
      await this.cleanup();
      throw error instanceof SSHError ? error : new SSHError(`Failed to start terminal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Open session channel with async retry pattern (inspired by async-ssh2-lite)
   * This prevents blocking by yielding control when the operation would block
   */
  private async openSessionAsync(session: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const attemptOpen = () => {
        try {
          const channel = session.openSession();

          if (channel) {
            resolve(channel);
          } else {
            // Channel creation failed, but not due to blocking - retry with delay
            setImmediate(attemptOpen);
          }
        } catch (error: any) {
          // Check if this is a "would block" error (EAGAIN equivalent)
          if (error.message && (
            error.message.includes('would block') ||
            error.message.includes('EAGAIN') ||
            error.message.includes('try again') ||
            error.code === 'EAGAIN'
          )) {
            // Yield control back to event loop and retry (async-ssh2-lite pattern)
            setImmediate(attemptOpen);
          } else {
            reject(error);
          }
        }
      };

      // Start the first attempt
      attemptOpen();
    });
  }

  /**
   * Request PTY with async retry pattern (inspired by async-ssh2-lite)
   */
  private async requestPtyAsync(term: string, modes: string, cols: number, rows: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const attemptPty = () => {
        try {
          const result = this.channel!.ptyEx(term, modes, cols, rows);

          if (result === 0) {
            resolve();
          } else if (result === -37) { // EAGAIN equivalent
            setImmediate(attemptPty);
          } else {
            reject(new SSHError(`Failed to request PTY: ${result}`));
          }
        } catch (error: any) {
          if (error.message && (
            error.message.includes('would block') ||
            error.message.includes('EAGAIN') ||
            error.message.includes('try again')
          )) {
            setImmediate(attemptPty);
          } else {
            reject(error);
          }
        }
      };

      attemptPty();
    });
  }

  /**
   * Start shell with async retry pattern (inspired by async-ssh2-lite)
   */
  private async startShellAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      const attemptShell = () => {
        try {
          const result = this.channel!.shell();

          if (result === 0) {
            resolve();
          } else if (result === -37) { // EAGAIN equivalent
            setImmediate(attemptShell);
          } else {
            reject(new SSHError(`Failed to start shell: ${result}`));
          }
        } catch (error: any) {
          if (error.message && (
            error.message.includes('would block') ||
            error.message.includes('EAGAIN') ||
            error.message.includes('try again')
          )) {
            setImmediate(attemptShell);
          } else {
            reject(error);
          }
        }
      };

      attemptShell();
    });
  }

  /**
   * Write data to the terminal
   */
  write(data: string | Buffer): number {
    if (!this.isActive || !this.channel) {
      throw new SSHError('Terminal is not active');
    }

    const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const [bytesWritten] = this.channel.write(buffer);
    return bytesWritten;
  }

  /**
   * Read data from the terminal (synchronous)
   */
  read(maxBytes: number = 65536): TerminalData | null {
    if (!this.isActive || !this.channel) {
      throw new SSHError('Terminal is not active');
    }

    const buffer = Buffer.alloc(maxBytes);
    const [bytesRead] = this.channel.read(buffer);

    if (bytesRead > 0) {
      return {
        data: buffer.subarray(0, bytesRead),
        stderr: false,
        length: bytesRead
      };
    }

    return null;
  }

  /**
   * Read data from the terminal (asynchronous, non-blocking)
   */
  async readAsync(maxBytes: number = 65536): Promise<TerminalData | null> {
    if (!this.isActive || !this.channel) {
      throw new SSHError('Terminal is not active');
    }

    return new Promise((resolve) => {
      // Use setTimeout with 0ms to push to next event loop cycle
      setTimeout(() => {
        try {
          const buffer = Buffer.alloc(maxBytes);
          const [bytesRead] = this.channel!.read(buffer);

          if (bytesRead > 0) {
            resolve({
              data: buffer.subarray(0, bytesRead),
              stderr: false,
              length: bytesRead
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      }, 0);
    });
  }

  /**
   * Read stderr data from the terminal (synchronous)
   */
  readStderr(maxBytes: number = 4096): TerminalData | null {
    if (!this.isActive || !this.channel) {
      throw new SSHError('Terminal is not active');
    }

    const buffer = Buffer.alloc(maxBytes);
    const [bytesRead] = this.channel.readStderr(buffer);

    if (bytesRead > 0) {
      return {
        data: buffer.subarray(0, bytesRead),
        stderr: true,
        length: bytesRead
      };
    }

    return null;
  }

  /**
   * Read stderr data from the terminal (asynchronous, non-blocking)
   */
  async readStderrAsync(maxBytes: number = 4096): Promise<TerminalData | null> {
    if (!this.isActive || !this.channel) {
      throw new SSHError('Terminal is not active');
    }

    return new Promise((resolve) => {
      // Use setImmediate to make the read operation non-blocking
      setImmediate(() => {
        try {
          const buffer = Buffer.alloc(maxBytes);
          const [bytesRead] = this.channel!.readStderr(buffer);

          if (bytesRead > 0) {
            resolve({
              data: buffer.subarray(0, bytesRead),
              stderr: true,
              length: bytesRead
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      });
    });
  }

  /**
   * Resize the terminal
   */
  resize(cols: number, rows: number, width?: number, height?: number): void {
    if (!this.isActive || !this.channel) {
      throw new SSHError('Terminal is not active');
    }

    const result = this.channel.ptyResize(cols, rows, width || 0, height || 0);
    if (result === 0) {
      this.dimensions = { cols, rows, width, height };
    } else {
      throw new SSHError(`Failed to resize terminal: ${result}`);
    }
  }

  /**
   * Get current terminal dimensions
   */
  getDimensions(): TerminalDimensions {
    return { ...this.dimensions };
  }

  /**
   * Send signal to the terminal
   */
  signal(signalName: string): void {
    if (!this.isActive || !this.channel) {
      throw new SSHError('Terminal is not active');
    }

    const result = this.channel.signal(signalName);
    if (result !== 0) {
      throw new SSHError(`Failed to send signal ${signalName}: ${result}`);
    }
  }

  /**
   * Check if terminal is EOF
   */
  isEof(): boolean {
    if (!this.isActive || !this.channel) {
      return true;
    }
    return this.channel.eof() === 1;
  }

  /**
   * Get exit status (only available after channel is closed)
   */
  getExitStatus(): number | null {
    if (!this.channel) {
      return null;
    }
    return this.channel.getExitStatus();
  }

  /**
   * Close the terminal
   */
  async close(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    await this.cleanup();
    this.isActive = false;
  }

  /**
   * Check if terminal is active
   */
  get active(): boolean {
    return this.isActive;
  }

  /**
   * Private: Clean up resources
   */
  private async cleanup(): Promise<void> {
    if (this.channel) {
      try {
        this.channel.close();
        this.channel.free();
      } catch (error) {
        // Ignore cleanup errors
      }
      this.channel = null;
    }
  }
}

/**
 * Alias for SSHTerminal for compatibility
 */
export class SSHShell extends SSHTerminal {
  constructor(client: SSHClient) {
    super(client);
  }
}
