/**
 * Core FFI bindings for libssh2
 * 
 * This module provides the low-level FFI interface to libssh2.
 * Most users should use the high-level SSHClient, SSHShell, or SSHUtils classes instead.
 */

import * as koffi from 'koffi';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// Type definitions for FFI
export type Pointer<T> = koffi.IKoffiCType;

// libssh2 error codes - raw constants without interpretation
export const LIBSSH2_ERROR_NONE = 0;
export const LIBSSH2_ERROR_SOCKET_NONE = -1;
export const LIBSSH2_ERROR_BANNER_RECV = -2;
export const LIBSSH2_ERROR_BANNER_SEND = -3;
export const LIBSSH2_ERROR_INVALID_MAC = -4;
export const LIBSSH2_ERROR_KEX_FAILURE = -5;
export const LIBSSH2_ERROR_ALLOC = -6;
export const LIBSSH2_ERROR_SOCKET_SEND = -7;
export const LIBSSH2_ERROR_KEY_EXCHANGE_FAILURE = -8;
export const LIBSSH2_ERROR_TIMEOUT = -9;
export const LIBSSH2_ERROR_HOSTKEY_INIT = -10;
export const LIBSSH2_ERROR_HOSTKEY_SIGN = -11;
export const LIBSSH2_ERROR_DECRYPT = -12;
export const LIBSSH2_ERROR_SOCKET_DISCONNECT = -13;
export const LIBSSH2_ERROR_PROTO = -14;
export const LIBSSH2_ERROR_PASSWORD_EXPIRED = -15;
export const LIBSSH2_ERROR_FILE = -16;
export const LIBSSH2_ERROR_METHOD_NONE = -17;
export const LIBSSH2_ERROR_AUTHENTICATION_FAILED = -18;
export const LIBSSH2_ERROR_PUBLICKEY_UNVERIFIED = -19;
export const LIBSSH2_ERROR_CHANNEL_OUTOFORDER = -20;
export const LIBSSH2_ERROR_CHANNEL_FAILURE = -21;
export const LIBSSH2_ERROR_CHANNEL_REQUEST_DENIED = -22;
export const LIBSSH2_ERROR_CHANNEL_UNKNOWN = -23;
export const LIBSSH2_ERROR_CHANNEL_WINDOW_EXCEEDED = -24;
export const LIBSSH2_ERROR_CHANNEL_PACKET_EXCEEDED = -25;
export const LIBSSH2_ERROR_CHANNEL_CLOSED = -26;
export const LIBSSH2_ERROR_CHANNEL_EOF_SENT = -27;
export const LIBSSH2_ERROR_SCP_PROTOCOL = -28;
export const LIBSSH2_ERROR_ZLIB = -29;
export const LIBSSH2_ERROR_SOCKET_TIMEOUT = -30;
export const LIBSSH2_ERROR_SFTP_PROTOCOL = -31;
export const LIBSSH2_ERROR_REQUEST_DENIED = -32;
export const LIBSSH2_ERROR_METHOD_NOT_SUPPORTED = -33;
export const LIBSSH2_ERROR_INVAL = -34;
export const LIBSSH2_ERROR_INVALID_POLL_TYPE = -35;
export const LIBSSH2_ERROR_PUBLICKEY_PROTOCOL = -36;
export const LIBSSH2_ERROR_EAGAIN = -37;
export const LIBSSH2_ERROR_BUFFER_TOO_SMALL = -38;
export const LIBSSH2_ERROR_BAD_USE = -39;
export const LIBSSH2_ERROR_COMPRESS = -40;
export const LIBSSH2_ERROR_OUT_OF_BOUNDARY = -41;
export const LIBSSH2_ERROR_AGENT_PROTOCOL = -42;
export const LIBSSH2_ERROR_SOCKET_RECV = -43;
export const LIBSSH2_ERROR_ENCRYPT = -44;
export const LIBSSH2_ERROR_BAD_SOCKET = -45;
export const LIBSSH2_ERROR_KNOWN_HOSTS = -46;

