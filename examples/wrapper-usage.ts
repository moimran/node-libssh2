/**
 * High-Level SSH Wrapper Usage Examples
 *
 * These examples demonstrate how to use the high-level async functions
 * built on top of our low-level core classes.
 */

import {
  sshExec,
  sshExecMultiple,
  sshShell,
  sshTest,
  sshInfo,
  sftpReaddir,
  sftpDownload,
  sftpUpload,
  sftpMkdir,
  agentListIdentities,
  agentAuth,
  forwardLocal,
  forwardRemote,
  forwardClose,
  knownHostsVerify,
  knownHostsAdd,
  HostKeyVerification
} from '../src/wrapper/index.js';

/**
 * Example 1: Basic SSH Command Execution
 * Using async functions instead of classes
 */
async function basicSSHExample() {
  console.log('=== Basic SSH Command Execution Example ===\n');

  const config = {
    host: 'your-server.com',
    port: 22,
    username: 'your-username',
    password: 'your-password',
    timeout: 30000
  };

  try {
    // Test connection first
    console.log('Testing SSH connection...');
    const isConnected = await sshTest(config);
    console.log(`Connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}\n`);

    if (!isConnected) {
      console.log('Cannot proceed without connection\n');
      return;
    }

    // Execute single command
    console.log('Executing command: ls -la');
    const result = await sshExec(config, 'ls -la');
    console.log('Command output:');
    console.log(result.stdout);
    console.log(`Exit code: ${result.exitCode}\n`);

    // Execute multiple commands efficiently (reuses connection)
    console.log('Executing multiple commands...');
    const commands = ['hostname', 'uptime', 'df -h'];
    const results = await sshExecMultiple(config, commands);

    results.forEach((result, index) => {
      console.log(`Command: ${commands[index]}`);
      console.log(`Output: ${result.stdout.trim()}`);
      console.log(`Success: ${result.success}\n`);
    });

  } catch (error) {
    console.error('SSH Error:', error.message);
  }
}

/**
 * Example 2: SFTP File Transfer Operations
 * Using async functions for file operations
 */
async function sftpExample() {
  console.log('=== SFTP File Transfer Example ===\n');

  const config = {
    host: 'your-server.com',
    username: 'your-username',
    privateKeyPath: '/path/to/private/key'
  };

  try {
    // List directory contents
    console.log('Listing remote directory contents:');
    const files = await sftpReaddir(config, '/home/user');
    files.forEach(file => {
      const type = file.isDirectory ? 'DIR' : file.isFile ? 'FILE' : 'LINK';
      console.log(`${type}: ${file.name} (${file.size} bytes)`);
    });
    console.log();

    // Create directory
    console.log('Creating remote directory...');
    await sftpMkdir(config, '/remote/new-directory', { recursive: true });
    console.log('Directory created\n');

    // Upload file with progress tracking
    console.log('Uploading file...');
    await sftpUpload(config, './local-file.txt', '/remote/path/file.txt', {
      createDirectories: true,
      preserveTimestamps: true,
      progress: (transferred, total) => {
        const percent = Math.round((transferred / total) * 100);
        console.log(`Upload progress: ${percent}% (${transferred}/${total} bytes)`);
      }
    });
    console.log('File uploaded successfully\n');

    // Download file
    console.log('Downloading file...');
    await sftpDownload(config, '/remote/path/file.txt', './downloaded-file.txt', {
      progress: (transferred, total) => {
        const percent = Math.round((transferred / total) * 100);
        console.log(`Download progress: ${percent}% (${transferred}/${total} bytes)`);
      }
    });
    console.log('File downloaded successfully\n');

  } catch (error) {
    console.error('SFTP Error:', error.message);
  }
}

/**
 * Example 3: Interactive Shell Session
 */
async function interactiveShellExample() {
  console.log('=== Interactive Shell Example ===\n');

  const client = new SSHClient({
    host: 'your-server.com',
    username: 'your-username',
    password: 'your-password'
  });

  try {
    await client.connect();
    console.log('Connected to SSH server\n');

    // Open interactive shell
    const shell = await client.openShell({
      term: 'xterm-256color',
      cols: 80,
      rows: 24,
      env: {
        'LANG': 'en_US.UTF-8',
        'PATH': '/usr/local/bin:/usr/bin:/bin'
      }
    });

    console.log('Interactive shell opened\n');

    // Send commands to shell
    const commands = ['pwd', 'whoami', 'date', 'exit'];
    
    for (const command of commands) {
      console.log(`Sending command: ${command}`);
      const [writeCode] = shell.write(command + '\n');
      
      if (writeCode <= 0) {
        console.error(`Failed to write command: ${writeCode}`);
        continue;
      }

      // Read response (simplified - in real usage you'd want proper prompt detection)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const buffer = Buffer.alloc(4096);
      const [readCode, bytesRead] = shell.read(buffer);
      
      if (readCode > 0) {
        const output = buffer.subarray(0, bytesRead).toString();
        console.log('Shell output:');
        console.log(output);
      }
      console.log();
    }

    shell.close();
    shell.free();

  } catch (error) {
    console.error('Shell Error:', error.message);
  } finally {
    await client.disconnect();
  }
}

