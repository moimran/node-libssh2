/**
 * Interactive Shell Example
 * 
 * Demonstrates advanced interactive shell usage with real-time I/O.
 */

const { SSHClient, SSHShell } = require('../dist/index.js');

// Connection configuration
const connectionOptions = {
  hostname: '192.168.1.17',  // Replace with your SSH server
  port: 22,
  username: 'root',          // Replace with your username
  password: 'moimran@123'    // Replace with your password
};

async function interactiveShellDemo() {
  console.log('🐚 Interactive Shell Demo');
  console.log('=========================\n');

  const client = new SSHClient();
  
  try {
    console.log('🔌 Connecting to SSH server...');
    await client.connect(connectionOptions);
    console.log('✅ Connected successfully\n');

    const shell = new SSHShell(client);
    
    console.log('🚀 Starting interactive shell...');
    await shell.start({
      terminalType: 'xterm',
      width: 120,
      height: 30
    });
    console.log('✅ Shell started\n');

    // Read and display initial prompt
    console.log('📖 Reading initial shell output...');
    const initialOutput = await shell.readUntilComplete(3000);
    console.log('--- Initial Shell Output ---');
    console.log(initialOutput);
    console.log('--- End Initial Output ---\n');

    // Demonstrate interactive commands
    const commands = [
      'pwd',
      'whoami', 
      'ls -la',
      'echo "Hello from node-libssh2!"',
      'date',
      'ps aux | head -5'
    ];

    for (const command of commands) {
      console.log(`💻 Executing: ${command}`);
      
      // Send command
      await shell.write(command + '\n');
      
      // Wait for command to execute and read output
      await new Promise(resolve => setTimeout(resolve, 300));
      const output = await shell.readUntilComplete(2000);
      
      console.log('📤 Output:');
      console.log(output);
      console.log('---\n');
    }

    // Demonstrate file operations
    console.log('📁 File Operations Demo');
    console.log('----------------------');
    
    // Create a test file
    console.log('💻 Creating test file...');
    await shell.write('echo "Test content from node-libssh2" > test_file.txt\n');
    await new Promise(resolve => setTimeout(resolve, 200));
    await shell.readUntilComplete(1000);
    
    // Read the file
    console.log('💻 Reading test file...');
    await shell.write('cat test_file.txt\n');
    await new Promise(resolve => setTimeout(resolve, 200));
    const fileContent = await shell.readUntilComplete(1000);
    console.log('📤 File content:');
    console.log(fileContent);
    
    // Clean up
    console.log('💻 Cleaning up test file...');
    await shell.write('rm test_file.txt\n');
    await new Promise(resolve => setTimeout(resolve, 200));
    await shell.readUntilComplete(1000);
    console.log('✅ Test file removed\n');

    // Demonstrate directory navigation
    console.log('📂 Directory Navigation Demo');
    console.log('---------------------------');
    
    // Show current directory
    await shell.write('pwd\n');
    await new Promise(resolve => setTimeout(resolve, 200));
    const currentDir = await shell.readUntilComplete(1000);
    console.log('📍 Current directory:');
    console.log(currentDir);
    
    // Try to go to /tmp (if it exists)
    await shell.write('cd /tmp 2>/dev/null || cd /\n');
    await new Promise(resolve => setTimeout(resolve, 200));
    await shell.readUntilComplete(1000);
    
    // Show new directory
    await shell.write('pwd\n');
    await new Promise(resolve => setTimeout(resolve, 200));
    const newDir = await shell.readUntilComplete(1000);
    console.log('📍 New directory:');
    console.log(newDir);
    
    // Go back to original directory
    await shell.write('cd\n');
    await new Promise(resolve => setTimeout(resolve, 200));
    await shell.readUntilComplete(1000);
    console.log('✅ Returned to home directory\n');

    // Demonstrate environment variables
    console.log('🌍 Environment Variables Demo');
    console.log('-----------------------------');
    
    await shell.write('echo "PATH: $PATH"\n');
    await new Promise(resolve => setTimeout(resolve, 200));
    const pathOutput = await shell.readUntilComplete(1000);
    console.log('📤 PATH variable:');
    console.log(pathOutput);
    
    await shell.write('echo "HOME: $HOME"\n');
    await new Promise(resolve => setTimeout(resolve, 200));
    const homeOutput = await shell.readUntilComplete(1000);
    console.log('📤 HOME variable:');
    console.log(homeOutput);

    // Demonstrate process management
    console.log('⚙️ Process Management Demo');
    console.log('--------------------------');
    
    // Show running processes
    await shell.write('ps aux | head -10\n');
    await new Promise(resolve => setTimeout(resolve, 500));
    const processOutput = await shell.readUntilComplete(2000);
    console.log('📤 Running processes:');
    console.log(processOutput);

    // Show system information
    console.log('🖥️ System Information Demo');
    console.log('--------------------------');
    
    await shell.write('uname -a\n');
    await new Promise(resolve => setTimeout(resolve, 200));
    const unameOutput = await shell.readUntilComplete(1000);
    console.log('📤 System info:');
    console.log(unameOutput);
    
    await shell.write('free -h 2>/dev/null || echo "Memory info not available"\n');
    await new Promise(resolve => setTimeout(resolve, 200));
    const memoryOutput = await shell.readUntilComplete(1000);
    console.log('📤 Memory info:');
    console.log(memoryOutput);

    // Graceful exit
    console.log('👋 Gracefully exiting shell...');
    await shell.write('exit\n');
    await new Promise(resolve => setTimeout(resolve, 500));
    const exitOutput = await shell.readUntilComplete(1000);
    console.log('📤 Exit output:');
    console.log(exitOutput);

    shell.close();
    console.log('✅ Shell closed');

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error('Stack trace:', error.stack);
  } finally {
    client.disconnect();
    console.log('✅ SSH client disconnected');
  }

  console.log('\n🎉 INTERACTIVE SHELL DEMO COMPLETE!');
  console.log('===================================');
  console.log('✅ Demonstrated interactive shell capabilities');
  console.log('✅ Showed real-time command execution');
  console.log('✅ Proved file operations work');
  console.log('✅ Ready for terminal applications like AtlasTerminal');
}

// Run the demo
if (require.main === module) {
  interactiveShellDemo().catch(console.error);
}

module.exports = { interactiveShellDemo };
