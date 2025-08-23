/**
 * Basic tests for low-level Channel class
 * 
 * These tests verify that the Channel class provides proper
 * low-level access to libssh2 channel functionality without any
 * high-level abstractions or prompt detection.
 */

import { Session, Channel, LIBSSH2_ERROR_EAGAIN, SSH_EXTENDED_DATA_STDERR } from '../src/core/index.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Core Channel Class', () => {
  let session: Session;
  let channel: Channel | null;

  beforeEach(() => {
    session = new Session();
    channel = null;
  });

  afterEach(() => {
    if (channel) {
      channel.free();
    }
    if (session) {
      session.free();
    }
  });

  describe('Channel Creation', () => {
    it('should fail to create channel without connection', () => {
      channel = session.openSession();
      expect(channel).toBeNull();
    });
  });

  describe('Raw Channel Operations (Mock Tests)', () => {
    // These tests use a mock channel to test the interface
    // In real usage, channel would be created from connected session
    
    it('should provide raw read/write interface', () => {
      // Mock channel for interface testing
      const mockLib = {
        libssh2_channel_read: jest.fn().mockReturnValue(0),
        libssh2_channel_write: jest.fn().mockReturnValue(0),
        libssh2_channel_read_ex: jest.fn().mockReturnValue(0),
        libssh2_channel_write_ex: jest.fn().mockReturnValue(0),
        libssh2_channel_free: jest.fn().mockReturnValue(0)
      };
      
      const mockChannel = new Channel({}, mockLib);
      
      const buffer = Buffer.alloc(1024);
      const [readCode, readBytes] = mockChannel.read(buffer);
      expect(readCode).toBe(0);
      expect(readBytes).toBe(0);
      
      const [writeCode, writeBytes] = mockChannel.write('test');
      expect(writeCode).toBe(0);
      expect(writeBytes).toBe(0);
      
      mockChannel.free();
    });

    it('should provide stream-specific operations', () => {
      const mockLib = {
        libssh2_channel_read_ex: jest.fn().mockReturnValue(0),
        libssh2_channel_write_ex: jest.fn().mockReturnValue(0),
        libssh2_channel_free: jest.fn().mockReturnValue(0)
      };
      
      const mockChannel = new Channel({}, mockLib);
      
      const buffer = Buffer.alloc(1024);
      
      // Test stderr read
      const [stderrCode, stderrBytes] = mockChannel.readStderr(buffer);
      expect(mockLib.libssh2_channel_read_ex).toHaveBeenCalledWith(
        {},
        SSH_EXTENDED_DATA_STDERR,
        buffer,
        1024
      );
      
      // Test stderr write
      const [writeCode, writeBytes] = mockChannel.writeStderr('error');
      expect(mockLib.libssh2_channel_write_ex).toHaveBeenCalledWith(
        {},
        SSH_EXTENDED_DATA_STDERR,
        expect.any(Buffer),
        5
      );
      
      mockChannel.free();
    });

    it('should provide PTY operations', () => {
      const mockLib = {
        libssh2_channel_request_pty: jest.fn().mockReturnValue(0),
        libssh2_channel_request_pty_ex: jest.fn().mockReturnValue(0),
        libssh2_channel_request_pty_size_ex: jest.fn().mockReturnValue(0),
        libssh2_channel_free: jest.fn().mockReturnValue(0)
      };
      
      const mockChannel = new Channel({}, mockLib);
      
      // Test basic PTY request
      const ptyResult = mockChannel.pty('xterm');
      expect(mockLib.libssh2_channel_request_pty).toHaveBeenCalled();
      expect(ptyResult).toBe(0);
      
      // Test PTY with dimensions
      const ptyExResult = mockChannel.ptyEx('xterm-256color', '', 120, 30);
      expect(mockLib.libssh2_channel_request_pty_ex).toHaveBeenCalled();
      expect(ptyExResult).toBe(0);
      
      // Test PTY resize
      const resizeResult = mockChannel.ptySize(80, 24);
      expect(mockLib.libssh2_channel_request_pty_size_ex).toHaveBeenCalled();
      expect(resizeResult).toBe(0);
      
      mockChannel.free();
    });

    it('should provide channel lifecycle operations', () => {
      const mockLib = {
        libssh2_channel_shell: jest.fn().mockReturnValue(0),
        libssh2_channel_exec: jest.fn().mockReturnValue(0),
        libssh2_channel_subsystem: jest.fn().mockReturnValue(0),
        libssh2_channel_close: jest.fn().mockReturnValue(0),
        libssh2_channel_wait_closed: jest.fn().mockReturnValue(0),
        libssh2_channel_eof: jest.fn().mockReturnValue(0),
        libssh2_channel_send_eof: jest.fn().mockReturnValue(0),
        libssh2_channel_wait_eof: jest.fn().mockReturnValue(0),
        libssh2_channel_free: jest.fn().mockReturnValue(0)
      };
      
      const mockChannel = new Channel({}, mockLib);
      
      // Test shell request
      expect(mockChannel.shell()).toBe(0);
      expect(mockLib.libssh2_channel_shell).toHaveBeenCalled();
      
      // Test command execution
      expect(mockChannel.execute('ls -la')).toBe(0);
      expect(mockLib.libssh2_channel_exec).toHaveBeenCalled();
      
      // Test subsystem
      expect(mockChannel.subsystem('sftp')).toBe(0);
      expect(mockLib.libssh2_channel_subsystem).toHaveBeenCalled();
      
      // Test EOF operations
      expect(mockChannel.eof()).toBe(0);
      expect(mockChannel.sendEof()).toBe(0);
      expect(mockChannel.waitEof()).toBe(0);
      
      // Test close operations
      expect(mockChannel.close()).toBe(0);
      expect(mockChannel.waitClosed()).toBe(0);
      
      mockChannel.free();
    });

    it('should provide flush operations', () => {
      const mockLib = {
        libssh2_channel_flush: jest.fn().mockReturnValue(0),
        libssh2_channel_flush_ex: jest.fn().mockReturnValue(0),
        libssh2_channel_flush_stderr: jest.fn().mockReturnValue(0),
        libssh2_channel_free: jest.fn().mockReturnValue(0)
      };
      
      const mockChannel = new Channel({}, mockLib);
      
      expect(mockChannel.flush()).toBe(0);
      expect(mockChannel.flushEx(0)).toBe(0);
      expect(mockChannel.flushStderr()).toBe(0);
      
      mockChannel.free();
    });

    it('should provide exit status operations', () => {
      const mockLib = {
        libssh2_channel_get_exit_status: jest.fn().mockReturnValue(0),
        libssh2_channel_get_exit_signal: jest.fn().mockReturnValue(-1), // Not implemented
        libssh2_channel_free: jest.fn().mockReturnValue(0)
      };
      
      const mockChannel = new Channel({}, mockLib);
      
      expect(mockChannel.getExitStatus()).toBe(0);
      expect(mockChannel.getExitSignal()).toBeNull();
      
      mockChannel.free();
    });

    it('should provide environment variable operations', () => {
      const mockLib = {
        libssh2_channel_setenv: jest.fn().mockReturnValue(0),
        libssh2_channel_free: jest.fn().mockReturnValue(0)
      };
      
      const mockChannel = new Channel({}, mockLib);
      
      expect(mockChannel.setenv('PATH', '/usr/bin')).toBe(0);
      expect(mockLib.libssh2_channel_setenv).toHaveBeenCalled();
      
      mockChannel.free();
    });

    it('should provide raw pointer access', () => {
      const mockChannelPtr = { mock: 'channel' };
      const mockLib = {
        libssh2_channel_free: jest.fn().mockReturnValue(0)
      };
      
      const mockChannel = new Channel(mockChannelPtr, mockLib);
      
      expect(mockChannel.getChannelPointer()).toBe(mockChannelPtr);
      
      mockChannel.free();
    });
  });

  describe('Buffer Handling', () => {
    it('should handle Buffer and string inputs correctly', () => {
      const mockLib = {
        libssh2_channel_write: jest.fn().mockReturnValue(5),
        libssh2_channel_write_ex: jest.fn().mockReturnValue(5),
        libssh2_channel_free: jest.fn().mockReturnValue(0)
      };
      
      const mockChannel = new Channel({}, mockLib);
      
      // Test string input
      const [writeCode1, writeBytes1] = mockChannel.write('hello');
      expect(writeCode1).toBe(5);
      expect(writeBytes1).toBe(5);
      
      // Test Buffer input
      const buffer = Buffer.from('hello');
      const [writeCode2, writeBytes2] = mockChannel.write(buffer);
      expect(writeCode2).toBe(5);
      expect(writeBytes2).toBe(5);
      
      mockChannel.free();
    });
  });

  describe('Error Code Handling', () => {
    it('should return raw libssh2 error codes without interpretation', () => {
      const mockLib = {
        libssh2_channel_read: jest.fn().mockReturnValue(LIBSSH2_ERROR_EAGAIN),
        libssh2_channel_write: jest.fn().mockReturnValue(LIBSSH2_ERROR_EAGAIN),
        libssh2_channel_free: jest.fn().mockReturnValue(0)
      };
      
      const mockChannel = new Channel({}, mockLib);
      
      const buffer = Buffer.alloc(1024);
      const [readCode, readBytes] = mockChannel.read(buffer);
      expect(readCode).toBe(LIBSSH2_ERROR_EAGAIN);
      expect(readBytes).toBe(0); // No bytes read on error
      
      const [writeCode, writeBytes] = mockChannel.write('test');
      expect(writeCode).toBe(LIBSSH2_ERROR_EAGAIN);
      expect(writeBytes).toBe(0); // No bytes written on error
      
      mockChannel.free();
    });
  });
});