// libssh2 session block directions
export const LIBSSH2_SESSION_BLOCK_INBOUND = 0x0001;
export const LIBSSH2_SESSION_BLOCK_OUTBOUND = 0x0002;

// libssh2 hostkey hash types
export const LIBSSH2_HOSTKEY_HASH_MD5 = 1;
export const LIBSSH2_HOSTKEY_HASH_SHA1 = 2;
export const LIBSSH2_HOSTKEY_HASH_SHA256 = 3;

// libssh2 hostkey types
export const LIBSSH2_HOSTKEY_TYPE_UNKNOWN = 0;
export const LIBSSH2_HOSTKEY_TYPE_RSA = 1;
export const LIBSSH2_HOSTKEY_TYPE_DSS = 2;
export const LIBSSH2_HOSTKEY_TYPE_ECDSA_256 = 3;
export const LIBSSH2_HOSTKEY_TYPE_ECDSA_384 = 4;
export const LIBSSH2_HOSTKEY_TYPE_ECDSA_521 = 5;
export const LIBSSH2_HOSTKEY_TYPE_ED25519 = 6;

// libssh2 extended data types
export const SSH_EXTENDED_DATA_STDERR = 1;

// libssh2 function signatures - complete set for low-level wrapper
const libssh2Symbols = {
  // Core library functions
  libssh2_init: { result: 'int', parameters: ['int'] },
  libssh2_exit: { result: 'void', parameters: [] },
  libssh2_version: { result: 'void*', parameters: ['int'] },

  // Session management (only functions that actually exist)
  libssh2_session_init_ex: { result: 'void*', parameters: ['void*', 'void*', 'void*', 'void*'] },
  libssh2_session_free: { result: 'int', parameters: ['void*'] },
  libssh2_session_set_blocking: { result: 'void', parameters: ['void*', 'int'] },
  libssh2_session_get_blocking: { result: 'int', parameters: ['void*'] },
  libssh2_session_set_timeout: { result: 'void', parameters: ['void*', 'int64'] },
  libssh2_session_get_timeout: { result: 'int64', parameters: ['void*'] },
  libssh2_session_handshake: { result: 'int', parameters: ['void*', 'int'] },
  libssh2_session_disconnect_ex: { result: 'int', parameters: ['void*', 'int', 'str', 'str'] },
  // libssh2_session_disconnect: REMOVED - doesn't exist, use _ex version
  libssh2_session_last_errno: { result: 'int', parameters: ['void*'] },
  libssh2_session_last_error: { result: 'int', parameters: ['void*', 'void*', 'void*', 'int'] },
  libssh2_session_set_last_error: { result: 'int', parameters: ['void*', 'int', 'str'] },
  libssh2_session_banner_get: { result: 'void*', parameters: ['void*'] },
  libssh2_session_banner_set: { result: 'int', parameters: ['void*', 'str'] },
  libssh2_session_startup: { result: 'int', parameters: ['void*', 'int'] },
  libssh2_session_block_directions: { result: 'int', parameters: ['void*'] },
  libssh2_session_hostkey: { result: 'void*', parameters: ['void*', 'void*', 'void*'] },

  // Authentication (only functions that actually exist)
  libssh2_userauth_list: { result: 'void*', parameters: ['void*', 'str', 'uint32'] },
  libssh2_userauth_authenticated: { result: 'int', parameters: ['void*'] },
  libssh2_userauth_password_ex: { result: 'int', parameters: ['void*', 'str', 'uint32', 'str', 'uint32', 'void*'] },
  // libssh2_userauth_password: REMOVED - doesn't exist, use _ex version
  libssh2_userauth_publickey_fromfile_ex: { result: 'int', parameters: ['void*', 'str', 'uint32', 'str', 'str', 'str'] },
  // libssh2_userauth_publickey_fromfile: REMOVED - doesn't exist, use _ex version
  libssh2_userauth_publickey: { result: 'int', parameters: ['void*', 'str', 'void*', 'uint32', 'void*', 'void*'] },
  libssh2_userauth_publickey_frommemory: { result: 'int', parameters: ['void*', 'str', 'uint32', 'void*', 'uint32', 'void*', 'uint32', 'str'] },
  // libssh2_userauth_hostbased_fromfile: REMOVED - doesn't exist, use _ex version
  libssh2_userauth_hostbased_fromfile_ex: { result: 'int', parameters: ['void*', 'str', 'uint32', 'str', 'str', 'str', 'str'] },
  // libssh2_userauth_keyboard_interactive: REMOVED - doesn't exist, use _ex version
  libssh2_userauth_keyboard_interactive_ex: { result: 'int', parameters: ['void*', 'str', 'uint32', 'void*'] },

  // Channel operations (only functions that actually exist)
  libssh2_channel_open_ex: { result: 'void*', parameters: ['void*', 'str', 'uint32', 'uint32', 'uint32', 'str', 'uint32'] },
  // libssh2_channel_open_session: REMOVED - doesn't exist, use _ex version
  libssh2_channel_direct_tcpip_ex: { result: 'void*', parameters: ['void*', 'str', 'int', 'str', 'int'] },
  libssh2_channel_process_startup: { result: 'int', parameters: ['void*', 'str', 'uint32', 'str', 'uint32'] },
  // libssh2_channel_shell: REMOVED - doesn't exist, use process_startup
  // libssh2_channel_exec: REMOVED - doesn't exist, use process_startup
  // libssh2_channel_subsystem: REMOVED - doesn't exist, use process_startup
  libssh2_channel_read_ex: { result: 'int64', parameters: ['void*', 'int', 'void*', 'uint32'] },
  // libssh2_channel_read: REMOVED - doesn't exist, use _ex version
  // libssh2_channel_read_stderr: REMOVED - doesn't exist, use _ex version
  libssh2_channel_write_ex: { result: 'int64', parameters: ['void*', 'int', 'void*', 'uint32'] },
  // libssh2_channel_write: REMOVED - doesn't exist, use _ex version
  // libssh2_channel_write_stderr: REMOVED - doesn't exist, use _ex version
  libssh2_channel_flush_ex: { result: 'int', parameters: ['void*', 'int'] },
  // libssh2_channel_flush: REMOVED - doesn't exist, use _ex version
  // libssh2_channel_flush_stderr: REMOVED - doesn't exist, use _ex version
  libssh2_channel_close: { result: 'int', parameters: ['void*'] },
  libssh2_channel_wait_closed: { result: 'int', parameters: ['void*'] },
  libssh2_channel_free: { result: 'int', parameters: ['void*'] },
  libssh2_channel_eof: { result: 'int', parameters: ['void*'] },
  libssh2_channel_send_eof: { result: 'int', parameters: ['void*'] },
  libssh2_channel_wait_eof: { result: 'int', parameters: ['void*'] },
  libssh2_channel_get_exit_status: { result: 'int', parameters: ['void*'] },
  libssh2_channel_get_exit_signal: { result: 'int', parameters: ['void*', 'void*', 'void*', 'void*', 'void*', 'void*', 'void*'] },
  libssh2_channel_signal_ex: { result: 'int', parameters: ['void*', 'str', 'uint32'] },
  libssh2_channel_request_pty_ex: { result: 'int', parameters: ['void*', 'str', 'uint32', 'str', 'uint32', 'int', 'int', 'int', 'int'] },
  // libssh2_channel_request_pty: REMOVED - doesn't exist, use _ex version
  libssh2_channel_request_pty_size_ex: { result: 'int', parameters: ['void*', 'int', 'int', 'int', 'int'] },
  // libssh2_channel_request_pty_size: REMOVED - doesn't exist, use _ex version
  libssh2_channel_setenv_ex: { result: 'int', parameters: ['void*', 'str', 'uint32', 'str', 'uint32'] },
  // libssh2_channel_setenv: REMOVED - doesn't exist, use _ex version

  // Channel window management
  // libssh2_channel_window_read: REMOVED - doesn't exist
  // libssh2_channel_window_write: REMOVED - doesn't exist
  libssh2_channel_window_read_ex: { result: 'uint64', parameters: ['void*', 'void*', 'void*'] },
  libssh2_channel_window_write_ex: { result: 'uint64', parameters: ['void*', 'void*'] },
  libssh2_channel_receive_window_adjust: { result: 'uint64', parameters: ['void*', 'uint64', 'uint64'] },
  libssh2_channel_receive_window_adjust2: { result: 'uint64', parameters: ['void*', 'uint64', 'uint64', 'void*'] },

  // X11 forwarding
  // libssh2_channel_x11_req: REMOVED - doesn't exist
  libssh2_channel_x11_req_ex: { result: 'int', parameters: ['void*', 'int', 'str', 'str', 'int'] },

  // Extended data handling
  libssh2_channel_handle_extended_data: { result: 'void', parameters: ['void*', 'int'] },
  libssh2_channel_handle_extended_data2: { result: 'int', parameters: ['void*', 'int'] },

  // SSH agent forwarding
  libssh2_channel_request_auth_agent: { result: 'int', parameters: ['void*'] },

  // Host key and known hosts
  // libssh2_session_hostkey: DUPLICATE REMOVED - already defined above
  libssh2_hostkey_hash: { result: 'void*', parameters: ['void*', 'int'] },
  libssh2_knownhost_init: { result: 'void*', parameters: ['void*'] },
  libssh2_knownhost_free: { result: 'void', parameters: ['void*'] },

  // Keep alive
  libssh2_keepalive_config: { result: 'void', parameters: ['void*', 'int', 'uint32'] },
  libssh2_keepalive_send: { result: 'int', parameters: ['void*', 'void*'] },

  // SFTP
  libssh2_sftp_init: { result: 'void*', parameters: ['void*'] },
  libssh2_sftp_shutdown: { result: 'int', parameters: ['void*'] },
  libssh2_sftp_get_channel: { result: 'void*', parameters: ['void*'] },
  libssh2_sftp_open_ex: { result: 'void*', parameters: ['void*', 'str', 'uint32', 'uint64', 'int64', 'int'] },
  // libssh2_sftp_open: REMOVED - doesn't exist, use _ex version
  // libssh2_sftp_opendir: REMOVED - doesn't exist
  libssh2_sftp_close_handle: { result: 'int', parameters: ['void*'] },
  libssh2_sftp_read: { result: 'int64', parameters: ['void*', 'void*', 'uint32'] },
  libssh2_sftp_write: { result: 'int64', parameters: ['void*', 'void*', 'uint32'] },
  libssh2_sftp_readdir_ex: { result: 'int', parameters: ['void*', 'void*', 'uint32', 'void*', 'uint32', 'void*'] },
  // libssh2_sftp_readdir: REMOVED - doesn't exist, use _ex version
  libssh2_sftp_rename_ex: { result: 'int', parameters: ['void*', 'str', 'uint32', 'str', 'uint32', 'int64'] },
  // libssh2_sftp_rename: REMOVED - doesn't exist, use _ex version
  // libssh2_sftp_unlink: REMOVED - doesn't exist
  // libssh2_sftp_mkdir: REMOVED - doesn't exist
  // libssh2_sftp_rmdir: REMOVED - doesn't exist
  // libssh2_sftp_stat: REMOVED - doesn't exist
  // libssh2_sftp_lstat: REMOVED - doesn't exist
  // libssh2_sftp_setstat: REMOVED - doesn't exist
  // libssh2_sftp_symlink: REMOVED - doesn't exist
  // libssh2_sftp_realpath: REMOVED - doesn't exist
  libssh2_sftp_statvfs: { result: 'int', parameters: ['void*', 'str', 'uint32', 'void*'] },
  libssh2_sftp_fstat_ex: { result: 'int', parameters: ['void*', 'void*', 'int'] },
  // libssh2_sftp_fstat: REMOVED - doesn't exist, use _ex version
  // libssh2_sftp_fsetstat: REMOVED - doesn't exist
  libssh2_sftp_fstatvfs: { result: 'int', parameters: ['void*', 'void*'] },
  libssh2_sftp_fsync: { result: 'int', parameters: ['void*'] },
  libssh2_sftp_seek: { result: 'void', parameters: ['void*', 'uint32'] },
  libssh2_sftp_seek64: { result: 'void', parameters: ['void*', 'uint64'] },
  // libssh2_sftp_rewind: REMOVED - doesn't exist
  libssh2_sftp_tell: { result: 'uint32', parameters: ['void*'] },
  libssh2_sftp_tell64: { result: 'uint64', parameters: ['void*'] },
  libssh2_sftp_last_error: { result: 'uint64', parameters: ['void*'] },

  // SCP
  libssh2_scp_recv2: { result: 'void*', parameters: ['void*', 'str', 'void*'] },
  libssh2_scp_send64: { result: 'void*', parameters: ['void*', 'str', 'int', 'uint64', 'int64', 'int64'] },

  // Port forwarding
  // libssh2_channel_forward_listen: REMOVED - doesn't exist, use _ex version
  libssh2_channel_forward_listen_ex: { result: 'void*', parameters: ['void*', 'str', 'int', 'void*', 'int'] },
  libssh2_channel_forward_accept: { result: 'void*', parameters: ['void*'] },
  libssh2_channel_forward_cancel: { result: 'int', parameters: ['void*'] },

  // Algorithm management
  libssh2_session_supported_algs: { result: 'int', parameters: ['void*', 'int', 'void*'] },
  libssh2_session_methods: { result: 'str', parameters: ['void*', 'int'] },
  libssh2_session_method_pref: { result: 'int', parameters: ['void*', 'int', 'str'] },

  // SSH Agent
  libssh2_agent_init: { result: 'void*', parameters: ['void*'] },
  libssh2_agent_free: { result: 'void', parameters: ['void*'] },
  libssh2_agent_connect: { result: 'int', parameters: ['void*'] },
  libssh2_agent_disconnect: { result: 'int', parameters: ['void*'] },
  libssh2_agent_list_identities: { result: 'int', parameters: ['void*'] },
  libssh2_agent_get_identity: { result: 'int', parameters: ['void*', 'void*', 'void*'] },
  libssh2_agent_userauth: { result: 'int', parameters: ['void*', 'str', 'void*'] },
  libssh2_agent_get_identity_path: { result: 'str', parameters: ['void*'] },
  libssh2_agent_set_identity_path: { result: 'void', parameters: ['void*', 'str'] },

  // Known Hosts (extended functions)
  libssh2_knownhost_addc: { result: 'int', parameters: ['void*', 'str', 'void*', 'void*', 'uint32', 'str', 'uint32', 'int', 'void*'] },
  libssh2_knownhost_checkp: { result: 'int', parameters: ['void*', 'str', 'int', 'void*', 'uint32', 'int', 'void*'] },
  libssh2_knownhost_del: { result: 'int', parameters: ['void*', 'void*'] },
  libssh2_knownhost_readline: { result: 'int', parameters: ['void*', 'str', 'uint32', 'int'] },
  libssh2_knownhost_readfile: { result: 'int', parameters: ['void*', 'str', 'int'] },
  libssh2_knownhost_writeline: { result: 'int', parameters: ['void*', 'void*', 'void*', 'uint32', 'void*', 'int'] },
  libssh2_knownhost_writefile: { result: 'int', parameters: ['void*', 'str', 'int'] },
  libssh2_knownhost_get: { result: 'int', parameters: ['void*', 'void*', 'void*'] },

  // Memory management
  libssh2_free: { result: 'void', parameters: ['void*', 'void*'] },
};

