/**
 * Low-level SFTP class - Direct libssh2 SFTP wrapper
 * 
 * This class provides a thin wrapper around libssh2 SFTP operations
 * without any high-level abstractions or application logic.
 * 
 * Based on ssh2-python's sftp.pyx structure.
 */

import { cstr, isNull, readCString } from './ffi.js';

// SFTP file types
export const LIBSSH2_SFTP_S_IFMT = 0o170000;
export const LIBSSH2_SFTP_S_IFIFO = 0o010000;
export const LIBSSH2_SFTP_S_IFCHR = 0o020000;
export const LIBSSH2_SFTP_S_IFDIR = 0o040000;
export const LIBSSH2_SFTP_S_IFBLK = 0o060000;
export const LIBSSH2_SFTP_S_IFREG = 0o100000;
export const LIBSSH2_SFTP_S_IFLNK = 0o120000;
export const LIBSSH2_SFTP_S_IFSOCK = 0o140000;

// SFTP file transfer flags
export const LIBSSH2_FXF_READ = 0x00000001;
export const LIBSSH2_FXF_WRITE = 0x00000002;
export const LIBSSH2_FXF_APPEND = 0x00000004;
export const LIBSSH2_FXF_CREAT = 0x00000008;
export const LIBSSH2_FXF_TRUNC = 0x00000010;
export const LIBSSH2_FXF_EXCL = 0x00000020;

// SFTP file attributes flags
export const LIBSSH2_SFTP_ATTR_SIZE = 0x00000001;
export const LIBSSH2_SFTP_ATTR_UIDGID = 0x00000002;
export const LIBSSH2_SFTP_ATTR_PERMISSIONS = 0x00000004;
export const LIBSSH2_SFTP_ATTR_ACMODTIME = 0x00000008;
export const LIBSSH2_SFTP_ATTR_EXTENDED = 0x80000000;

// SFTP file mode masks - Owner
export const LIBSSH2_SFTP_S_IRWXU = 0o0700;
export const LIBSSH2_SFTP_S_IRUSR = 0o0400;
export const LIBSSH2_SFTP_S_IWUSR = 0o0200;
export const LIBSSH2_SFTP_S_IXUSR = 0o0100;

// SFTP file mode masks - Group
export const LIBSSH2_SFTP_S_IRWXG = 0o0070;
export const LIBSSH2_SFTP_S_IRGRP = 0o0040;
export const LIBSSH2_SFTP_S_IWGRP = 0o0020;
export const LIBSSH2_SFTP_S_IXGRP = 0o0010;

// SFTP file mode masks - Other
export const LIBSSH2_SFTP_S_IRWXO = 0o0007;
export const LIBSSH2_SFTP_S_IROTH = 0o0004;
export const LIBSSH2_SFTP_S_IWOTH = 0o0002;
export const LIBSSH2_SFTP_S_IXOTH = 0o0001;

/**
 * SFTP file attributes structure
 */
export interface SFTPAttributes {
  flags: number;
  filesize: number;
  uid: number;
  gid: number;
  permissions: number;
  atime: number;
  mtime: number;
}

/**
 * SFTP file system statistics
 */
export interface SFTPStatVFS {
  bsize: number;      // File system block size
  frsize: number;     // Fragment size
  blocks: number;     // Size of fs in f_frsize units
  bfree: number;      // Number of free blocks
  bavail: number;     // Number of free blocks for unprivileged users
  files: number;      // Number of inodes
  ffree: number;      // Number of free inodes
  favail: number;     // Number of free inodes for unprivileged users
  fsid: number;       // File system ID
  flag: number;       // Mount flags
  namemax: number;    // Maximum filename length
}

/**
 * Low-level SFTP wrapper
 * 
 * Provides direct access to libssh2 SFTP functionality without interpretation.
 * All methods return raw libssh2 return codes and data.
 */
export class SFTP {
  private sftp: any;
  private lib: any;
  private session: any;

  constructor(sftp: any, lib: any, session: any) {
    this.sftp = sftp;
    this.lib = lib;
    this.session = session;
  }

  /**
   * Shutdown SFTP session and free resources
   * @returns libssh2 return code
   */
  shutdown(): number {
    if (this.sftp && !isNull(this.sftp)) {
      const result = this.lib.libssh2_sftp_shutdown(this.sftp);
      this.sftp = null;
      return result;
    }
    return 0;
  }

  /**
   * Get channel from SFTP session
   * @returns Raw channel pointer or null
   */
  getChannel(): any | null {
    const channel = this.lib.libssh2_sftp_get_channel(this.sftp);
    if (!channel || isNull(channel)) {
      return null;
    }
    return channel;
  }