/**
 * Example 4: Port Forwarding
 */
async function portForwardingExample() {
  console.log('=== Port Forwarding Example ===\n');

  const connection = new SSHConnection({
    host: 'your-server.com',
    username: 'your-username',
    privateKeyPath: '/path/to/private/key'
  });

  try {
    await connection.connect();
    console.log('Connected to SSH server\n');

    // Create local port forwarding (local:8080 -> remote:80)
    console.log('Creating local port forwarding...');
    const localTunnelId = await connection.forwardLocal({
      localHost: '127.0.0.1',
      localPort: 8080,
      remoteHost: 'localhost',
      remotePort: 80
    });
    console.log(`Local tunnel created: ${localTunnelId}\n`);

    // Create remote port forwarding (remote:9090 -> local:3000)
    console.log('Creating remote port forwarding...');
    const remoteTunnelId = await connection.forwardRemote({
      localHost: '127.0.0.1',
      localPort: 9090,
      remoteHost: 'localhost',
      remotePort: 3000
    });
    console.log(`Remote tunnel created: ${remoteTunnelId}\n`);

    // Keep tunnels open for a while
    console.log('Tunnels are active. Waiting 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Close tunnels
    await connection.closeTunnel(localTunnelId);
    await connection.closeTunnel(remoteTunnelId);
    console.log('Tunnels closed\n');

  } catch (error) {
    console.error('Port Forwarding Error:', error.message);
  } finally {
    await connection.disconnect();
  }
}

/**
 * Example 5: SSH Agent Authentication
 */
async function sshAgentExample() {
  console.log('=== SSH Agent Authentication Example ===\n');

  const connection = new SSHConnection({
    host: 'your-server.com',
    username: 'your-username',
    // No password or key - will use SSH agent
  });

  try {
    await connection.connect();
    console.log('Connected to SSH server\n');

    // Get SSH agent
    const agent = await connection.getAgent();
    
    // List available identities
    const identities = await agent.listIdentities();
    console.log(`Found ${identities.length} identities in SSH agent:`);
    identities.forEach((identity, index) => {
      console.log(`  ${index + 1}: ${identity.comment}`);
    });
    console.log();

    // Authenticate using first identity
    if (identities.length > 0) {
      const success = await agent.authenticate('your-username', 0);
      console.log(`Authentication ${success ? 'successful' : 'failed'}\n`);
    }

  } catch (error) {
    console.error('SSH Agent Error:', error.message);
  } finally {
    await connection.disconnect();
  }
}

/**
 * Example 6: Event-Driven SSH Operations
 */
async function eventDrivenExample() {
  console.log('=== Event-Driven SSH Example ===\n');

  const connection = new SSHConnection({
    host: 'your-server.com',
    username: 'your-username',
    password: 'your-password'
  });

  // Set up event listeners
  connection.on('connect', () => {
    console.log('🔗 Connected to SSH server');
  });

  connection.on('disconnect', () => {
    console.log('🔌 Disconnected from SSH server');
  });

  connection.on('error', (error) => {
    console.error('❌ SSH Error:', error.message);
  });

  try {
    await connection.connect();
    
    // Execute multiple commands
    const commands = ['hostname', 'uptime', 'df -h'];
    
    for (const command of commands) {
      console.log(`\nExecuting: ${command}`);
      const result = await connection.exec(command);
      console.log(result.stdout.trim());
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.disconnect();
  }
}

// Run examples (uncomment to test)
if (require.main === module) {
  console.log('🚀 SSH Wrapper Examples\n');
  console.log('Uncomment the example you want to run:\n');
  
  // basicSSHExample().catch(console.error);
  // sftpExample().catch(console.error);
  // interactiveShellExample().catch(console.error);
  // portForwardingExample().catch(console.error);
  // sshAgentExample().catch(console.error);
  // eventDrivenExample().catch(console.error);
}
