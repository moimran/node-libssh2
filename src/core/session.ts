/**
 * Low-level Session class - Direct libssh2 session wrapper
 * 
 * This class provides a thin wrapper around libssh2 session operations
 * without any high-level abstractions or application logic.
 * 
 * Based on ssh2-python's session.pyx structure.
 */

import { loadlibssh2, cstr, isNull, readCString } from './ffi.js';

/**
 * Low-level SSH session wrapper
 * 
 * Provides direct access to libssh2 session functionality without interpretation.
 * All methods return raw libssh2 return codes and data.
 */
export class Session {
  private lib: any = null;
  private session: any = null;
  private socket: number = 0;

  constructor() {
    this.lib = loadlibssh2();
    this.session = this.lib.libssh2_session_init_ex(null, null, null, null);
    if (!this.session || isNull(this.session)) {
      throw new Error('Failed to initialize libssh2 session');
    }
  }

  /**
   * Free session resources
   */
  free(): number {
    if (this.session && !isNull(this.session)) {
      const result = this.lib.libssh2_session_free(this.session);
      this.session = null;
      return result;
    }
    return 0;
  }

  /**
   * Perform SSH handshake on socket
   * @param socket Socket file descriptor
   * @returns libssh2 return code
   */
  handshake(socket: number): number {
    this.socket = socket;
    return this.lib.libssh2_session_handshake(this.session, socket);
  }

  /**
   * Deprecated session startup (use handshake instead)
   * @param socket Socket file descriptor
   * @returns libssh2 return code
   */
  startup(socket: number): number {
    this.socket = socket;
    return this.lib.libssh2_session_startup(this.session, socket);
  }

  /**
   * Disconnect session
   * @param reason Disconnect reason message
   * @returns libssh2 return code
   */
  disconnect(reason: string = 'Normal disconnect'): number {
    return this.lib.libssh2_session_disconnect(this.session, cstr(reason));
  }

  /**
   * Set session blocking mode
   * @param blocking true for blocking, false for non-blocking
   */
  setBlocking(blocking: boolean): void {
    this.lib.libssh2_session_set_blocking(this.session, blocking ? 1 : 0);
  }

  /**
   * Get session blocking mode
   * @returns true if blocking, false if non-blocking
   */
  getBlocking(): boolean {
    return this.lib.libssh2_session_get_blocking(this.session) !== 0;
  }

  /**
   * Set session timeout in milliseconds
   * @param timeout Timeout in milliseconds (0 = no timeout)
   */
  setTimeout(timeout: number): void {
    this.lib.libssh2_session_set_timeout(this.session, timeout);
  }

  /**
   * Get session timeout
   * @returns Timeout in milliseconds
   */
  getTimeout(): number {
    return this.lib.libssh2_session_get_timeout(this.session);
  }

  /**
   * Check if user is authenticated
   * @returns 1 if authenticated, 0 if not
   */
  userauthAuthenticated(): number {
    return this.lib.libssh2_userauth_authenticated(this.session);
  }

  /**
   * Get list of available authentication methods
   * @param username Username to check
   * @returns Comma-separated list of auth methods or null
   */
  userauthList(username: string): string | null {
    const result = this.lib.libssh2_userauth_list(this.session, cstr(username), username.length);
    if (!result || isNull(result)) {
      return null;
    }
    return readCString(result);
  }

  /**
   * Authenticate with password
   * @param username Username
   * @param password Password
   * @returns libssh2 return code
   */
  userauthPassword(username: string, password: string): number {
    return this.lib.libssh2_userauth_password(this.session, cstr(username), cstr(password));
  }

  /**
   * Authenticate with public key from file
   * @param username Username
   * @param publicKeyPath Path to public key file (can be null)
   * @param privateKeyPath Path to private key file
   * @param passphrase Passphrase for private key (empty string if none)
   * @returns libssh2 return code
   */
  userauthPublicKeyFromFile(
    username: string,
    publicKeyPath: string | null,
    privateKeyPath: string,
    passphrase: string = ''
  ): number {
    const pubKey = publicKeyPath ? cstr(publicKeyPath) : null;
    return this.lib.libssh2_userauth_publickey_fromfile(
      this.session,
      cstr(username),
      pubKey,
      cstr(privateKeyPath),
      cstr(passphrase)
    );
  }

  /**
   * Authenticate with public key data from memory
   * @param username Username
   * @param publicKeyData Public key data
   * @returns libssh2 return code
   */
  userauthPublicKey(username: string, publicKeyData: Buffer): number {
    return this.lib.libssh2_userauth_publickey(
      this.session,
      cstr(username),
      publicKeyData,
      publicKeyData.length,
      null,
      null
    );
  }