  /**
   * Open file with extended options
   * @param filename File name
   * @param flags Open flags
   * @param mode File mode
   * @param openType Open type
   * @returns Raw SFTP handle pointer or null
   */
  openEx(filename: string, flags: number, mode: number, openType: number): any | null {
    const handle = this.lib.libssh2_sftp_open_ex(
      this.sftp,
      cstr(filename),
      filename.length,
      flags,
      mode,
      openType
    );
    if (!handle || isNull(handle)) {
      return null;
    }
    return handle;
  }

  /**
   * Open file
   * @param filename File name
   * @param flags Open flags (LIBSSH2_FXF_*)
   * @param mode File mode
   * @returns Raw SFTP handle pointer or null
   */
  open(filename: string, flags: number, mode: number): any | null {
    return this.openEx(filename, flags, mode, 0); // LIBSSH2_SFTP_OPENFILE
  }

  /**
   * Open directory
   * @param path Directory path
   * @returns Raw SFTP handle pointer or null
   */
  opendir(path: string): any | null {
    return this.openEx(path, 0, 0, 1); // LIBSSH2_SFTP_OPENDIR
  }

  /**
   * Rename file with extended options
   * @param sourceFilename Source file name
   * @param destFilename Destination file name
   * @param flags Rename flags
   * @returns libssh2 return code
   */
  renameEx(sourceFilename: string, destFilename: string, flags: number): number {
    return this.lib.libssh2_sftp_rename_ex(
      this.sftp,
      cstr(sourceFilename),
      sourceFilename.length,
      cstr(destFilename),
      destFilename.length,
      flags
    );
  }

  /**
   * Rename file
   * @param sourceFilename Source file name
   * @param destFilename Destination file name
   * @returns libssh2 return code
   */
  rename(sourceFilename: string, destFilename: string): number {
    return this.lib.libssh2_sftp_rename(
      this.sftp,
      cstr(sourceFilename),
      cstr(destFilename)
    );
  }

  /**
   * Delete/unlink file
   * @param filename File name to delete
   * @returns libssh2 return code
   */
  unlink(filename: string): number {
    return this.lib.libssh2_sftp_unlink(this.sftp, cstr(filename));
  }

  /**
   * Create directory
   * @param path Directory path
   * @param mode Directory mode
   * @returns libssh2 return code
   */
  mkdir(path: string, mode: number): number {
    return this.lib.libssh2_sftp_mkdir(this.sftp, cstr(path), mode);
  }

  /**
   * Remove directory
   * @param path Directory path
   * @returns libssh2 return code
   */
  rmdir(path: string): number {
    return this.lib.libssh2_sftp_rmdir(this.sftp, cstr(path));
  }

  /**
   * Get file statistics
   * @param path File path
   * @param attrs Buffer for file attributes
   * @returns libssh2 return code
   */
  stat(path: string, attrs: Buffer): number {
    return this.lib.libssh2_sftp_stat(this.sftp, cstr(path), attrs);
  }

  /**
   * Get link statistics
   * @param path File path
   * @param attrs Buffer for file attributes
   * @returns libssh2 return code
   */
  lstat(path: string, attrs: Buffer): number {
    return this.lib.libssh2_sftp_lstat(this.sftp, cstr(path), attrs);
  }

  /**
   * Set file statistics
   * @param path File path
   * @param attrs File attributes buffer
   * @returns libssh2 return code
   */
  setstat(path: string, attrs: Buffer): number {
    return this.lib.libssh2_sftp_setstat(this.sftp, cstr(path), attrs);
  }

  /**
   * Create symbolic link
   * @param path Source path
   * @param target Target path
   * @returns libssh2 return code
   */
  symlink(path: string, target: string): number {
    return this.lib.libssh2_sftp_symlink(this.sftp, cstr(path), cstr(target));
  }

  /**
   * Get real path
   * @param path Path to resolve
   * @param buffer Buffer for real path
   * @param maxLen Maximum buffer length
   * @returns Number of bytes written or negative error code
   */
  realpath(path: string, buffer: Buffer, maxLen: number): number {
    return this.lib.libssh2_sftp_realpath(this.sftp, cstr(path), buffer, maxLen);
  }

  /**
   * Get file system statistics
   * @param path Path to check
   * @param vfs Buffer for VFS statistics
   * @returns libssh2 return code
   */
  statvfs(path: string, vfs: Buffer): number {
    return this.lib.libssh2_sftp_statvfs(this.sftp, cstr(path), path.length, vfs);
  }

  /**
   * Get last SFTP error code
   * @returns SFTP error code
   */
  lastError(): number {
    return this.lib.libssh2_sftp_last_error(this.sftp);
  }

  /**
   * Get raw SFTP pointer (for advanced use)
   * @returns Raw SFTP pointer
   */
  getSftpPointer(): any {
    return this.sftp;
  }
}