/**
 * Create a null-terminated C string from a JavaScript string
 * 
 * @param str JavaScript string to convert
 * @returns Buffer containing null-terminated C string
 */
export function cstr(str: string): Pointer<number> {
  // CRITICAL: Use Buffer.from with null terminator for proper C string compatibility
  // This was the key fix that solved the authentication issues
  const buffer = Buffer.from(str + '\0', 'utf8');
  return buffer as unknown as Pointer<number>;
}

/**
 * Read a C string from a pointer
 * 
 * @param ptr Pointer to C string
 * @returns JavaScript string
 */
export function readCString(ptr: Pointer<number>): string {
  if (!ptr || isNull(ptr)) {
    return '';
  }
  try {
    // For libssh2, we need to be careful about string reading
    // Some functions return const char* that should not be freed
    const result = koffi.decode(ptr as any, 'str');
    return result || '';
  } catch (error) {
    // If koffi.decode fails, the pointer might be invalid or null
    return '';
  }
}

/**
 * Check if a pointer is null
 * 
 * @param ptr Pointer to check
 * @returns true if pointer is null
 */
export function isNull(ptr: any): boolean {
  return ptr === null || ptr === undefined || ptr === 0;
}

/**
 * Get the path to the libssh2 library
 * 
 * @returns Path to libssh2 library
 */
