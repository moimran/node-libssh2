/**
 * Simple SSH Async Functions - Built on Core libssh2 Classes
 * 
 * Provides simple async functions for SSH operations.
 */

import { Socket } from 'net';
import { loadlibssh2, cstr } from '../core/index.js';
import * as koffi from 'koffi';
import * as os from 'os';

/**
 * SSH connection configuration
 */
export interface SSHConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
  timeout?: number;
}

/**
 * Command execution result
 */
export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

/**
 * Execute a single command over SSH
 */
export async function sshExec(config: SSHConfig, command: string): Promise<CommandResult> {
  const lib = loadlibssh2();

  // Check if required functions are available
  if (!lib.libssh2_init || !lib.libssh2_session_init_ex || !lib.libssh2_session_handshake) {
    throw new Error('Required libssh2 functions not available');
  }

  // Initialize libssh2
  lib.libssh2_init(0);

  try {
    const { nodeSocket, nativeSocket, platformLib } = await createSocket(config);
    const session = lib.libssh2_session_init_ex(null, null, null, null);

    if (!session) {
      throw new Error('Failed to create SSH session');
    }

    try {
      // Set session to blocking mode
      if (lib.libssh2_session_set_blocking) {
        lib.libssh2_session_set_blocking(session, 1);
      }

      // Set timeout
      if (config.timeout && lib.libssh2_session_set_timeout) {
        lib.libssh2_session_set_timeout(session, config.timeout);
      }

      // Perform handshake using native socket
      const handshakeResult = lib.libssh2_session_handshake(session, Number(nativeSocket));
      if (handshakeResult !== 0) {
        throw new Error(`Handshake failed: ${handshakeResult}`);
      }

      // Authenticate
      await authenticateSession(lib, session, config);

      // Open channel
      if (!lib.libssh2_channel_open_ex) {
        throw new Error('libssh2_channel_open_ex function not available');
      }

      const channel = lib.libssh2_channel_open_ex(
        session,
        'session',
        7, // length of 'session'
        65536, // window size
        32768, // packet size
        null,
        0
      );

      if (!channel) {
        throw new Error('Failed to open channel');
      }

      try {
        // Execute command
        if (!lib.libssh2_channel_process_startup) {
          throw new Error('libssh2_channel_process_startup function not available');
        }

        const execResult = lib.libssh2_channel_process_startup(
          channel,
          'exec',
          4, // length of 'exec'
          command,
          command.length
        );

        if (execResult !== 0) {
          throw new Error(`Command execution failed: ${execResult}`);
        }

        // Read output with proper async handling
        const result = await readChannelOutputAsync(lib, channel, config.timeout || 30000);

        // Get exit status
        const exitCode = lib.libssh2_channel_get_exit_status ? lib.libssh2_channel_get_exit_status(channel) : 0;

        return {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode,
          success: exitCode === 0
        };
      } finally {
        if (lib.libssh2_channel_close) {
          lib.libssh2_channel_close(channel);
        }
        if (lib.libssh2_channel_free) {
          lib.libssh2_channel_free(channel);
        }
      }
    } finally {
      if (lib.libssh2_session_disconnect_ex) {
        lib.libssh2_session_disconnect_ex(session, 11, cstr('Normal Shutdown'), cstr('en'));
      }
      if (lib.libssh2_session_free) {
        lib.libssh2_session_free(session);
      }

      // Clean up Node.js socket
      nodeSocket.destroy();

      // Clean up platform-specific socket
      try {
        if (os.platform() === 'win32') {
          const closesocket = platformLib.func('closesocket', 'int', ['uintptr_t']);
          const WSACleanup = platformLib.func('WSACleanup', 'int', []);
          closesocket(nativeSocket);
          WSACleanup();
        } else {
          const close = platformLib.func('close', 'int', ['int']);
          close(nativeSocket);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  } finally {
    if (lib.libssh2_exit) {
      lib.libssh2_exit();
    }
  }
}

/**
 * Execute multiple commands over SSH (reuses connection)
 */
export async function sshExecMultiple(config: SSHConfig, commands: string[]): Promise<CommandResult[]> {
  const lib = loadlibssh2();

  // Initialize libssh2
  lib.libssh2_init(0);

  try {
    const { nodeSocket, nativeSocket, platformLib } = await createSocket(config);
    const session = lib.libssh2_session_init_ex(null, null, null, null);

    if (!session) {
      throw new Error('Failed to create SSH session');
    }

    try {
      // Set session to blocking mode
      lib.libssh2_session_set_blocking(session, 1);

      // Set timeout
      if (config.timeout) {
        lib.libssh2_session_set_timeout(session, config.timeout);
      }

      // Perform handshake
      const handshakeResult = lib.libssh2_session_handshake(session, Number(nativeSocket));
      if (handshakeResult !== 0) {
        throw new Error(`Handshake failed: ${handshakeResult}`);
      }

      // Authenticate
      await authenticateSession(lib, session, config);

      const results: CommandResult[] = [];

      // Execute each command
      for (const command of commands) {
        // Open channel for this command
        const channel = lib.libssh2_channel_open_ex(
          session,
          'session',
          7,
          65536,
          32768,
          null,
          0
        );

        if (!channel) {
          throw new Error('Failed to open channel');
        }

        try {
          // Execute command
          const execResult = lib.libssh2_channel_process_startup(
            channel,
            'exec',
            4,
            command,
            command.length
          );

          if (execResult !== 0) {
            throw new Error(`Command execution failed: ${execResult}`);
          }

          // Read output
          const result = await readChannelOutputAsync(lib, channel, config.timeout || 30000);
          const exitCode = lib.libssh2_channel_get_exit_status(channel);

          results.push({
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode,
            success: exitCode === 0
          });
        } finally {
          lib.libssh2_channel_close(channel);
          lib.libssh2_channel_free(channel);
        }
      }

      return results;
    } finally {
      if (lib.libssh2_session_disconnect_ex) {
        lib.libssh2_session_disconnect_ex(session, 11, cstr('Normal Shutdown'), cstr('en'));
      }
      if (lib.libssh2_session_free) {
        lib.libssh2_session_free(session);
      }

      // Clean up sockets
      nodeSocket.destroy();
      try {
        if (os.platform() === 'win32') {
          const closesocket = platformLib.func('closesocket', 'int', ['uintptr_t']);
          const WSACleanup = platformLib.func('WSACleanup', 'int', []);
          closesocket(nativeSocket);
          WSACleanup();
        } else {
          const close = platformLib.func('close', 'int', ['int']);
          close(nativeSocket);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  } finally {
    lib.libssh2_exit();
  }
}

/**
 * Test SSH connection
 */
export async function sshTest(config: SSHConfig): Promise<boolean> {
  try {
    const lib = loadlibssh2();

    // Check if required functions are available
    if (!lib.libssh2_init || !lib.libssh2_session_init_ex || !lib.libssh2_session_handshake) {
      return false;
    }

    lib.libssh2_init(0);

    try {
      const { nodeSocket, nativeSocket, platformLib } = await createSocket(config);
      const session = lib.libssh2_session_init_ex(null, null, null, null);

      if (!session) {
        return false;
      }

      try {
        if (lib.libssh2_session_set_blocking) {
          lib.libssh2_session_set_blocking(session, 1);
        }
        if (config.timeout && lib.libssh2_session_set_timeout) {
          lib.libssh2_session_set_timeout(session, config.timeout);
        }

        const handshakeResult = lib.libssh2_session_handshake(session, Number(nativeSocket));
        if (handshakeResult !== 0) {
          return false;
        }

        await authenticateSession(lib, session, config);
        return true;
      } finally {
        if (lib.libssh2_session_disconnect_ex) {
          lib.libssh2_session_disconnect_ex(session, 11, cstr('Normal Shutdown'), cstr('en'));
        }
        if (lib.libssh2_session_free) {
          lib.libssh2_session_free(session);
        }

        // Clean up sockets
        nodeSocket.destroy();
        try {
          if (os.platform() === 'win32') {
            const closesocket = platformLib.func('closesocket', 'int', ['uintptr_t']);
            const WSACleanup = platformLib.func('WSACleanup', 'int', []);
            closesocket(nativeSocket);
            WSACleanup();
          } else {
            const close = platformLib.func('close', 'int', ['int']);
            close(nativeSocket);
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    } finally {
      if (lib.libssh2_exit) {
        lib.libssh2_exit();
      }
    }
  } catch (error) {
    return false;
  }
}

/**
 * Get SSH server information
 */
export async function sshInfo(config: SSHConfig): Promise<{
  banner: string | null;
  hostKey: Buffer | null;
  hostKeyType: number;
  authenticated: boolean;
}> {
  const lib = loadlibssh2();
  lib.libssh2_init(0);

  try {
    const { nodeSocket, nativeSocket, platformLib } = await createSocket(config);
    const session = lib.libssh2_session_init_ex(null, null, null, null);

    if (!session) {
      throw new Error('Failed to create SSH session');
    }

    try {
      lib.libssh2_session_set_blocking(session, 1);
      if (config.timeout) {
        lib.libssh2_session_set_timeout(session, config.timeout);
      }

      const handshakeResult = lib.libssh2_session_handshake(session, Number(nativeSocket));
      if (handshakeResult !== 0) {
        throw new Error(`Handshake failed: ${handshakeResult}`);
      }

      const banner = lib.libssh2_session_banner_get(session);
      const hostKeyInfo = lib.libssh2_session_hostkey(session, null, null);

      await authenticateSession(lib, session, config);
      const authenticated = lib.libssh2_userauth_authenticated(session) === 1;

      return {
        banner,
        hostKey: hostKeyInfo || null,
        hostKeyType: 0, // Would need additional parsing
        authenticated
      };
    } finally {
      if (lib.libssh2_session_disconnect_ex) {
        lib.libssh2_session_disconnect_ex(session, 11, cstr('Normal Shutdown'), cstr('en'));
      }
      if (lib.libssh2_session_free) {
        lib.libssh2_session_free(session);
      }

      // Clean up sockets
      nodeSocket.destroy();
      try {
        if (os.platform() === 'win32') {
          const closesocket = platformLib.func('closesocket', 'int', ['uintptr_t']);
          const WSACleanup = platformLib.func('WSACleanup', 'int', []);
          closesocket(nativeSocket);
          WSACleanup();
        } else {
          const close = platformLib.func('close', 'int', ['int']);
          close(nativeSocket);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  } finally {
    lib.libssh2_exit();
  }
}

// Helper functions

/**
 * Create cross-platform socket connection
 */
export async function createSocket(config: SSHConfig): Promise<{ nodeSocket: Socket; nativeSocket: any; platformLib: any }> {
  // Step 1: Create Node.js socket for connection management
  const nodeSocket = await createNodeSocket(config);

  // Step 2: Create platform-specific socket for libssh2
  const { nativeSocket, platformLib } = await createNativeSocket(config);

  return { nodeSocket, nativeSocket, platformLib };
}

/**
 * Create Node.js socket for connection management
 */
async function createNodeSocket(config: SSHConfig): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error('Connection timeout'));
    }, config.timeout || 30000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      resolve(socket);
    });

    socket.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Socket error: ${error.message}`));
    });

    socket.connect(config.port || 22, config.host);
  });
}

/**
 * Create platform-specific native socket for libssh2
 */
async function createNativeSocket(config: SSHConfig): Promise<{ nativeSocket: any; platformLib: any }> {
  const platform = os.platform();

  if (platform === 'win32') {
    return await createWindowsSocket(config);
  } else {
    return await createUnixSocket(config);
  }
}

/**
 * Create Windows socket using ws2_32.dll
 */
async function createWindowsSocket(config: SSHConfig): Promise<{ nativeSocket: any; platformLib: any }> {
  const platformLib = koffi.load('ws2_32.dll');

  const WSAStartup = platformLib.func('WSAStartup', 'int', ['uint16', 'void*']);
  const socketFunc = platformLib.func('socket', 'uintptr_t', ['int', 'int', 'int']);
  const connect = platformLib.func('connect', 'int', ['uintptr_t', 'void*', 'int']);
  const inet_addr = platformLib.func('inet_addr', 'uint32', ['str']);

  const wsaData = Buffer.alloc(400);
  const wsaResult = WSAStartup(0x0202, wsaData);
  if (wsaResult !== 0) {
    throw new Error(`WSAStartup failed: ${wsaResult}`);
  }

  const nativeSocket = socketFunc(2, 1, 6); // AF_INET, SOCK_STREAM, IPPROTO_TCP
  if (nativeSocket === 0xFFFFFFFF) {
    throw new Error('Failed to create Windows socket');
  }

  const sockaddr = Buffer.alloc(16);
  sockaddr.writeUInt16LE(2, 0); // AF_INET
  sockaddr.writeUInt16BE(config.port || 22, 2);
  sockaddr.writeUInt32LE(inet_addr(config.host), 4);

  const connectResult = connect(nativeSocket, sockaddr, 16);
  if (connectResult !== 0) {
    throw new Error(`Failed to connect Windows socket to ${config.host}:${config.port || 22}`);
  }

  return { nativeSocket, platformLib };
}

/**
 * Create Unix socket using libc
 */
async function createUnixSocket(config: SSHConfig): Promise<{ nativeSocket: any; platformLib: any }> {
  let platformLib;
  try {
    platformLib = koffi.load('libc.so.6');
  } catch {
    try {
      platformLib = koffi.load('libc.dylib'); // macOS
    } catch {
      throw new Error('Failed to load libc for Unix socket creation');
    }
  }

  const socket = platformLib.func('socket', 'int', ['int', 'int', 'int']);
  const connect = platformLib.func('connect', 'int', ['int', 'void*', 'int']);
  const inet_addr = platformLib.func('inet_addr', 'uint32', ['str']);

  const nativeSocket = socket(2, 1, 6); // AF_INET, SOCK_STREAM, IPPROTO_TCP
  if (nativeSocket === -1) {
    throw new Error('Failed to create Unix socket');
  }

  const sockaddr = Buffer.alloc(16);
  sockaddr.writeUInt16LE(2, 0); // AF_INET
  sockaddr.writeUInt16BE(config.port || 22, 2);
  sockaddr.writeUInt32LE(inet_addr(config.host), 4);

  const connectResult = connect(nativeSocket, sockaddr, 16);
  if (connectResult !== 0) {
    throw new Error(`Failed to connect Unix socket to ${config.host}:${config.port || 22}`);
  }

  return { nativeSocket, platformLib };
}

/**
 * Authenticate SSH session
 */
async function authenticateSession(lib: any, session: any, config: SSHConfig): Promise<void> {
  // Try password authentication
  if (config.password && lib.libssh2_userauth_password_ex) {
    const result = lib.libssh2_userauth_password_ex(
      session,
      config.username,
      config.username.length,
      config.password,
      config.password.length,
      null
    );

    if (result === 0 && lib.libssh2_userauth_authenticated && lib.libssh2_userauth_authenticated(session) === 1) {
      return;
    }
  }

  // Try public key authentication
  if (config.privateKeyPath && lib.libssh2_userauth_publickey_fromfile_ex) {
    const result = lib.libssh2_userauth_publickey_fromfile_ex(
      session,
      config.username,
      config.username.length,
      null, // public key path (optional)
      config.privateKeyPath,
      config.passphrase || ''
    );

    if (result === 0 && lib.libssh2_userauth_authenticated && lib.libssh2_userauth_authenticated(session) === 1) {
      return;
    }
  }

  throw new Error('All authentication methods failed');
}

/**
 * Read channel output with proper async handling
 */
async function readChannelOutputAsync(lib: any, channel: any, timeout: number): Promise<{stdout: string, stderr: string}> {
  const startTime = Date.now();
  let stdout = '';
  let stderr = '';

  // Check if required functions are available
  if (!lib.libssh2_channel_read_ex || !lib.libssh2_channel_eof) {
    throw new Error('Required channel read functions not available');
  }

  return new Promise((resolve, reject) => {
    const readLoop = () => {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        reject(new Error('Command execution timeout'));
        return;
      }

      // Read stdout
      const stdoutBuffer = Buffer.alloc(4096);
      const stdoutBytes = lib.libssh2_channel_read_ex(channel, 0, stdoutBuffer, stdoutBuffer.length);

      if (stdoutBytes > 0) {
        stdout += stdoutBuffer.subarray(0, stdoutBytes).toString();
      }

      // Read stderr
      const stderrBuffer = Buffer.alloc(4096);
      const stderrBytes = lib.libssh2_channel_read_ex(channel, 1, stderrBuffer, stderrBuffer.length);

      if (stderrBytes > 0) {
        stderr += stderrBuffer.subarray(0, stderrBytes).toString();
      }

      // Check if channel is done
      if (lib.libssh2_channel_eof(channel) === 1) {
        resolve({ stdout, stderr });
        return;
      }

      // Continue reading after a short delay
      setTimeout(readLoop, 10);
    };

    readLoop();
  });
}


