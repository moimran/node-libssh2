/**
 * Low-level SFTP Handle class - Direct libssh2 SFTP handle wrapper
 * 
 * This class provides a thin wrapper around libssh2 SFTP handle operations
 * without any high-level abstractions or application logic.
 * 
 * Based on ssh2-python's sftp_handle.pyx structure.
 */

import { cstr, isNull } from './ffi.js';

/**
 * SFTP file attributes class
 */
export class SFTPAttributes {
  private attrs: Buffer;

  constructor() {
    // Allocate buffer for LIBSSH2_SFTP_ATTRIBUTES structure
    this.attrs = Buffer.alloc(64); // Approximate size, adjust as needed
    this.reset();
  }

  /**
   * Reset attributes to default values
   */
  reset(): void {
    this.attrs.fill(0);
  }

  /**
   * Get flags
   */
  get flags(): number {
    return this.attrs.readUInt32LE(0);
  }

  /**
   * Set flags
   */
  set flags(value: number) {
    this.attrs.writeUInt32LE(value, 0);
  }

  /**
   * Get file size
   */
  get filesize(): number {
    return Number(this.attrs.readBigUInt64LE(8));
  }

  /**
   * Set file size
   */
  set filesize(value: number | bigint) {
    this.attrs.writeBigUInt64LE(BigInt(value), 8);
  }

  /**
   * Get UID
   */
  get uid(): number {
    return this.attrs.readUInt32LE(16);
  }

  /**
   * Set UID
   */
  set uid(value: number) {
    this.attrs.writeUInt32LE(value, 16);
  }

  /**
   * Get GID
   */
  get gid(): number {
    return this.attrs.readUInt32LE(20);
  }

  /**
   * Set GID
   */
  set gid(value: number) {
    this.attrs.writeUInt32LE(value, 20);
  }

  /**
   * Get permissions
   */
  get permissions(): number {
    return this.attrs.readUInt32LE(24);
  }

  /**
   * Set permissions
   */
  set permissions(value: number) {
    this.attrs.writeUInt32LE(value, 24);
  }

  /**
   * Get access time
   */
  get atime(): number {
    return this.attrs.readUInt32LE(28);
  }

  /**
   * Set access time
   */
  set atime(value: number) {
    this.attrs.writeUInt32LE(value, 28);
  }

  /**
   * Get modification time
   */
  get mtime(): number {
    return this.attrs.readUInt32LE(32);
  }

  /**
   * Set modification time
   */
  set mtime(value: number) {
    this.attrs.writeUInt32LE(value, 32);
  }

  /**
   * Get raw attributes buffer
   */
  getBuffer(): Buffer {
    return this.attrs;
  }
}

/**
 * SFTP file system statistics class
 */
export class SFTPStatVFS {
  private vfs: Buffer;

  constructor() {
    // Allocate buffer for LIBSSH2_SFTP_STATVFS structure
    this.vfs = Buffer.alloc(88); // Approximate size for statvfs structure
    this.vfs.fill(0);
  }

  get bsize(): number { return Number(this.vfs.readBigUInt64LE(0)); }
  get frsize(): number { return Number(this.vfs.readBigUInt64LE(8)); }
  get blocks(): number { return Number(this.vfs.readBigUInt64LE(16)); }
  get bfree(): number { return Number(this.vfs.readBigUInt64LE(24)); }
  get bavail(): number { return Number(this.vfs.readBigUInt64LE(32)); }
  get files(): number { return Number(this.vfs.readBigUInt64LE(40)); }
  get ffree(): number { return Number(this.vfs.readBigUInt64LE(48)); }
  get favail(): number { return Number(this.vfs.readBigUInt64LE(56)); }
  get fsid(): number { return Number(this.vfs.readBigUInt64LE(64)); }
  get flag(): number { return Number(this.vfs.readBigUInt64LE(72)); }
  get namemax(): number { return Number(this.vfs.readBigUInt64LE(80)); }

  /**
   * Get raw VFS buffer
   */
  getBuffer(): Buffer {
    return this.vfs;
  }
}

/**
 * Low-level SFTP handle wrapper
 * 
 * Provides direct access to libssh2 SFTP handle functionality without interpretation.
 * All methods return raw libssh2 return codes and data.
 */
export class SFTPHandle {
  private handle: any;
  private lib: any;
  private sftp: any;
  private closed: boolean = false;

  constructor(handle: any, lib: any, sftp: any) {
    this.handle = handle;
    this.lib = lib;
    this.sftp = sftp;
  }

