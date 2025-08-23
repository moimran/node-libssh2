/**
 * Low-Level libssh2 Wrapper Usage Example
 * 
 * This example demonstrates how to use the low-level Session and Channel
 * classes to perform SSH operations without any high-level abstractions.
 * 
 * This is the foundation layer - higher-level libraries can be built on top.
 */

import { Session, Channel, LIBSSH2_ERROR_EAGAIN, LIBSSH2_ERROR_AUTHENTICATION_FAILED } from '../src/core/index.js';
import { Socket } from 'net';

/**
 * Example: Raw SSH connection and command execution
 * 
 * This shows the low-level pattern that higher-level libraries should follow.
 */
async function lowLevelSSHExample() {
  const session = new Session();
  let socket: Socket | null = null;
  let channel: Channel | null = null;

  try {
    console.log('=== Low-Level libssh2 Wrapper Example ===\n');

    // 1. Configure session (raw libssh2 settings)
    console.log('1. Configuring session...');
    session.setBlocking(true);  // Blocking mode for simplicity
    session.setTimeout(10000);  // 10 second timeout
    console.log(`   Blocking: ${session.getBlocking()}`);
    console.log(`   Timeout: ${session.getTimeout()}ms\n`);

    // 2. Create socket connection (this would be real in practice)
    console.log('2. Creating socket connection...');
    socket = new Socket();
    
    // In real usage, you would connect to actual SSH server:
    // await new Promise((resolve, reject) => {
    //   socket.connect(22, 'your-ssh-server.com', resolve);
    //   socket.on('error', reject);
    // });
    
    // For demo, we'll simulate the connection failure
    console.log('   (Simulating connection - would be real socket in practice)\n');

    // 3. Perform SSH handshake (raw libssh2 call)
    console.log('3. Attempting SSH handshake...');
    const handshakeResult = session.handshake(socket.fd || -1);
    console.log(`   Handshake result: ${handshakeResult}`);
    
    if (handshakeResult < 0) {
      console.log(`   Handshake failed with error: ${handshakeResult}`);
      console.log(`   Last errno: ${session.lastErrno()}`);
      console.log(`   Last error: ${session.lastError()}\n`);
    }

    // 4. Authentication (raw libssh2 calls)
    console.log('4. Checking authentication...');
    console.log(`   Initially authenticated: ${session.userauthAuthenticated() === 1}`);
    
    // Get available auth methods (would work with real connection)
    const authMethods = session.userauthList('testuser');
    console.log(`   Available auth methods: ${authMethods || 'none (no connection)'}\n`);

    // 5. Demonstrate channel operations (would work with real connection)
    console.log('5. Attempting to open channel...');
    channel = session.openSession();
    
    if (channel) {
      console.log('   Channel opened successfully');
      
      // Configure PTY (raw libssh2 calls)
      console.log('   Configuring PTY...');
      const ptyResult = channel.ptyEx('xterm-256color', '', 80, 24);
      console.log(`   PTY result: ${ptyResult}`);
      
      // Request shell (raw libssh2 call)
      const shellResult = channel.shell();
      console.log(`   Shell result: ${shellResult}`);
      
      // Raw data operations (no prompt detection or interpretation)
      console.log('   Performing raw data operations...');
      
      const buffer = Buffer.alloc(1024);
      const [readCode, readBytes] = channel.read(buffer);
      console.log(`   Read result: code=${readCode}, bytes=${readBytes}`);
      
      const [writeCode, writeBytes] = channel.write('echo "Hello from low-level wrapper"\n');
      console.log(`   Write result: code=${writeCode}, bytes=${writeBytes}`);
      
    } else {
      console.log('   Channel creation failed (expected without real connection)');
      console.log(`   Last errno: ${session.lastErrno()}\n`);
    }

    // 6. Demonstrate error handling (raw error codes)
    console.log('6. Error handling demonstration...');
    console.log('   Raw libssh2 error codes are returned without interpretation:');
    console.log(`   LIBSSH2_ERROR_EAGAIN = ${LIBSSH2_ERROR_EAGAIN}`);
    console.log(`   LIBSSH2_ERROR_AUTHENTICATION_FAILED = ${LIBSSH2_ERROR_AUTHENTICATION_FAILED}`);
    console.log('   Applications must handle these codes appropriately\n');

    // 7. Session information (raw libssh2 data)
    console.log('7. Session information...');
    console.log(`   Block directions: ${session.blockDirections()}`);
    console.log(`   Banner: ${session.getBanner() || 'none'}`);
    console.log(`   Host key: ${session.hostkey() ? 'available' : 'none'}\n`);

    console.log('=== Key Points ===');
    console.log('• This wrapper provides RAW libssh2 access');
    console.log('• No prompt detection or command interpretation');
    console.log('• No automatic output parsing or shell state management');
    console.log('• Applications must implement their own high-level logic');
    console.log('• Perfect foundation for building specialized SSH libraries\n');

  } catch (error) {
    console.error('Error in low-level SSH example:', error);
  } finally {
    // Cleanup (important for resource management)
    console.log('Cleaning up resources...');
    
    if (channel) {
      channel.close();
      channel.free();
      console.log('   Channel freed');
    }
    
    if (session) {
      session.disconnect('Example complete');
      session.free();
      console.log('   Session freed');
    }
    
    if (socket) {
      socket.destroy();
      console.log('   Socket closed');
    }
  }
}

/**
 * Example: Building a simple command executor on top of low-level wrapper
 * 
 * This shows how higher-level functionality can be built using the raw wrapper.
 */
class SimpleCommandExecutor {
  private session: Session;
  private connected: boolean = false;

  constructor() {
    this.session = new Session();
  }

  async connect(host: string, port: number, username: string, password: string): Promise<boolean> {
    try {
      // This would implement actual socket connection and handshake
      // using the low-level session methods
      
      this.session.setBlocking(true);
      this.session.setTimeout(10000);
      
      // In real implementation:
      // 1. Create socket and connect
      // 2. session.handshake(socket.fd)
      // 3. session.userauthPassword(username, password)
      // 4. Check session.userauthAuthenticated()
      
      console.log('SimpleCommandExecutor: Would connect using low-level Session class');
      return false; // Simulated failure for demo
      
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  }

  async executeCommand(command: string): Promise<{ output: string; exitCode: number }> {
    if (!this.connected) {
      throw new Error('Not connected');
    }

    const channel = this.session.openSession();
    if (!channel) {
      throw new Error('Failed to open channel');
    }

    try {
      // Execute command using raw channel operations
      const execResult = channel.execute(command);
      if (execResult !== 0) {
        throw new Error(`Command execution failed: ${execResult}`);
      }

      // Read output using raw read operations (no prompt detection)
      let output = '';
      const buffer = Buffer.alloc(4096);
      
      while (true) {
        const [readCode, readBytes] = channel.read(buffer);
        
        if (readCode > 0) {
          output += buffer.subarray(0, readBytes).toString();
        } else if (readCode === 0) {
          break; // EOF
        } else if (readCode === LIBSSH2_ERROR_EAGAIN) {
          // Would block - wait and retry
          await new Promise(resolve => setTimeout(resolve, 10));
        } else {
          break; // Other error
        }
      }

      const exitCode = channel.getExitStatus();
      return { output, exitCode };

    } finally {
      channel.close();
      channel.free();
    }
  }

  disconnect(): void {
    if (this.session) {
      this.session.disconnect();
      this.session.free();
      this.connected = false;
    }
  }
}

// Run the example
if (require.main === module) {
  lowLevelSSHExample().catch(console.error);
}
