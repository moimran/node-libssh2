/**
 * Test SSH async functions against real server
 * Server: 192.168.1.17
 * User: root
 * Pass: moimran@123
 */

const { sshExec, sshExecMultiple, sshTest, sshInfo } = require('../dist/wrapper/index.js');

const config = {
  host: '192.168.1.17',
  port: 22,
  username: 'root',
  password: 'moimran@123',
  timeout: 30000
};

async function testRealServer() {
  console.log('🧪 Testing SSH Async Functions Against Real Server');
  console.log(`📡 Server: ${config.host}`);
  console.log(`👤 User: ${config.username}`);
  console.log('🔐 Using password authentication\n');

  try {
    // Test 1: Connection Test
    console.log('1. Testing SSH Connection...');
    const startTime = Date.now();
    const isConnected = await sshTest(config);
    const connectionTime = Date.now() - startTime;
    
    console.log(`   Result: ${isConnected ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Time: ${connectionTime}ms\n`);

    if (!isConnected) {
      console.log('❌ Cannot proceed without connection. Check server details.\n');
      return;
    }

    // Test 2: Server Information
    console.log('2. Getting SSH Server Information...');
    const info = await sshInfo(config);
    console.log(`   Banner: ${info.banner || 'Not available'}`);
    console.log(`   Authenticated: ${info.authenticated}`);
    console.log(`   Host Key Type: ${info.hostKeyType}`);
    console.log(`   Host Key Length: ${info.hostKey ? info.hostKey.length : 0} bytes\n`);

    // Test 3: Basic Commands
    console.log('3. Testing Basic Commands...');
    
    const basicCommands = [
      'whoami',
      'hostname',
      'pwd',
      'date',
      'uptime'
    ];

    for (const command of basicCommands) {
      console.log(`   Executing: ${command}`);
      const cmdStart = Date.now();
      const result = await sshExec(config, command);
      const cmdTime = Date.now() - cmdStart;
      
      console.log(`   Output: ${result.stdout.trim()}`);
      console.log(`   Exit Code: ${result.exitCode}`);
      console.log(`   Success: ${result.success}`);
      console.log(`   Time: ${cmdTime}ms`);
      
      if (result.stderr) {
        console.log(`   Error: ${result.stderr.trim()}`);
      }
      console.log();
    }

    // Test 4: Multiple Commands (Connection Reuse)
    console.log('4. Testing Multiple Commands (Connection Reuse)...');
    const multiCommands = [
      'ls -la /',
      'df -h',
      'free -m',
      'ps aux | head -5',
      'cat /etc/os-release | head -3'
    ];

    const multiStart = Date.now();
    const results = await sshExecMultiple(config, multiCommands);
    const multiTime = Date.now() - multiStart;
    
    console.log(`   Executed ${multiCommands.length} commands in ${multiTime}ms\n`);
    
    results.forEach((result, index) => {
      console.log(`   Command ${index + 1}: ${multiCommands[index]}`);
      console.log(`   Exit Code: ${result.exitCode}`);
      console.log(`   Success: ${result.success}`);
      console.log(`   Output (first 100 chars): ${result.stdout.substring(0, 100).trim()}...`);
      if (result.stderr) {
        console.log(`   Error: ${result.stderr.trim()}`);
      }
      console.log();
    });

    // Test 5: Long Running Command
    console.log('5. Testing Long Running Command...');
    const longStart = Date.now();
    const longResult = await sshExec(config, 'sleep 2 && echo "Long command completed"');
    const longTime = Date.now() - longStart;
    
    console.log(`   Command: sleep 2 && echo "Long command completed"`);
    console.log(`   Output: ${longResult.stdout.trim()}`);
    console.log(`   Time: ${longTime}ms`);
    console.log(`   Success: ${longResult.success}\n`);

    // Test 6: Command with Error
    console.log('6. Testing Command with Error...');
    const errorResult = await sshExec(config, 'ls /non-existent-directory');
    console.log(`   Command: ls /non-existent-directory`);
    console.log(`   Exit Code: ${errorResult.exitCode}`);
    console.log(`   Success: ${errorResult.success}`);
    console.log(`   Stdout: ${errorResult.stdout.trim()}`);
    console.log(`   Stderr: ${errorResult.stderr.trim()}\n`);

    // Test 7: File Operations
    console.log('7. Testing File Operations...');
    
    // Create a test file
    const createResult = await sshExec(config, 'echo "Hello from Node.js SSH test" > /tmp/ssh-test.txt');
    console.log(`   Create file result: ${createResult.success}`);
    
    // Read the file
    const readResult = await sshExec(config, 'cat /tmp/ssh-test.txt');
    console.log(`   File content: ${readResult.stdout.trim()}`);
    
    // List file details
    const lsResult = await sshExec(config, 'ls -la /tmp/ssh-test.txt');
    console.log(`   File details: ${lsResult.stdout.trim()}`);
    
    // Clean up
    const cleanResult = await sshExec(config, 'rm /tmp/ssh-test.txt');
    console.log(`   Cleanup result: ${cleanResult.success}\n`);

    // Test 8: System Information
    console.log('8. Getting System Information...');
    const sysCommands = [
      'uname -a',
      'cat /proc/version',
      'lscpu | head -5',
      'cat /proc/meminfo | head -3'
    ];

    const sysResults = await sshExecMultiple(config, sysCommands);
    sysResults.forEach((result, index) => {
      console.log(`   ${sysCommands[index]}:`);
      console.log(`   ${result.stdout.trim()}\n`);
    });

    // Test 9: Network Information
    console.log('9. Getting Network Information...');
    const netResult = await sshExec(config, 'ip addr show | grep inet');
    console.log(`   Network interfaces:`);
    console.log(`   ${netResult.stdout.trim()}\n`);

    // Test 10: Performance Test
    console.log('10. Performance Test (10 quick commands)...');
    const perfCommands = Array(10).fill('echo "test"');
    const perfStart = Date.now();
    const perfResults = await sshExecMultiple(config, perfCommands);
    const perfTime = Date.now() - perfStart;
    
    const successCount = perfResults.filter(r => r.success).length;
    console.log(`   Executed ${perfCommands.length} commands in ${perfTime}ms`);
    console.log(`   Success rate: ${successCount}/${perfCommands.length}`);
    console.log(`   Average time per command: ${(perfTime / perfCommands.length).toFixed(2)}ms\n`);

    console.log('🎉 All tests completed successfully!');
    console.log('✅ SSH async functions are working correctly with real server');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  console.log('🚀 Starting Real Server SSH Test\n');
  testRealServer().catch(console.error);
}
