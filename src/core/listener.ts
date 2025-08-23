/**
 * Low-level Listener class - Direct libssh2 port forwarding listener wrapper
 * 
 * This class provides a thin wrapper around libssh2 port forwarding listener operations
 * without any high-level abstractions or application logic.
 * 
 * Based on ssh2-python's listener.pyx structure.
 */

import { isNull } from './ffi.js';

/**
 * Low-level Port Forwarding Listener wrapper
 * 
 * Provides direct access to libssh2 port forwarding listener functionality without interpretation.
 * All methods return raw libssh2 return codes and data.
 */
export class Listener {
  private listener: any;
  private lib: any;
  private session: any;

  constructor(listener: any, lib: any, session: any) {
    this.listener = listener;
    this.lib = lib;
    this.session = session;
  }

  /**
   * Accept incoming forwarded connection
   * @returns Raw channel pointer or null on failure
   */
  forwardAccept(): any | null {
    const channel = this.lib.libssh2_channel_forward_accept(this.listener);
    if (!channel || isNull(channel)) {
      return null;
    }
    return channel;
  }

  /**
   * Cancel port forwarding listener
   * @returns libssh2 return code
   */
  forwardCancel(): number {
    return this.lib.libssh2_channel_forward_cancel(this.listener);
  }

  /**
   * Get raw listener pointer (for advanced use)
   * @returns Raw listener pointer
   */
  getListenerPointer(): any {
    return this.listener;
  }
}
