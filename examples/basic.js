/**
 * Basic SSH Usage Examples
 * 
 * This example demonstrates the most common use cases for node-libssh2.
 */

const { SSHClient, SSHShell, SSHUtils } = require('../dist/index.js');

// Connection configuration
const connectionOptions = {
  hostname: '192.168.1.17',  // Replace with your SSH server
  port: 22,
  username: 'root',          // Replace with your username
  password: 'moimran@123'    // Replace with your password
};

async function basicExamples() {
  console.log('🚀 node-libssh2 Basic Examples');
  console.log('==============================\n');

  // Example 1: Quick command execution
  console.log('📋 Example 1: Quick Command Execution');
  console.log('-------------------------------------');
  
  try {
    const result = await SSHUtils.executeCommand(connectionOptions, 'pwd');
    console.log(`✅ Command: pwd`);
    console.log(`📁 Output: ${result.output}`);
    console.log(`🔢 Exit Code: ${result.exitCode}`);
    console.log(`✨ Success: ${result.success}\n`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  // Example 2: Test connection
  console.log('🔗 Example 2: Test Connection');
  console.log('-----------------------------');
  
  const isConnectable = await SSHUtils.testConnection(connectionOptions);
  console.log(`🔌 Connection test: ${isConnectable ? '✅ Success' : '❌ Failed'}\n`);

  // Example 3: Get system information
  console.log('🖥️ Example 3: System Information');
  console.log('--------------------------------');
  
  try {
    const sysInfo = await SSHUtils.getSystemInfo(connectionOptions);
    console.log(`🏠 Hostname: ${sysInfo.hostname}`);
    console.log(`💻 OS: ${sysInfo.os}`);
    console.log(`⏰ Uptime: ${sysInfo.uptime}`);
    console.log(`👤 User: ${sysInfo.currentUser}`);
    console.log(`📂 Directory: ${sysInfo.currentDirectory}\n`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  // Example 4: Persistent connection with multiple commands
  console.log('🔄 Example 4: Persistent Connection');
  console.log('-----------------------------------');
  
  const client = new SSHClient();
  
  try {
    console.log('🔌 Connecting...');
    await client.connect(connectionOptions);
    console.log('✅ Connected!\n');

    // Execute multiple commands efficiently
    const commands = ['whoami', 'pwd', 'date', 'uname -r'];
    
    for (const cmd of commands) {
      console.log(`💻 Executing: ${cmd}`);
      const result = await client.executeCommand(cmd);
      console.log(`📤 Output: ${result.output}`);
      console.log(`🔢 Exit: ${result.exitCode}\n`);
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  } finally {
    console.log('🔌 Disconnecting...');
    client.disconnect();
    console.log('✅ Disconnected!\n');
  }

  // Example 5: Interactive shell (basic)
  console.log('🐚 Example 5: Interactive Shell');
  console.log('-------------------------------');
  
  const shellClient = new SSHClient();
  
  try {
    await shellClient.connect(connectionOptions);
    console.log('✅ Connected for shell session');

    const shell = new SSHShell(shellClient);
    await shell.start({ terminalType: 'xterm', width: 80, height: 24 });
    console.log('✅ Shell started\n');

    // Read initial prompt
    console.log('📖 Reading initial prompt...');
    const initialOutput = await shell.read(2000);
    console.log('📋 Initial output:');
    console.log(initialOutput);

    // Send a simple command
    console.log('\n💻 Sending: pwd');
    await shell.write('pwd\n');
    
    // Wait for output
    await new Promise(resolve => setTimeout(resolve, 500));
    const pwdOutput = await shell.read(1000);
    console.log('📤 PWD output:');
    console.log(pwdOutput);

    shell.close();
    console.log('\n✅ Shell closed');

  } catch (error) {
    console.error(`❌ Shell error: ${error.message}`);
  } finally {
    shellClient.disconnect();
    console.log('✅ Shell client disconnected\n');
  }

  console.log('🎉 EXAMPLES COMPLETE!');
  console.log('=====================');
  console.log('✅ All basic operations demonstrated');
  console.log('✅ Ready for production use');
  console.log('✅ Check other examples for advanced usage');
}

// Run the examples
if (require.main === module) {
  basicExamples().catch(console.error);
}

module.exports = { basicExamples };
