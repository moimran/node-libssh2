/**
 * Low-level Channel class - Direct libssh2 channel wrapper
 * 
 * This class provides a thin wrapper around libssh2 channel operations
 * without any high-level abstractions or application logic.
 * 
 * Based on ssh2-python's channel.pyx structure.
 */

import { cstr, isNull, SSH_EXTENDED_DATA_STDERR } from './ffi.js';

/**
 * Low-level SSH channel wrapper
 * 
 * Provides direct access to libssh2 channel functionality without interpretation.
 * All methods return raw libssh2 return codes and data.
 */
export class Channel {
  private channel: any;
  private lib: any;

  constructor(channel: any, lib: any) {
    this.channel = channel;
    this.lib = lib;
  }

  /**
   * Request a PTY (pseudo-terminal) on the channel
   * @param term Terminal type (default: 'vt100')
   * @returns libssh2 return code
   */
  pty(term: string = 'vt100'): number {
    return this.lib.libssh2_channel_request_pty(this.channel, cstr(term));
  }

  /**
   * Request a PTY with specific dimensions
   * @param term Terminal type
   * @param modes Terminal modes (can be empty string)
   * @param width Terminal width in characters
   * @param height Terminal height in characters
   * @param widthPx Terminal width in pixels (optional)
   * @param heightPx Terminal height in pixels (optional)
   * @returns libssh2 return code
   */
  ptyEx(
    term: string,
    modes: string = '',
    width: number = 80,
    height: number = 24,
    widthPx: number = 0,
    heightPx: number = 0
  ): number {
    console.log('🔍 Channel: ptyEx() called - ABOUT TO CALL NATIVE libssh2_channel_request_pty_ex');
    const result = this.lib.libssh2_channel_request_pty_ex(
      this.channel,
      cstr(term),
      term.length,
      cstr(modes),
      modes.length,
      width,
      height,
      widthPx,
      heightPx
    );
    console.log('🔍 Channel: ptyEx() completed with result:', result);
    return result;
  }

  /**
   * Request PTY size change
   * @param width New width in characters
   * @param height New height in characters
   * @param widthPx New width in pixels (optional)
   * @param heightPx New height in pixels (optional)
   * @returns libssh2 return code
   */
  ptySize(width: number, height: number, widthPx: number = 0, heightPx: number = 0): number {
    return this.lib.libssh2_channel_request_pty_size_ex(this.channel, width, height, widthPx, heightPx);
  }

  /**
   * Resize PTY (alias for ptySize for compatibility)
   * @param cols New width in characters
   * @param rows New height in characters
   * @param width New width in pixels (optional)
   * @param height New height in pixels (optional)
   * @returns libssh2 return code
   */
  ptyResize(cols: number, rows: number, width: number = 0, height: number = 0): number {
    return this.ptySize(cols, rows, width, height);
  }

  /**
   * Send signal to the channel
   * @param signalName Signal name (e.g., 'TERM', 'KILL', 'INT')
   * @returns libssh2 return code
   */
  signal(signalName: string): number {
    return this.lib.libssh2_channel_signal_ex(this.channel, cstr(signalName), signalName.length);
  }

  /**
   * Execute a command on the channel
   * @param command Command to execute
   * @returns libssh2 return code
   */
  execute(command: string): number {
    return this.lib.libssh2_channel_process_startup(
      this.channel,
      cstr('exec'),
      4,
      cstr(command),
      command.length
    );
  }

  /**
   * Request an interactive shell
   * @returns libssh2 return code
   */
  shell(): number {
    console.log('🔍 Channel: shell() called - ABOUT TO CALL NATIVE libssh2_channel_process_startup');
    const result = this.lib.libssh2_channel_process_startup(
      this.channel,
      cstr('shell'),
      5,
      null,
      0
    );
    console.log('🔍 Channel: shell() completed with result:', result);
    return result;
  }

  /**
   * Request a subsystem
   * @param subsystem Subsystem name
   * @returns libssh2 return code
   */
  subsystem(subsystem: string): number {
    return this.lib.libssh2_channel_process_startup(
      this.channel,
      cstr('subsystem'),
      9,
      cstr(subsystem),
      subsystem.length
    );
  }

  /**
   * Read data from channel (stdout)
   * @param buffer Buffer to read into
   * @param size Maximum bytes to read
   * @returns [return_code, bytes_read] - return_code is bytes read if positive, error code if negative
   */
  read(buffer: Buffer, size: number = buffer.length): [number, number] {
    const bytesRead = this.lib.libssh2_channel_read_ex(this.channel, 0, buffer, size);
    const actualBytes = bytesRead > 0 ? Number(bytesRead) : 0;
    return [Number(bytesRead), actualBytes];
  }

