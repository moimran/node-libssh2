/**
 * Low-level KnownHost class - Direct libssh2 known hosts wrapper
 * 
 * This class provides a thin wrapper around libssh2 known hosts operations
 * without any high-level abstractions or application logic.
 * 
 * Based on ssh2-python's knownhost.pyx structure.
 */

import { cstr, isNull, readCString } from './ffi.js';

// Known host type masks
export const LIBSSH2_KNOWNHOST_TYPE_MASK = 0xffff;
export const LIBSSH2_KNOWNHOST_TYPE_PLAIN = 1;
export const LIBSSH2_KNOWNHOST_TYPE_SHA1 = 2;
export const LIBSSH2_KNOWNHOST_TYPE_CUSTOM = 3;

// Known host key types
export const LIBSSH2_KNOWNHOST_KEYENC_MASK = (3 << 16);
export const LIBSSH2_KNOWNHOST_KEYENC_RAW = (1 << 16);
export const LIBSSH2_KNOWNHOST_KEYENC_BASE64 = (2 << 16);

// Known host key algorithms
export const LIBSSH2_KNOWNHOST_KEY_MASK = (7 << 18);
export const LIBSSH2_KNOWNHOST_KEY_SHIFT = 18;
export const LIBSSH2_KNOWNHOST_KEY_RSA1 = (1 << 18);
export const LIBSSH2_KNOWNHOST_KEY_SSHRSA = (2 << 18);
export const LIBSSH2_KNOWNHOST_KEY_SSHDSS = (3 << 18);
export const LIBSSH2_KNOWNHOST_KEY_ECDSA_256 = (4 << 18);
export const LIBSSH2_KNOWNHOST_KEY_ECDSA_384 = (5 << 18);
export const LIBSSH2_KNOWNHOST_KEY_ECDSA_521 = (6 << 18);
export const LIBSSH2_KNOWNHOST_KEY_ED25519 = (7 << 18);
export const LIBSSH2_KNOWNHOST_KEY_UNKNOWN = (15 << 18);

// Known host file types
export const LIBSSH2_KNOWNHOST_FILE_OPENSSH = 1;

// Known host check results
export const LIBSSH2_KNOWNHOST_CHECK_MATCH = 0;
export const LIBSSH2_KNOWNHOST_CHECK_MISMATCH = 1;
export const LIBSSH2_KNOWNHOST_CHECK_NOTFOUND = 2;
export const LIBSSH2_KNOWNHOST_CHECK_FAILURE = 3;

/**
 * Known host entry structure
 */
export interface KnownHostEntryData {
  magic: number;
  name: string | null;
  key: Buffer | null;
  typemask: number;
}

/**
 * Known host entry wrapper
 */
export class KnownHostEntry {
  private entry: any;
  private lib: any;

  constructor(entry: any, lib: any) {
    this.entry = entry;
    this.lib = lib;
  }

  /**
   * Get entry magic number
   */
  get magic(): number {
    return this.lib.libssh2_knownhost_get_magic(this.entry);
  }

  /**
   * Get host name
   */
  get name(): string | null {
    const result = this.lib.libssh2_knownhost_get_name(this.entry);
    if (!result || isNull(result)) {
      return null;
    }
    return readCString(result);
  }

  /**
   * Get host key
   */
  get key(): Buffer | null {
    const keyPtr = Buffer.alloc(8);
    const lenPtr = Buffer.alloc(4);
    const result = this.lib.libssh2_knownhost_get_key(this.entry, keyPtr, lenPtr);
    if (result !== 0) {
      return null;
    }
    const length = lenPtr.readUInt32LE(0);
    return Buffer.from(keyPtr as any, length);
  }

  /**
   * Get type mask
   */
  get typemask(): number {
    return this.lib.libssh2_knownhost_get_typemask(this.entry);
  }

  /**
   * Get raw entry pointer
   */
  getEntryPointer(): any {
    return this.entry;
  }
}

/**
 * Low-level Known Hosts wrapper
 * 
 * Provides direct access to libssh2 known hosts functionality without interpretation.
 * All methods return raw libssh2 return codes and data.
 */
export class KnownHost {
  private knownhost: any;
  private lib: any;
  private session: any;

  constructor(knownhost: any, lib: any, session: any) {
    this.knownhost = knownhost;
    this.lib = lib;
    this.session = session;
  }

  /**
   * Free known hosts resources
   * @returns libssh2 return code
   */
  free(): number {
    if (this.knownhost && !isNull(this.knownhost)) {
      const result = this.lib.libssh2_knownhost_free(this.knownhost);
      this.knownhost = null;
      return result;
    }
    return 0;
  }

