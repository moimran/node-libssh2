/**
 * Long-Running Commands Example
 * 
 * Demonstrates how to handle long-running SSH commands with real-time output streaming.
 * Perfect for commands like find, rsync, compilation, etc.
 */

const { SSHClient, SSHShell } = require('../dist/index.js');

// Connection configuration
const connectionOptions = {
  hostname: '192.168.1.17',  // Replace with your SSH server
  port: 22,
  username: 'root',          // Replace with your username
  password: 'moimran@123'    // Replace with your password
};

async function longRunningCommandsDemo() {
  console.log('⏳ Long-Running Commands Demo');
  console.log('==============================\n');

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

    // Example 1: Long-running find command with real-time output
    console.log('🔍 Example 1: Find command with real-time output');
    console.log('================================================');
    
    console.log('💻 Executing: time find /usr -name "*.so" 2>/dev/null | head -20');
    console.log('📊 This will show real-time output as the command runs...\n');
    
    // Send the command
    await shell.write('time find /usr -name "*.so" 2>/dev/null | head -20\n');
    
    // Wait a moment for command to start
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let lineCount = 0;
    const output1 = await shell.readLongRunningCommand(
      60000, // 1 minute timeout
      (chunk) => {
        // Real-time callback - process each chunk as it arrives
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim() && !line.includes('root@')) {
            lineCount++;
            console.log(`📄 [${lineCount}] ${line.trim()}`);
          }
        }
      }
    );
    
    console.log('\n✅ Find command completed!\n');

    // Example 2: System information gathering
    console.log('🖥️ Example 2: System information gathering');
    console.log('==========================================');
    
    console.log('💻 Executing: df -h && free -h && ps aux | head -10');
    await shell.write('df -h && free -h && ps aux | head -10\n');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const output2 = await shell.readLongRunningCommand(
      30000, // 30 seconds timeout
      (chunk) => {
        // Show output in real-time
        process.stdout.write(chunk);
      }
    );
    
    console.log('\n✅ System info command completed!\n');

    // Example 3: Directory listing with progress
    console.log('📁 Example 3: Large directory listing');
    console.log('====================================');
    
    console.log('💻 Executing: find /var/log -type f -exec ls -lh {} \\; 2>/dev/null | head -15');
    await shell.write('find /var/log -type f -exec ls -lh {} \\; 2>/dev/null | head -15\n');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let fileCount = 0;
    const output3 = await shell.readLongRunningCommand(
      45000, // 45 seconds timeout
      (chunk) => {
        // Count files as they're processed
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim() && line.includes('-rw')) {
            fileCount++;
            console.log(`📄 File ${fileCount}: ${line.trim().split(' ').pop()}`);
          }
        }
      }
    );
    
    console.log(`\n✅ Directory listing completed! Found ${fileCount} files.\n`);

    // Example 4: Network operations
    console.log('🌐 Example 4: Network operations');
    console.log('===============================');
    
    console.log('💻 Executing: ping -c 5 8.8.8.8');
    await shell.write('ping -c 5 8.8.8.8\n');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let pingCount = 0;
    const output4 = await shell.readLongRunningCommand(
      30000, // 30 seconds timeout
      (chunk) => {
        // Show ping responses in real-time
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.includes('64 bytes from')) {
            pingCount++;
            const timeMatch = line.match(/time=([0-9.]+)/);
            const time = timeMatch ? timeMatch[1] : 'unknown';
            console.log(`🏓 Ping ${pingCount}: ${time}ms`);
          }
        }
      }
    );
    
    console.log('\n✅ Ping command completed!\n');

    // Example 5: Your original find command
    console.log('🔍 Example 5: Your original find command (limited)');
    console.log('=================================================');
    
    console.log('💻 Executing: time find /etc -type f 2>/dev/null | head -30');
    console.log('📊 This demonstrates the command you were trying to run...\n');
    
    await shell.write('time find /etc -type f 2>/dev/null | head -30\n');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let foundFiles = 0;
    const output5 = await shell.readLongRunningCommand(
      120000, // 2 minutes timeout
      (chunk) => {
        // Show files as they're found
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim() && line.startsWith('/') && !line.includes('root@')) {
            foundFiles++;
            console.log(`📄 [${foundFiles}] ${line.trim()}`);
          }
        }
      }
    );
    
    console.log(`\n✅ Find command completed! Found ${foundFiles} files.\n`);

    // Clean exit
    console.log('👋 Gracefully exiting shell...');
    await shell.write('exit\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const exitOutput = await shell.readUntilComplete(2000);
    console.log('📤 Exit output:');
    console.log(exitOutput);

    shell.close();
    client.disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the demo
if (require.main === module) {
  longRunningCommandsDemo()
    .then(() => {
      console.log('\n🎉 LONG-RUNNING COMMANDS DEMO COMPLETE!');
      console.log('=======================================');
      console.log('✅ Demonstrated real-time output streaming');
      console.log('✅ Showed progress callbacks for long commands');
      console.log('✅ Handled various types of long-running operations');
      console.log('✅ Ready for production use with time-intensive commands');
    })
    .catch(error => {
      console.error('❌ Demo failed:', error);
      process.exit(1);
    });
}

module.exports = { longRunningCommandsDemo };