  /**
   * Read data from specific stream
   * @param streamId Stream ID (0 = stdout, SSH_EXTENDED_DATA_STDERR = stderr)
   * @param buffer Buffer to read into
   * @param size Maximum bytes to read
   * @returns [return_code, bytes_read] - return_code is bytes read if positive, error code if negative
   */
  readEx(streamId: number, buffer: Buffer, size: number = buffer.length): [number, number] {
    const bytesRead = this.lib.libssh2_channel_read_ex(this.channel, streamId, buffer, size);
    const actualBytes = bytesRead > 0 ? Number(bytesRead) : 0;
    return [Number(bytesRead), actualBytes];
  }

  /**
   * Read data from stderr
   * @param buffer Buffer to read into
   * @param size Maximum bytes to read
   * @returns [return_code, bytes_read] - return_code is bytes read if positive, error code if negative
   */
  readStderr(buffer: Buffer, size: number = buffer.length): [number, number] {
    return this.readEx(SSH_EXTENDED_DATA_STDERR, buffer, size);
  }

  /**
   * Write data to channel (stdin)
   * @param data Data to write
   * @returns [return_code, bytes_written] - return_code is bytes written if positive, error code if negative
   */
  write(data: Buffer | string): [number, number] {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const bytesWritten = this.lib.libssh2_channel_write_ex(this.channel, 0, buffer, buffer.length);
    const actualBytes = bytesWritten > 0 ? Number(bytesWritten) : 0;
    return [Number(bytesWritten), actualBytes];
  }

  /**
   * Write data to specific stream
   * @param streamId Stream ID (0 = stdin)
   * @param data Data to write
   * @returns [return_code, bytes_written] - return_code is bytes written if positive, error code if negative
   */
  writeEx(streamId: number, data: Buffer | string): [number, number] {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const bytesWritten = this.lib.libssh2_channel_write_ex(this.channel, streamId, buffer, buffer.length);
    const actualBytes = bytesWritten > 0 ? Number(bytesWritten) : 0;
    return [Number(bytesWritten), actualBytes];
  }

  /**
   * Write data to stderr
   * @param data Data to write
   * @returns [return_code, bytes_written] - return_code is bytes written if positive, error code if negative
   */
  writeStderr(data: Buffer | string): [number, number] {
    return this.writeEx(SSH_EXTENDED_DATA_STDERR, data);
  }

  /**
   * Flush stdout stream
   * @returns libssh2 return code
   */
  flush(): number {
    return this.lib.libssh2_channel_flush(this.channel);
  }

  /**
   * Flush specific stream
   * @param streamId Stream ID to flush
   * @returns libssh2 return code
   */
  flushEx(streamId: number): number {
    return this.lib.libssh2_channel_flush_ex(this.channel, streamId);
  }

  /**
   * Flush stderr stream
   * @returns libssh2 return code
   */
  flushStderr(): number {
    return this.lib.libssh2_channel_flush_stderr(this.channel);
  }

  /**
   * Check if channel has reached EOF
   * @returns 1 if EOF, 0 if not
   */
  eof(): number {
    return this.lib.libssh2_channel_eof(this.channel);
  }

  /**
   * Send EOF to channel
   * @returns libssh2 return code
   */
  sendEof(): number {
    return this.lib.libssh2_channel_send_eof(this.channel);
  }

  /**
   * Wait for remote end to acknowledge EOF
   * @returns libssh2 return code
   */
  waitEof(): number {
    return this.lib.libssh2_channel_wait_eof(this.channel);
  }

  /**
   * Close the channel
   * @returns libssh2 return code
   */
  close(): number {
    return this.lib.libssh2_channel_close(this.channel);
  }

  /**
   * Wait for channel to be closed
   * @returns libssh2 return code
   */
  waitClosed(): number {
    return this.lib.libssh2_channel_wait_closed(this.channel);
  }

  /**
   * Free channel resources
   * @returns libssh2 return code
   */
  free(): number {
    if (this.channel && !isNull(this.channel)) {
      const result = this.lib.libssh2_channel_free(this.channel);
      this.channel = null;
      return result;
    }
    return 0;
  }

  /**
   * Get command exit status
   * @returns Exit status code
   */
  getExitStatus(): number {
    return this.lib.libssh2_channel_get_exit_status(this.channel);
  }

