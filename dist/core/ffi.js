"use strict";
/**
 * Core FFI bindings for libssh2
 *
 * This module provides the low-level FFI interface to libssh2.
 * Most users should use the high-level SSHClient, SSHShell, or SSHUtils classes instead.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cstr = cstr;
exports.readCString = readCString;
exports.isNull = isNull;
exports.loadlibssh2 = loadlibssh2;
exports.getLibraryInfo = getLibraryInfo;
const koffi = __importStar(require("koffi"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
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
    libssh2_channel_request_pty_size_ex: { result: 'int', parameters: ['void*', 'int', 'int', 'int', 'int'] },
    libssh2_channel_get_exit_status: { result: 'int', parameters: ['void*'] },
};
/**
 * Create a null-terminated C string from a JavaScript string
 *
 * @param str JavaScript string to convert
 * @returns Buffer containing null-terminated C string
 */
function cstr(str) {
    // CRITICAL: Use Buffer.from with null terminator for proper C string compatibility
    // This was the key fix that solved the authentication issues
    const buffer = Buffer.from(str + '\0', 'utf8');
    return buffer;
}
/**
 * Read a C string from a pointer
 *
 * @param ptr Pointer to C string
 * @returns JavaScript string
 */
function readCString(ptr) {
    if (!ptr || isNull(ptr)) {
        return '';
    }
    try {
        // For libssh2, we need to be careful about string reading
        // Some functions return const char* that should not be freed
        const result = koffi.decode(ptr, 'str');
        return result || '';
    }
    catch (error) {
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
function isNull(ptr) {
    return ptr === null || ptr === undefined || ptr === 0;
}
/**
 * Get the path to the libssh2 library
 *
 * @returns Path to libssh2 library
 */
function getLibraryPath() {
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
function loadlibssh2() {
    try {
        const libraryPath = getLibraryPath();
        const lib = koffi.load(libraryPath);
        // Create function bindings
        const functions = {};
        for (const [name, signature] of Object.entries(libssh2Symbols)) {
            try {
                functions[name] = lib.func(name, signature.result, signature.parameters);
            }
            catch (error) {
                console.warn(`Warning: Could not load function ${name}: ${error}`);
                // Some functions might not be available in all libssh2 versions
                // We'll continue without them
            }
        }
        // Add the close method for cleanup
        functions.close = () => {
            try {
                lib.unload();
            }
            catch (error) {
                // Ignore unload errors
            }
        };
        return functions;
    }
    catch (error) {
        throw new Error(`Failed to load libssh2: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Get library information
 *
 * @returns Object containing library version and platform info
 */
function getLibraryInfo() {
    return {
        platform: os.platform(),
        arch: os.arch(),
        libraryPath: getLibraryPath(),
        version: '1.11.2' // Our compiled version
    };
}
//# sourceMappingURL=ffi.js.map