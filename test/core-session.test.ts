/**
 * Basic tests for low-level Session class
 * 
 * These tests verify that the Session class provides proper
 * low-level access to libssh2 functionality without any
 * high-level abstractions.
 */

import { Session, LIBSSH2_ERROR_EAGAIN, LIBSSH2_HOSTKEY_HASH_SHA256 } from '../src/core/index.js';
import { Socket } from 'net';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Core Session Class', () => {
  let session: Session;

  beforeEach(() => {
    session = new Session();
  });

  afterEach(() => {
    if (session) {
      session.free();
    }
  });

  describe('Session Initialization', () => {
    it('should create a session instance', () => {
      expect(session).toBeDefined();
      expect(session.getSessionPointer()).toBeDefined();
    });

    it('should have default blocking mode', () => {
      // Default should be blocking
      expect(session.getBlocking()).toBe(true);
    });

    it('should have default timeout of 0 (no timeout)', () => {
      expect(session.getTimeout()).toBe(0);
    });
  });

  describe('Session Configuration', () => {
    it('should set and get blocking mode', () => {
      session.setBlocking(false);
      expect(session.getBlocking()).toBe(false);
      
      session.setBlocking(true);
      expect(session.getBlocking()).toBe(true);
    });

    it('should set and get timeout', () => {
      session.setTimeout(5000);
      expect(session.getTimeout()).toBe(5000);
      
      session.setTimeout(0);
      expect(session.getTimeout()).toBe(0);
    });
  });

  describe('Authentication State', () => {
    it('should report not authenticated initially', () => {
      expect(session.userauthAuthenticated()).toBe(0);
    });

    it('should return null for auth list without connection', () => {
      const authMethods = session.userauthList('testuser');
      expect(authMethods).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should return error codes for invalid operations', () => {
      // Try to authenticate without connection - should fail
      const result = session.userauthPassword('user', 'pass');
      expect(result).toBeLessThan(0); // Should be an error code
    });

    it('should provide last error information', () => {
      // After failed operation, should have error info
      session.userauthPassword('user', 'pass');
      const errno = session.lastErrno();
      expect(errno).toBeLessThan(0);
    });
  });

  describe('Channel Operations', () => {
    it('should fail to open session without connection', () => {
      const channel = session.openSession();
      expect(channel).toBeNull();
    });

    it('should fail to open direct TCP/IP without connection', () => {
      const channel = session.directTcpIp('localhost', 80);
      expect(channel).toBeNull();
    });
  });

  describe('Host Key Operations', () => {
    it('should return null for host key without connection', () => {
      const hostkey = session.hostkey();
      expect(hostkey).toBeNull();
    });

    it('should return null for host key hash without connection', () => {
      const hash = session.hostkeyHash(LIBSSH2_HOSTKEY_HASH_SHA256);
      expect(hash).toBeNull();
    });
  });

  describe('Keep Alive', () => {
    it('should configure keep alive settings', () => {
      // Should not throw
      expect(() => {
        session.keepaliveConfig(true, 30);
      }).not.toThrow();
    });

    it('should return error when sending keep alive without connection', () => {
      const result = session.keepaliveSend();
      expect(result).toBeLessThan(0); // Should be error code
    });
  });

  describe('Session Lifecycle', () => {
    it('should handle handshake failure gracefully', () => {
      // Invalid socket descriptor
      const result = session.handshake(-1);
      expect(result).toBeLessThan(0); // Should fail
    });

    it('should handle disconnect without connection', () => {
      const result = session.disconnect('test disconnect');
      expect(result).toBeLessThan(0); // Should fail or return error
    });

    it('should free session resources', () => {
      const result = session.free();
      expect(result).toBeGreaterThanOrEqual(0); // Should succeed or return 0
    });
  });

  describe('Raw Pointer Access', () => {
    it('should provide access to raw session pointer', () => {
      const pointer = session.getSessionPointer();
      expect(pointer).toBeDefined();
      expect(pointer).not.toBeNull();
    });

    it('should track socket descriptor', () => {
      expect(session.getSocket()).toBe(0); // Default value
    });
  });

  describe('Banner Operations', () => {
    it('should return null for banner without connection', () => {
      const banner = session.getBanner();
      expect(banner).toBeNull();
    });
  });

  describe('Block Directions', () => {
    it('should return block directions', () => {
      const directions = session.blockDirections();
      expect(typeof directions).toBe('number');
    });
  });
});

// Integration test with mock socket (if needed)
describe('Session Integration Tests', () => {
  it('should demonstrate raw libssh2 usage pattern', () => {
    const session = new Session();
    
    try {
      // Configure session
      session.setBlocking(false);
      session.setTimeout(5000);
      
      // Verify configuration
      expect(session.getBlocking()).toBe(false);
      expect(session.getTimeout()).toBe(5000);
      
      // Check initial state
      expect(session.userauthAuthenticated()).toBe(0);
      expect(session.lastErrno()).toBe(0); // No error initially
      
    } finally {
      session.free();
    }
  });
});