  /**
   * Get exit signal information
   * @returns [return_code, signal, error_message, language_tag] or null
   */
  getExitSignal(): [number, string, string, string] | null {
    const signalPtr = Buffer.alloc(8);
    const signalLenPtr = Buffer.alloc(8);
    const errorPtr = Buffer.alloc(8);
    const errorLenPtr = Buffer.alloc(8);
    const langPtr = Buffer.alloc(8);
    const langLenPtr = Buffer.alloc(8);

    const result = this.lib.libssh2_channel_get_exit_signal(
      this.channel,
      signalPtr,
      signalLenPtr,
      errorPtr,
      errorLenPtr,
      langPtr,
      langLenPtr
    );

    if (result !== 0) {
      return null;
    }

    // Extract strings from pointers (simplified - would need proper pointer handling)
    const signal = '';  // Would need to read from signalPtr
    const error = '';   // Would need to read from errorPtr  
    const lang = '';    // Would need to read from langPtr

    return [result, signal, error, lang];
  }

  /**
   * Set environment variable
   * @param varname Variable name
   * @param value Variable value
   * @returns libssh2 return code
   */
  setenv(varname: string, value: string): number {
    return this.lib.libssh2_channel_setenv_ex(
      this.channel,
      cstr(varname),
      varname.length,
      cstr(value),
      value.length
    );
  }

  /**
   * Get window read information
   * @returns Window size
   */
  windowRead(): number {
    return this.lib.libssh2_channel_window_read(this.channel);
  }

  /**
   * Get window read information with details
   * @param readAvail Available read bytes (output parameter)
   * @param windowSizeInitial Initial window size (output parameter)
   * @returns Window size
   */
  windowReadEx(readAvail: Buffer, windowSizeInitial: Buffer): number {
    return this.lib.libssh2_channel_window_read_ex(this.channel, readAvail, windowSizeInitial);
  }

  /**
   * Get window write information
   * @returns Window size
   */
  windowWrite(): number {
    return this.lib.libssh2_channel_window_write(this.channel);
  }

  /**
   * Get window write information with details
   * @param windowSizeInitial Initial window size (output parameter)
   * @returns Window size
   */
  windowWriteEx(windowSizeInitial: Buffer): number {
    return this.lib.libssh2_channel_window_write_ex(this.channel, windowSizeInitial);
  }

  /**
   * Adjust receive window
   * @param adjustment Adjustment amount
   * @param force Force adjustment
   * @returns New window size
   */
  receiveWindowAdjust(adjustment: number, force: number): number {
    return this.lib.libssh2_channel_receive_window_adjust(this.channel, adjustment, force);
  }

  /**
   * Adjust receive window with store window
   * @param adjustment Adjustment amount
   * @param force Force adjustment
   * @param storeWindow Store window (output parameter)
   * @returns New window size
   */
  receiveWindowAdjust2(adjustment: number, force: number, storeWindow: Buffer): number {
    return this.lib.libssh2_channel_receive_window_adjust2(this.channel, adjustment, force, storeWindow);
  }

  /**
   * Request X11 forwarding
   * @param screenNumber Screen number
   * @returns libssh2 return code
   */
  x11Request(screenNumber: number): number {
    return this.lib.libssh2_channel_x11_req(this.channel, screenNumber);
  }

  /**
   * Request X11 forwarding with extended options
   * @param singleConnection Single connection flag
   * @param authProto Authentication protocol
   * @param authCookie Authentication cookie
   * @param screenNumber Screen number
   * @returns libssh2 return code
   */
  x11RequestEx(singleConnection: number, authProto: string, authCookie: string, screenNumber: number): number {
    return this.lib.libssh2_channel_x11_req_ex(
      this.channel,
      singleConnection,
      cstr(authProto),
      cstr(authCookie),
      screenNumber
    );
  }

  /**
   * Handle extended data
   * @param ignoreMode Ignore mode
   */
  handleExtendedData(ignoreMode: number): void {
    this.lib.libssh2_channel_handle_extended_data(this.channel, ignoreMode);
  }

  /**
   * Handle extended data (version 2)
   * @param ignoreMode Ignore mode
   * @returns libssh2 return code
   */
  handleExtendedData2(ignoreMode: number): number {
    return this.lib.libssh2_channel_handle_extended_data2(this.channel, ignoreMode);
  }

  /**
   * Request SSH agent authentication forwarding
   * @returns libssh2 return code
   */
  requestAuthAgent(): number {
    return this.lib.libssh2_channel_request_auth_agent(this.channel);
  }

  /**
   * Process startup for custom requests
   * @param request Request type
   * @param message Request message (optional)
   * @returns libssh2 return code
   */
  processStartup(request: string, message?: string): number {
    const msg = message || '';
    return this.lib.libssh2_channel_process_startup(
      this.channel,
      cstr(request),
      request.length,
      cstr(msg),
      msg.length
    );
  }

  /**
   * Get raw channel pointer (for advanced use)
   * @returns Raw channel pointer
   */
  getChannelPointer(): any {
    return this.channel;
  }
}