  /**
   * Authenticate with public key from memory
   * @param username Username
   * @param privateKeyData Private key file data
   * @param passphrase Passphrase for private key
   * @param publicKeyData Public key file data (optional)
   * @returns libssh2 return code
   */
  userauthPublicKeyFromMemory(
    username: string,
    privateKeyData: Buffer,
    passphrase: string = '',
    publicKeyData?: Buffer
  ): number {
    const pubKeyPtr = publicKeyData || null;
    const pubKeyLen = publicKeyData ? publicKeyData.length : 0;

    return this.lib.libssh2_userauth_publickey_frommemory(
      this.session,
      cstr(username),
      username.length,
      pubKeyPtr,
      pubKeyLen,
      privateKeyData,
      privateKeyData.length,
      cstr(passphrase)
    );
  }

  /**
   * Authenticate with host-based authentication
   * @param username Username
   * @param privateKeyPath Path to private key file
   * @param hostname Hostname for host-based auth
   * @param publicKeyPath Path to public key file (optional)
   * @param passphrase Passphrase for private key
   * @returns libssh2 return code
   */
  userauthHostBasedFromFile(
    username: string,
    privateKeyPath: string,
    hostname: string,
    publicKeyPath?: string,
    passphrase: string = ''
  ): number {
    const pubKey = publicKeyPath ? cstr(publicKeyPath) : null;
    return this.lib.libssh2_userauth_hostbased_fromfile(
      this.session,
      cstr(username),
      pubKey,
      cstr(privateKeyPath),
      cstr(passphrase),
      cstr(hostname)
    );
  }

  /**
   * Authenticate with keyboard-interactive authentication
   * @param username Username
   * @param callback Callback function for prompts
   * @returns libssh2 return code
   */
  userauthKeyboardInteractive(username: string, callback: () => string): number {
    // Note: This is a simplified implementation
    // The actual implementation would need to handle the callback properly
    return this.lib.libssh2_userauth_keyboard_interactive(
      this.session,
      cstr(username),
      null // Callback handling would be more complex
    );
  }

  /**
   * Open a new channel session
   * @returns Raw channel pointer or null on failure
   */
  openSession(): any | null {
    const channel = this.lib.libssh2_channel_open_session(this.session);
    if (!channel || isNull(channel)) {
      return null;
    }
    return channel;
  }

  /**
   * Open a direct TCP/IP channel
   * @param host Target host
   * @param port Target port
   * @param sourceHost Source host (optional)
   * @param sourcePort Source port (optional)
   * @returns Raw channel pointer or null on failure
   */
  directTcpIp(host: string, port: number, sourceHost: string = '127.0.0.1', sourcePort: number = 22): any | null {
    const channel = this.lib.libssh2_channel_direct_tcpip_ex(
      this.session,
      cstr(host),
      port,
      cstr(sourceHost),
      sourcePort
    );
    if (!channel || isNull(channel)) {
      return null;
    }
    return channel;
  }

  /**
   * Get last error number
   * @returns libssh2 error code
   */
  lastErrno(): number {
    return this.lib.libssh2_session_last_errno(this.session);
  }

  /**
   * Get last error message
   * @returns Error message string or empty string
   */
  lastError(): string {
    const errorPtr = Buffer.alloc(1024);
    const lengthPtr = Buffer.alloc(4);
    const result = this.lib.libssh2_session_last_error(this.session, errorPtr, lengthPtr, 1);
    
    if (result === 0) {
      const length = lengthPtr.readInt32LE(0);
      if (length > 0) {
        return errorPtr.subarray(0, length).toString();
      }
    }
    return '';
  }

  /**
   * Get session banner
   * @returns Banner string or null
   */
  getBanner(): string | null {
    const result = this.lib.libssh2_session_banner_get(this.session);
    if (!result || isNull(result)) {
      return null;
    }
    return readCString(result);
  }

  /**
   * Get host key hash
   * @param hashType Hash type (LIBSSH2_HOSTKEY_HASH_*)
   * @returns Hash bytes or null
   */
  hostkeyHash(hashType: number): Buffer | null {
    const result = this.lib.libssh2_hostkey_hash(this.session, hashType);
    if (!result || isNull(result)) {
      return null;
    }
    
    // Hash length depends on type
    let length: number;
    switch (hashType) {
      case 1: // MD5
        length = 16;
        break;
      case 2: // SHA1
        length = 20;
        break;
      case 3: // SHA256
        length = 32;
        break;
      default:
        return null;
    }
    
    return Buffer.from(result as any, length);
  }

  /**
   * Get host key and type
   * @returns [key_data, key_type] or null
   */
  hostkey(): [Buffer, number] | null {
    const lengthPtr = Buffer.alloc(8);
    const typePtr = Buffer.alloc(4);
    const result = this.lib.libssh2_session_hostkey(this.session, lengthPtr, typePtr);
    
    if (!result || isNull(result)) {
      return null;
    }
    
    const length = lengthPtr.readBigUInt64LE(0);
    const type = typePtr.readInt32LE(0);
    const keyData = Buffer.from(result as any, Number(length));
    
    return [keyData, type];
  }

