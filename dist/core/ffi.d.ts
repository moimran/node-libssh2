/**
 * Core FFI bindings for libssh2
 *
 * This module provides the low-level FFI interface to libssh2.
 * Most users should use the high-level SSHClient, SSHShell, or SSHUtils classes instead.
 */
import * as koffi from 'koffi';
export type Pointer<T> = koffi.IKoffiCType;
export declare const LIBSSH2_ERROR_NONE = 0;
export declare const LIBSSH2_ERROR_SOCKET_NONE = -1;
export declare const LIBSSH2_ERROR_BANNER_RECV = -2;
export declare const LIBSSH2_ERROR_BANNER_SEND = -3;
export declare const LIBSSH2_ERROR_INVALID_MAC = -4;
export declare const LIBSSH2_ERROR_KEX_FAILURE = -5;
export declare const LIBSSH2_ERROR_ALLOC = -6;
export declare const LIBSSH2_ERROR_SOCKET_SEND = -7;
export declare const LIBSSH2_ERROR_KEY_EXCHANGE_FAILURE = -8;
export declare const LIBSSH2_ERROR_TIMEOUT = -9;
export declare const LIBSSH2_ERROR_HOSTKEY_INIT = -10;
export declare const LIBSSH2_ERROR_HOSTKEY_SIGN = -11;
export declare const LIBSSH2_ERROR_DECRYPT = -12;
export declare const LIBSSH2_ERROR_SOCKET_DISCONNECT = -13;
export declare const LIBSSH2_ERROR_PROTO = -14;
export declare const LIBSSH2_ERROR_PASSWORD_EXPIRED = -15;
export declare const LIBSSH2_ERROR_FILE = -16;
export declare const LIBSSH2_ERROR_METHOD_NONE = -17;
export declare const LIBSSH2_ERROR_AUTHENTICATION_FAILED = -18;
export declare const LIBSSH2_ERROR_PUBLICKEY_UNVERIFIED = -19;
export declare const LIBSSH2_ERROR_CHANNEL_OUTOFORDER = -20;
export declare const LIBSSH2_ERROR_CHANNEL_FAILURE = -21;
export declare const LIBSSH2_ERROR_CHANNEL_REQUEST_DENIED = -22;
export declare const LIBSSH2_ERROR_CHANNEL_UNKNOWN = -23;
export declare const LIBSSH2_ERROR_CHANNEL_WINDOW_EXCEEDED = -24;
export declare const LIBSSH2_ERROR_CHANNEL_PACKET_EXCEEDED = -25;
export declare const LIBSSH2_ERROR_CHANNEL_CLOSED = -26;
export declare const LIBSSH2_ERROR_CHANNEL_EOF_SENT = -27;
export declare const LIBSSH2_ERROR_SCP_PROTOCOL = -28;
export declare const LIBSSH2_ERROR_ZLIB = -29;
export declare const LIBSSH2_ERROR_SOCKET_TIMEOUT = -30;
export declare const LIBSSH2_ERROR_SFTP_PROTOCOL = -31;
export declare const LIBSSH2_ERROR_REQUEST_DENIED = -32;
export declare const LIBSSH2_ERROR_METHOD_NOT_SUPPORTED = -33;
export declare const LIBSSH2_ERROR_INVAL = -34;
export declare const LIBSSH2_ERROR_INVALID_POLL_TYPE = -35;
export declare const LIBSSH2_ERROR_PUBLICKEY_PROTOCOL = -36;
export declare const LIBSSH2_ERROR_EAGAIN = -37;
export declare const LIBSSH2_ERROR_BUFFER_TOO_SMALL = -38;
export declare const LIBSSH2_ERROR_BAD_USE = -39;
export declare const LIBSSH2_ERROR_COMPRESS = -40;
export declare const LIBSSH2_ERROR_OUT_OF_BOUNDARY = -41;
export declare const LIBSSH2_ERROR_AGENT_PROTOCOL = -42;
export declare const LIBSSH2_ERROR_SOCKET_RECV = -43;
export declare const LIBSSH2_ERROR_ENCRYPT = -44;
export declare const LIBSSH2_ERROR_BAD_SOCKET = -45;
export declare const LIBSSH2_ERROR_KNOWN_HOSTS = -46;
export declare const LIBSSH2_SESSION_BLOCK_INBOUND = 1;
export declare const LIBSSH2_SESSION_BLOCK_OUTBOUND = 2;
export declare const LIBSSH2_HOSTKEY_HASH_MD5 = 1;
export declare const LIBSSH2_HOSTKEY_HASH_SHA1 = 2;
export declare const LIBSSH2_HOSTKEY_HASH_SHA256 = 3;
export declare const LIBSSH2_HOSTKEY_TYPE_UNKNOWN = 0;
export declare const LIBSSH2_HOSTKEY_TYPE_RSA = 1;
export declare const LIBSSH2_HOSTKEY_TYPE_DSS = 2;
export declare const LIBSSH2_HOSTKEY_TYPE_ECDSA_256 = 3;
export declare const LIBSSH2_HOSTKEY_TYPE_ECDSA_384 = 4;
export declare const LIBSSH2_HOSTKEY_TYPE_ECDSA_521 = 5;
export declare const LIBSSH2_HOSTKEY_TYPE_ED25519 = 6;
export declare const SSH_EXTENDED_DATA_STDERR = 1;
/**
 * Create a null-terminated C string from a JavaScript string
 *
 * @param str JavaScript string to convert
 * @returns Buffer containing null-terminated C string
 */
export declare function cstr(str: string): Pointer<number>;
/**
 * Read a C string from a pointer
 *
 * @param ptr Pointer to C string
 * @returns JavaScript string
 */
export declare function readCString(ptr: Pointer<number>): string;
/**
 * Check if a pointer is null
 *
 * @param ptr Pointer to check
 * @returns true if pointer is null
 */
export declare function isNull(ptr: any): boolean;
/**
 * Load libssh2 library and create function bindings
 *
 * @returns Object containing all libssh2 functions
 */
export declare function loadlibssh2(): any;
/**
 * Get library information
 *
 * @returns Object containing library version and platform info
 */
export declare function getLibraryInfo(): {
    platform: string;
    arch: string;
    libraryPath: string;
    version: string;
};
//# sourceMappingURL=ffi.d.ts.map