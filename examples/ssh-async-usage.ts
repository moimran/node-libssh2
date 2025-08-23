/**
 * Simple SSH Async Functions Usage Examples
 * 
 * These examples demonstrate how to use the simple async SSH functions.
 */

import { sshExec, sshExecMultiple, sshTest, sshInfo, SSHConfig } from '../src/wrapper/ssh-async.js';

/**
 * Example 1: Basic SSH Command Execution
 */
async function basicSSHExample() {
  console.log('=== Basic SSH Command Execution ===\n');

  const config: SSHConfig = {
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
    console.log(`Exit code: ${result.exitCode}`);
    console.log(`Success: ${result.success}\n`);

    // Execute another command
    console.log('Executing command: whoami');
    const whoamiResult = await sshExec(config, 'whoami');
    console.log(`Current user: ${whoamiResult.stdout.trim()}\n`);

  } catch (error) {
    console.error('SSH Error:', error.message);
  }
}

/**
 * Example 2: Multiple Commands Execution
 */
async function multipleCommandsExample() {
  console.log('=== Multiple Commands Execution ===\n');

  const config: SSHConfig = {
    host: 'your-server.com',
    username: 'your-username',
    privateKeyPath: '/path/to/private/key',
    timeout: 30000
  };

  try {
    // Execute multiple commands efficiently (reuses connection)
    console.log('Executing multiple commands...');
    const commands = [
      'hostname',
      'uptime',
      'df -h',
      'free -m',
      'ps aux | head -10'
    ];
    
    const results = await sshExecMultiple(config, commands);
    
    results.forEach((result, index) => {
      console.log(`\n--- Command: ${commands[index]} ---`);
      console.log(`Exit Code: ${result.exitCode}`);
      console.log(`Success: ${result.success}`);
      console.log('Output:');
      console.log(result.stdout.trim());
      
      if (result.stderr) {
        console.log('Error Output:');
        console.log(result.stderr.trim());
      }
    });

  } catch (error) {
    console.error('SSH Error:', error.message);
  }
}

/**
 * Example 3: SSH Server Information
 */
async function sshInfoExample() {
  console.log('=== SSH Server Information ===\n');

  const config: SSHConfig = {
    host: 'your-server.com',
    username: 'your-username',
    password: 'your-password'
  };

  try {
    console.log('Getting SSH server information...');
    const info = await sshInfo(config);
    
    console.log('SSH Server Info:');
    console.log(`  Banner: ${info.banner || 'Not available'}`);
    console.log(`  Authenticated: ${info.authenticated}`);
    console.log(`  Host Key Type: ${info.hostKeyType}`);
    console.log(`  Host Key Length: ${info.hostKey ? info.hostKey.length : 0} bytes\n`);

  } catch (error) {
    console.error('SSH Info Error:', error.message);
  }
}

/**
 * Example 4: Error Handling
 */
async function errorHandlingExample() {
  console.log('=== Error Handling Example ===\n');

  const badConfig: SSHConfig = {
    host: 'non-existent-server.com',
    username: 'baduser',
    password: 'badpass',
    timeout: 5000
  };

  try {
    console.log('Testing connection to non-existent server...');
    const isConnected = await sshTest(badConfig);
    console.log(`Connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);

    if (!isConnected) {
      console.log('Connection failed as expected\n');
    }

    // Try to execute command anyway (will fail)
    console.log('Attempting to execute command on failed connection...');
    const result = await sshExec(badConfig, 'echo "This will fail"');
    console.log('This should not be reached');

  } catch (error) {
    console.log(`Expected error caught: ${error.message}\n`);
  }
}

/**
 * Example 5: Different Authentication Methods
 */
async function authMethodsExample() {
  console.log('=== Authentication Methods Example ===\n');

  // Password authentication
  const passwordConfig: SSHConfig = {
    host: 'your-server.com',
    username: 'your-username',
    password: 'your-password'
  };

  // Public key authentication
  const keyConfig: SSHConfig = {
    host: 'your-server.com',
    username: 'your-username',
    privateKeyPath: '/path/to/private/key',
    passphrase: 'optional-passphrase'
  };

  try {
    console.log('Testing password authentication...');
    const passwordTest = await sshTest(passwordConfig);
    console.log(`Password auth: ${passwordTest ? 'SUCCESS' : 'FAILED'}`);

    console.log('Testing public key authentication...');
    const keyTest = await sshTest(keyConfig);
    console.log(`Public key auth: ${keyTest ? 'SUCCESS' : 'FAILED'}\n`);

  } catch (error) {
    console.error('Auth test error:', error.message);
  }
}

/**
 * Example 6: Command with Different Exit Codes
 */
async function exitCodeExample() {
  console.log('=== Exit Code Handling Example ===\n');

  const config: SSHConfig = {
    host: 'your-server.com',
    username: 'your-username',
    password: 'your-password'
  };

  try {
    // Successful command
    console.log('Executing successful command...');
    const successResult = await sshExec(config, 'echo "Hello World"');
    console.log(`Success command - Exit code: ${successResult.exitCode}, Success: ${successResult.success}`);
    console.log(`Output: ${successResult.stdout.trim()}\n`);

    // Command that fails
    console.log('Executing failing command...');
    const failResult = await sshExec(config, 'ls /non-existent-directory');
    console.log(`Fail command - Exit code: ${failResult.exitCode}, Success: ${failResult.success}`);
    console.log(`Stdout: ${failResult.stdout.trim()}`);
    console.log(`Stderr: ${failResult.stderr.trim()}\n`);

  } catch (error) {
    console.error('Command execution error:', error.message);
  }
}

// Run examples (uncomment to test)
if (require.main === module) {
  console.log('🚀 SSH Async Functions Examples\n');
  console.log('Uncomment the example you want to run:\n');
  
  // basicSSHExample().catch(console.error);
  // multipleCommandsExample().catch(console.error);
  // sshInfoExample().catch(console.error);
  // errorHandlingExample().catch(console.error);
  // authMethodsExample().catch(console.error);
  // exitCodeExample().catch(console.error);
  
  console.log('Examples ready to run!');
}