  /**
   * Add host and key to known hosts collection
   * @param host Host name
   * @param key Host key
   * @param typemask Type mask
   * @param salt Salt (optional)
   * @param comment Comment (optional)
   * @returns Raw entry pointer or null on failure
   */
  addc(host: string, key: Buffer, typemask: number, salt?: Buffer, comment?: string): any | null {
    const entryPtr = Buffer.alloc(8);
    const saltPtr = salt || null;
    const commentPtr = comment ? cstr(comment) : null;
    
    const result = this.lib.libssh2_knownhost_addc(
      this.knownhost,
      cstr(host),
      saltPtr,
      key,
      key.length,
      commentPtr,
      comment ? comment.length : 0,
      typemask,
      entryPtr
    );
    
    if (result !== 0) {
      return null;
    }
    
    return entryPtr;
  }

  /**
   * Check host and key against known hosts collection
   * @param host Host name
   * @param port Port number
   * @param key Host key
   * @param typemask Type mask
   * @returns [check_result, entry] - check_result is LIBSSH2_KNOWNHOST_CHECK_*
   */
  checkp(host: string, port: number, key: Buffer, typemask: number): [number, any | null] {
    const entryPtr = Buffer.alloc(8);
    
    const result = this.lib.libssh2_knownhost_checkp(
      this.knownhost,
      cstr(host),
      port,
      key,
      key.length,
      typemask,
      entryPtr
    );
    
    const entry = result >= 0 ? entryPtr : null;
    return [result, entry];
  }

  /**
   * Delete known host entry
   * @param entry Entry to delete
   * @returns libssh2 return code
   */
  delete(entry: any): number {
    return this.lib.libssh2_knownhost_del(this.knownhost, entry);
  }

  /**
   * Read line from known hosts data and add to collection
   * @param line Line data
   * @param fileType File type (LIBSSH2_KNOWNHOST_FILE_*)
   * @returns libssh2 return code
   */
  readline(line: string, fileType: number = LIBSSH2_KNOWNHOST_FILE_OPENSSH): number {
    return this.lib.libssh2_knownhost_readline(
      this.knownhost,
      cstr(line),
      line.length,
      fileType
    );
  }

  /**
   * Read known hosts file and add to collection
   * @param filename File name to read
   * @param fileType File type (LIBSSH2_KNOWNHOST_FILE_*)
   * @returns Number of entries read or negative error code
   */
  readfile(filename: string, fileType: number = LIBSSH2_KNOWNHOST_FILE_OPENSSH): number {
    return this.lib.libssh2_knownhost_readfile(
      this.knownhost,
      cstr(filename),
      fileType
    );
  }

  /**
   * Convert known host entry to line format
   * @param entry Entry to convert
   * @param fileType File type (LIBSSH2_KNOWNHOST_FILE_*)
   * @param buffer Buffer for output
   * @param bufferLen Buffer length
   * @returns [return_code, output_length] - return_code is 0 on success
   */
  writeline(entry: any, fileType: number, buffer: Buffer, bufferLen: number): [number, number] {
    const outlenPtr = Buffer.alloc(4);
    
    const result = this.lib.libssh2_knownhost_writeline(
      this.knownhost,
      entry,
      buffer,
      bufferLen,
      outlenPtr,
      fileType
    );
    
    const outputLength = result === 0 ? outlenPtr.readUInt32LE(0) : 0;
    return [result, outputLength];
  }

  /**
   * Write all known host entries to file
   * @param filename File name to write
   * @param fileType File type (LIBSSH2_KNOWNHOST_FILE_*)
   * @returns libssh2 return code
   */
  writefile(filename: string, fileType: number = LIBSSH2_KNOWNHOST_FILE_OPENSSH): number {
    return this.lib.libssh2_knownhost_writefile(
      this.knownhost,
      cstr(filename),
      fileType
    );
  }

  /**
   * Get known host entry
   * @param prev Previous entry (null for first)
   * @returns Raw entry pointer or null
   */
  get(prev: any = null): any | null {
    const entryPtr = Buffer.alloc(8);
    
    const result = this.lib.libssh2_knownhost_get(
      this.knownhost,
      entryPtr,
      prev
    );
    
    if (result !== 0) {
      return null;
    }
    
    return entryPtr;
  }

  /**
   * Get raw known hosts pointer (for advanced use)
   * @returns Raw known hosts pointer
   */
  getKnownHostPointer(): any {
    return this.knownhost;
  }
}

/**
 * Helper function to create known hosts from session
 * @param session Session instance
 * @param lib Library instance
 * @returns KnownHost instance or null on failure
 */
export function createKnownHost(session: any, lib: any): KnownHost | null {
  const knownhost = lib.libssh2_knownhost_init(session);
  if (!knownhost || isNull(knownhost)) {
    return null;
  }
  return new KnownHost(knownhost, lib, session);
}
