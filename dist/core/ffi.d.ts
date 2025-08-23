/**
 * Core FFI bindings for libssh2
 *
 * This module provides the low-level FFI interface to libssh2.
 * Most users should use the high-level SSHClient, SSHShell, or SSHUtils classes instead.
 */
import * as koffi from 'koffi';
export type Pointer<T> = koffi.IKoffiCType;
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