function getLibraryPath(): string {
  const platform = os.platform();
  const arch = os.arch();
  
  // For now, we include Windows x64 library
  // Future versions can include other platforms
  if (platform === 'win32' && arch === 'x64') {
    return path.join(__dirname, '../../libs/windows/libssh2.dll');
  }
  
  // On Linux, try bundled library first, then system library
  if (platform === 'linux') {
    const bundledPath = path.join(__dirname, '../../libs/linux/x64/libssh2.so.1.0.1');
    if (fs.existsSync(bundledPath)) {
      return bundledPath;
    }
    return 'libssh2.so.1'; // Fallback to system library
  }

  // On macOS, try bundled library first, then system library
  if (platform === 'darwin') {
    const bundledPath = path.join(__dirname, '../../libs/macos/x64/libssh2.dylib');
    if (fs.existsSync(bundledPath)) {
      return bundledPath;
    }
    return 'libssh2.dylib'; // Fallback to system library
  }
  
  throw new Error(`Unsupported platform: ${platform} ${arch}`);
}

/**
 * Load libssh2 library and create function bindings
 * 
 * @returns Object containing all libssh2 functions
 */
export function loadlibssh2(): any {
  try {
    const libraryPath = getLibraryPath();
    const lib = koffi.load(libraryPath);
    
    // Create function bindings
    const functions: any = {};
    
    for (const [name, signature] of Object.entries(libssh2Symbols)) {
      try {
        functions[name] = lib.func(name, signature.result, signature.parameters);
      } catch (error) {
        console.warn(`Warning: Could not load function ${name}: ${error}`);
        // Some functions might not be available in all libssh2 versions
        // We'll continue without them
      }
    }
    
    // Add the close method for cleanup
    functions.close = () => {
      try {
        lib.unload();
      } catch (error) {
        // Ignore unload errors
      }
    };
    
    return functions;
    
  } catch (error) {
    throw new Error(`Failed to load libssh2: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get library information
 * 
 * @returns Object containing library version and platform info
 */
export function getLibraryInfo(): {
  platform: string;
  arch: string;
  libraryPath: string;
  version: string;
} {
  return {
    platform: os.platform(),
    arch: os.arch(),
    libraryPath: getLibraryPath(),
    version: '1.11.2' // Our compiled version
  };
}
