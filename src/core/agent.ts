/**
 * Low-level Agent class - Direct libssh2 SSH agent wrapper
 * 
 * This class provides a thin wrapper around libssh2 SSH agent operations
 * without any high-level abstractions or application logic.
 * 
 * Based on ssh2-python's agent.pyx structure.
 */

import { cstr, isNull, readCString } from './ffi.js';

/**
 * Public key identity from SSH agent
 */
export interface AgentIdentity {
  blob: Buffer;
  comment: string;
}

/**
 * Low-level SSH Agent wrapper
 * 
 * Provides direct access to libssh2 SSH agent functionality without interpretation.
 * All methods return raw libssh2 return codes and data.
 */
export class Agent {
  private agent: any;
  private lib: any;
  private session: any;

  constructor(agent: any, lib: any, session: any) {
    this.agent = agent;
    this.lib = lib;
    this.session = session;
  }

  /**
   * Free agent resources
   * @returns libssh2 return code
   */
  free(): number {
    if (this.agent && !isNull(this.agent)) {
      const result = this.lib.libssh2_agent_free(this.agent);
      this.agent = null;
      return result;
    }
    return 0;
  }

  /**
   * Connect to SSH agent
   * @returns libssh2 return code
   */
  connect(): number {
    return this.lib.libssh2_agent_connect(this.agent);
  }

  /**
   * Disconnect from SSH agent
   * @returns libssh2 return code
   */
  disconnect(): number {
    return this.lib.libssh2_agent_disconnect(this.agent);
  }

  /**
   * List identities from agent
   * @returns libssh2 return code
   */
  listIdentities(): number {
    return this.lib.libssh2_agent_list_identities(this.agent);
  }

  /**
   * Get identity from agent
   * @param store Pointer to store identity
   * @param prev Previous identity (null for first)
   * @returns libssh2 return code
   */
  getIdentity(store: Buffer, prev: any = null): number {
    return this.lib.libssh2_agent_get_identity(this.agent, store, prev);
  }

  /**
   * Authenticate user with agent identity
   * @param username Username to authenticate
   * @param identity Identity pointer from get_identity
   * @returns libssh2 return code
   */
  userauthIdentity(username: string, identity: any): number {
    return this.lib.libssh2_agent_userauth(this.agent, cstr(username), identity);
  }

  /**
   * Get agent identity path
   * @returns Identity path string or null
   */
  getIdentityPath(): string | null {
    const result = this.lib.libssh2_agent_get_identity_path(this.agent);
    if (!result || isNull(result)) {
      return null;
    }
    return readCString(result);
  }

  /**
   * Set agent identity path
   * @param path Path to identity file
   */
  setIdentityPath(path: string): void {
    this.lib.libssh2_agent_set_identity_path(this.agent, cstr(path));
  }

  /**
   * Get raw agent pointer (for advanced use)
   * @returns Raw agent pointer
   */
  getAgentPointer(): any {
    return this.agent;
  }
}

/**
 * Helper function to create agent from session
 * @param session Session instance
 * @param lib Library instance
 * @returns Agent instance or null on failure
 */
export function createAgent(session: any, lib: any): Agent | null {
  const agent = lib.libssh2_agent_init(session);
  if (!agent || isNull(agent)) {
    return null;
  }
  return new Agent(agent, lib, session);
}
