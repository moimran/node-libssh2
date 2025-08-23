/**
 * Core FFI bindings for libssh2
 * 
 * This module provides the low-level FFI interface to libssh2.
 * Most users should use the high-level SSHClient, SSHShell, or SSHUtils classes instead.
 */

import * as koffi from 'koffi';
import * as path from 'path';
import * as os from 'os';

// Type definitions for FFI
export type Pointer<T> = koffi.IKoffiCType;

// libssh2 function signatures
const libssh2Symbols = {
  // Core library functions
  libssh2_init: { result: 'int', parameters: ['int'] },
  libssh2_exit: { result: 'void', parameters: [] },
  libssh2_version: { result: 'void*', parameters: ['int'] },

  // Session management
  libssh2_session_init_ex: { result: 'void*', parameters: ['void*', 'void*', 'void*', 'void*'] },
  libssh2_session_free: { result: 'int', parameters: ['void*'] },
  libssh2_session_set_blocking: { result: 'void', parameters: ['void*', 'int'] },
  libssh2_session_set_timeout: { result: 'void', parameters: ['void*', 'int64'] },
  libssh2_session_get_timeout: { result: 'int64', parameters: ['void*'] },
  libssh2_session_handshake: { result: 'int', parameters: ['void*', 'int'] },
  libssh2_session_disconnect_ex: { result: 'int', parameters: ['void*', 'int', 'str', 'str'] },
  libssh2_session_last_errno: { result: 'int', parameters: ['void*'] },
  libssh2_session_last_error: { result: 'void*', parameters: ['void*', 'void*', 'void*', 'int'] },
  libssh2_session_banner_get: { result: 'void*', parameters: ['void*'] },

  // Authentication
  libssh2_userauth_list: { result: 'void*', parameters: ['void*', 'void*', 'uint32'] },
  libssh2_userauth_authenticated: { result: 'int', parameters: ['void*'] },
  libssh2_userauth_password_ex: { result: 'int', parameters: ['void*', 'void*', 'uint32', 'void*', 'uint32', 'void*'] },

  // Channel operations
  libssh2_channel_open_ex: { result: 'void*', parameters: ['void*', 'str', 'uint32', 'uint32', 'uint32', 'str', 'uint32'] },
  libssh2_channel_process_startup: { result: 'int', parameters: ['void*', 'str', 'uint32', 'str', 'uint32'] },
  libssh2_channel_read_ex: { result: 'int64', parameters: ['void*', 'int', 'void*', 'uint32'] },
  libssh2_channel_write_ex: { result: 'int64', parameters: ['void*', 'int', 'void*', 'uint32'] },
  libssh2_channel_close: { result: 'int', parameters: ['void*'] },
  libssh2_channel_free: { result: 'int', parameters: ['void*'] },
  libssh2_channel_request_pty_ex: { result: 'int', parameters: ['void*', 'str', 'uint32', 'str', 'uint32', 'int', 'int', 'int', 'int'] },
  libssh2_channel_get_exit_status: { result: 'int', parameters: ['void*'] },
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
  
  // On Linux/macOS, try to use system libssh2
  if (platform === 'linux') {
    return 'libssh2.so.1';
  }
  
  if (platform === 'darwin') {
    return 'libssh2.dylib';
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