  /**
   * Close SFTP handle
   * @returns libssh2 return code
   */
  close(): number {
    if (!this.closed && this.handle && !isNull(this.handle)) {
      const result = this.lib.libssh2_sftp_close_handle(this.handle);
      this.closed = true;
      this.handle = null;
      return result;
    }
    return 0;
  }

  /**
   * Read data from file handle
   * @param buffer Buffer to read into
   * @param maxLen Maximum bytes to read
   * @returns [return_code, bytes_read] - return_code is bytes read if positive, error code if negative
   */
  read(buffer: Buffer, maxLen: number = buffer.length): [number, number] {
    const bytesRead = this.lib.libssh2_sftp_read(this.handle, buffer, maxLen);
    const actualBytes = bytesRead > 0 ? Number(bytesRead) : 0;
    return [Number(bytesRead), actualBytes];
  }

  /**
   * Write data to file handle
   * @param data Data to write
   * @returns [return_code, bytes_written] - return_code is bytes written if positive, error code if negative
   */
  write(data: Buffer): [number, number] {
    const bytesWritten = this.lib.libssh2_sftp_write(this.handle, data, data.length);
    const actualBytes = bytesWritten > 0 ? Number(bytesWritten) : 0;
    return [Number(bytesWritten), actualBytes];
  }

  /**
   * Read directory entry
   * @param buffer Buffer for filename
   * @param maxLen Maximum buffer length
   * @param longEntry Buffer for long entry format
   * @param longEntryMaxLen Maximum long entry buffer length
   * @param attrs Attributes buffer
   * @returns Number of bytes read or negative error code
   */
  readdirEx(
    buffer: Buffer,
    maxLen: number,
    longEntry: Buffer,
    longEntryMaxLen: number,
    attrs: Buffer
  ): number {
    return this.lib.libssh2_sftp_readdir_ex(
      this.handle,
      buffer,
      maxLen,
      longEntry,
      longEntryMaxLen,
      attrs
    );
  }

  /**
   * Read directory entry (simple version)
   * @param buffer Buffer for filename
   * @param maxLen Maximum buffer length
   * @param attrs Attributes buffer
   * @returns Number of bytes read or negative error code
   */
  readdir(buffer: Buffer, maxLen: number, attrs: Buffer): number {
    return this.lib.libssh2_sftp_readdir(this.handle, buffer, maxLen, attrs);
  }

  /**
   * Sync file handle data
   * @returns libssh2 return code
   */
  fsync(): number {
    return this.lib.libssh2_sftp_fsync(this.handle);
  }

  /**
   * Seek to position (deprecated, use seek64)
   * @param offset Offset to seek to
   */
  seek(offset: number): void {
    this.lib.libssh2_sftp_seek(this.handle, offset);
  }

  /**
   * Seek to 64-bit position
   * @param offset Offset to seek to
   */
  seek64(offset: number | bigint): void {
    this.lib.libssh2_sftp_seek64(this.handle, BigInt(offset));
  }

  /**
   * Rewind to beginning of file
   */
  rewind(): void {
    this.lib.libssh2_sftp_rewind(this.handle);
  }

  /**
   * Get current position (deprecated, use tell64)
   * @returns Current position
   */
  tell(): number {
    return this.lib.libssh2_sftp_tell(this.handle);
  }

  /**
   * Get current 64-bit position
   * @returns Current position
   */
  tell64(): number {
    return Number(this.lib.libssh2_sftp_tell64(this.handle));
  }

  /**
   * Get or set file attributes (extended version)
   * @param attrs Attributes buffer
   * @param setstat Whether to set (1) or get (0) attributes
   * @returns libssh2 return code
   */
  fstatEx(attrs: Buffer, setstat: number): number {
    return this.lib.libssh2_sftp_fstat_ex(this.handle, attrs, setstat);
  }

  /**
   * Get file attributes
   * @param attrs Attributes buffer
   * @returns libssh2 return code
   */
  fstat(attrs: Buffer): number {
    return this.lib.libssh2_sftp_fstat(this.handle, attrs);
  }

  /**
   * Set file attributes
   * @param attrs Attributes buffer
   * @returns libssh2 return code
   */
  fsetstat(attrs: Buffer): number {
    return this.lib.libssh2_sftp_fsetstat(this.handle, attrs);
  }

  /**
   * Get file system statistics
   * @param vfs VFS statistics buffer
   * @returns libssh2 return code
   */
  fstatvfs(vfs: Buffer): number {
    return this.lib.libssh2_sftp_fstatvfs(this.handle, vfs);
  }

  /**
   * Check if handle is closed
   */
  isClosed(): boolean {
    return this.closed;
  }

  /**
   * Get raw handle pointer (for advanced use)
   * @returns Raw handle pointer
   */
  getHandlePointer(): any {
    return this.handle;
  }
}