  /**
   * Get block directions for non-blocking operations
   * @returns Block direction flags
   */
  blockDirections(): number {
    return this.lib.libssh2_session_block_directions(this.session);
  }

  /**
   * Configure keep alive settings
   * @param wantReply Whether to request reply from server
   * @param interval Keep alive interval in seconds (0 to disable)
   */
  keepaliveConfig(wantReply: boolean, interval: number): void {
    this.lib.libssh2_keepalive_config(this.session, wantReply ? 1 : 0, interval);
  }

  /**
   * Send keep alive message
   * @returns Seconds until next keep alive should be sent
   */
  keepaliveSend(): number {
    const secondsPtr = Buffer.alloc(4);
    const result = this.lib.libssh2_keepalive_send(this.session, secondsPtr);
    if (result === 0) {
      return secondsPtr.readInt32LE(0);
    }
    return result; // Error code
  }

  /**
   * Get raw session pointer (for advanced use)
   * @returns Raw session pointer
   */
  getSessionPointer(): any {
    return this.session;
  }

  /**
   * Initialize SFTP subsystem
   * @returns Raw SFTP pointer or null on failure
   */
  sftpInit(): any | null {
    const sftp = this.lib.libssh2_sftp_init(this.session);
    if (!sftp || isNull(sftp)) {
      return null;
    }
    return sftp;
  }

  /**
   * Receive file via SCP
   * @param path Remote file path
   * @returns [channel, fileinfo] or null on failure
   */
  scpRecv2(path: string): [any, any] | null {
    const fileInfo = Buffer.alloc(64); // Placeholder for file info structure
    const channel = this.lib.libssh2_scp_recv2(this.session, cstr(path), fileInfo);
    if (!channel || isNull(channel)) {
      return null;
    }
    return [channel, fileInfo];
  }

  /**
   * Send file via SCP
   * @param path Remote file path
   * @param mode File mode
   * @param size File size
   * @param mtime Modification time
   * @param atime Access time
   * @returns Raw channel pointer or null on failure
   */
  scpSend64(path: string, mode: number, size: number, mtime: number = 0, atime: number = 0): any | null {
    const channel = this.lib.libssh2_scp_send64(this.session, cstr(path), mode, size, mtime, atime);
    if (!channel || isNull(channel)) {
      return null;
    }
    return channel;
  }

  /**
   * Create port forwarding listener
   * @param port Port to listen on
   * @returns Raw listener pointer or null on failure
   */
  forwardListen(port: number): any | null {
    const listener = this.lib.libssh2_channel_forward_listen(this.session, port);
    if (!listener || isNull(listener)) {
      return null;
    }
    return listener;
  }

  /**
   * Create port forwarding listener with extended options
   * @param host Host to bind to (null for all interfaces)
   * @param port Port to listen on (0 for dynamic)
   * @param boundPort Output parameter for actual bound port
   * @param queueMaxSize Maximum queue size
   * @returns [listener, bound_port] or null on failure
   */
  forwardListenEx(host: string | null, port: number, boundPort: Buffer, queueMaxSize: number): [any, number] | null {
    const hostPtr = host ? cstr(host) : null;
    const listener = this.lib.libssh2_channel_forward_listen_ex(
      this.session,
      hostPtr,
      port,
      boundPort,
      queueMaxSize
    );
    if (!listener || isNull(listener)) {
      return null;
    }
    const actualPort = boundPort.readInt32LE(0);
    return [listener, actualPort];
  }

  /**
   * Get supported algorithms for method type
   * @param methodType Method type constant
   * @returns Array of algorithm names or null
   */
  supportedAlgs(methodType: number): string[] | null {
    const algsPtr = Buffer.alloc(8);
    const count = this.lib.libssh2_session_supported_algs(this.session, methodType, algsPtr);
    if (count <= 0) {
      return null;
    }

    // This would need proper pointer handling to extract string array
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Get currently active algorithm for method type
   * @param methodType Method type constant
   * @returns Algorithm name or null
   */
  methods(methodType: number): string | null {
    const result = this.lib.libssh2_session_methods(this.session, methodType);
    if (!result || isNull(result)) {
      return null;
    }
    return readCString(result);
  }

  /**
   * Set algorithm preference for method type
   * @param methodType Method type constant
   * @param prefs Comma-separated algorithm preferences
   * @returns libssh2 return code
   */
  methodPref(methodType: number, prefs: string): number {
    return this.lib.libssh2_session_method_pref(this.session, methodType, cstr(prefs));
  }

  /**
   * Set last error
   * @param errorCode Error code
   * @param errorMessage Error message
   * @returns libssh2 return code
   */
  setLastError(errorCode: number, errorMessage: string): number {
    return this.lib.libssh2_session_set_last_error(this.session, errorCode, cstr(errorMessage));
  }

  /**
   * Get socket file descriptor
   * @returns Socket file descriptor
   */
  getSocket(): number {
    return this.socket;
  }
}
