/**
 * SSH Client - Connection Management for Terminal Operations
 * 
 * Provides a simple SSH client for managing connections and creating terminals.
 * Built on top of the low-level core classes.
 */

import { Socket } from 'net';
import { Session } from '../core/session.js';
import { SSHClientOptions, ConnectionState, SSHError } from './types.js';
import { createSocket } from './ssh-async.js';

/**
 * SSH Client for managing connections and creating terminals
 */
export class SSHClient {
  private session: Session | null = null;
  private socket: Socket | null = null;
  private nativeSocket: number = 0;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private config: SSHClientOptions | null = null;

  /**
   * Get current connection state
   */
  get connectionState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if client is connected and authenticated
   */
  get isConnected(): boolean {
    return this.state === ConnectionState.AUTHENTICATED;
  }

  /**
   * Connect to SSH server
   */
  async connect(config: SSHClientOptions): Promise<void> {
    if (this.state !== ConnectionState.DISCONNECTED) {
      throw new SSHError('Client is already connected or connecting');
    }

    this.config = config;
    this.state = ConnectionState.CONNECTING;

    try {
      // Create socket connection
      const { nodeSocket, nativeSocket } = await createSocket(config);
      this.socket = nodeSocket;
      this.nativeSocket = nativeSocket;

      // Create and setup session
      this.session = new Session();

      // Enable non-blocking mode (inspired by async-ssh2-lite)
      this.session.setBlocking(false);

      this.state = ConnectionState.CONNECTED;

      // Perform handshake with async retry pattern
      await this.performHandshakeAsync(nativeSocket);

      // Authenticate
      this.state = ConnectionState.AUTHENTICATING;
      await this.authenticate();
      this.state = ConnectionState.AUTHENTICATED;

    } catch (error) {
      this.state = ConnectionState.ERROR;
      await this.cleanup();
      throw error instanceof SSHError ? error : new SSHError(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Perform SSH handshake with async retry pattern (inspired by async-ssh2-lite)
   */
  private async performHandshakeAsync(socket: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const attemptHandshake = () => {
        try {
          const result = this.session!.handshake(socket);

          if (result === 0) {
            resolve();
          } else if (result === -37) { // EAGAIN equivalent
            setImmediate(attemptHandshake);
          } else {
            reject(new SSHError(`SSH handshake failed: ${result}`));
          }
        } catch (error: any) {
          if (error.message && (
            error.message.includes('would block') ||
            error.message.includes('EAGAIN') ||
            error.message.includes('try again')
          )) {
            setImmediate(attemptHandshake);
          } else {
            reject(error);
          }
        }
      };

      attemptHandshake();
    });
  }

  /**
   * Disconnect from SSH server
   */
  async disconnect(): Promise<void> {
    if (this.state === ConnectionState.DISCONNECTED) {
      return;
    }

    await this.cleanup();
    this.state = ConnectionState.DISCONNECTED;
  }

  /**
   * Get the underlying session for advanced operations
   */
  getSession(): Session {
    if (!this.session || !this.isConnected) {
      throw new SSHError('Client is not connected');
    }
    return this.session;
  }

  /**
   * Get connection configuration
   */
  getConfig(): SSHClientOptions {
    if (!this.config) {
      throw new SSHError('Client is not configured');
    }
    return { ...this.config };
  }

  /**
   * Private: Authenticate with the server using async retry pattern
   */
  private async authenticate(): Promise<void> {
    if (!this.session || !this.config) {
      throw new SSHError('Session or config not available');
    }

    const { username, password, privateKeyPath, passphrase } = this.config;

    if (privateKeyPath) {
      // Public key authentication with async retry
      await this.authenticatePublicKeyAsync(username, privateKeyPath, passphrase || '');
    } else if (password) {
      // Password authentication with async retry
      await this.authenticatePasswordAsync(username, password);
    } else {
      throw new SSHError('No authentication method provided');
    }
  }

  /**
   * Authenticate with password using async retry pattern (inspired by async-ssh2-lite)
   */
  private async authenticatePasswordAsync(username: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const attemptAuth = () => {
        try {
          const result = this.session!.userauthPassword(username, password);

          if (result === 0) {
            resolve();
          } else if (result === -37) { // EAGAIN equivalent
            setImmediate(attemptAuth);
          } else {
            reject(new SSHError(`Password authentication failed: ${result}`));
          }
        } catch (error: any) {
          if (error.message && (
            error.message.includes('would block') ||
            error.message.includes('EAGAIN') ||
            error.message.includes('try again')
          )) {
            setImmediate(attemptAuth);
          } else {
            reject(error);
          }
        }
      };

      attemptAuth();
    });
  }

  /**
   * Authenticate with public key using async retry pattern (inspired by async-ssh2-lite)
   */
  private async authenticatePublicKeyAsync(username: string, privateKeyPath: string, passphrase: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const attemptAuth = () => {
        try {
          const result = this.session!.userauthPublicKeyFromFile(
            username,
            `${privateKeyPath}.pub`,
            privateKeyPath,
            passphrase
          );

          if (result === 0) {
            resolve();
          } else if (result === -37) { // EAGAIN equivalent
            setImmediate(attemptAuth);
          } else {
            reject(new SSHError(`Public key authentication failed: ${result}`));
          }
        } catch (error: any) {
          if (error.message && (
            error.message.includes('would block') ||
            error.message.includes('EAGAIN') ||
            error.message.includes('try again')
          )) {
            setImmediate(attemptAuth);
          } else {
            reject(error);
          }
        }
      };

      attemptAuth();
    });
  }

  /**
   * Private: Clean up resources
   */
  private async cleanup(): Promise<void> {
    if (this.session) {
      try {
        this.session.disconnect('Client disconnecting');
        this.session.free();
      } catch (error) {
        // Ignore cleanup errors
      }
      this.session = null;
    }

    if (this.socket) {
      try {
        this.socket.destroy();
      } catch (error) {
        // Ignore cleanup errors
      }
      this.socket = null;
    }

    this.nativeSocket = 0;
    this.config = null;
  }
}
