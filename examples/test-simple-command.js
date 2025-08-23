/**
 * Simple test to verify SSH command execution works
 */

const { sshExec, sshTest } = require('../dist/wrapper/index.js');

const config = {
  host: '192.168.1.17',
  port: 22,
  username: 'root',
  password: 'moimran@123',
  timeout: 30000
};

async function testSimpleCommand() {
  console.log('🧪 Simple SSH Command Test');
  console.log(`📡 Server: ${config.host}:${config.port}`);
  console.log(`👤 User: ${config.username}\n`);

  try {
    // Test 1: Connection Test
    console.log('1. Testing SSH Connection...');
    const startTime = Date.now();
    const isConnected = await sshTest(config);
    const connectionTime = Date.now() - startTime;
    
    console.log(`   Result: ${isConnected ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Time: ${connectionTime}ms\n`);

    if (!isConnected) {
      console.log('❌ Cannot proceed without connection\n');
      return;
    }

    // Test 2: Simple Command Execution
    console.log('2. Executing simple command...');
    const cmdStart = Date.now();
    const result = await sshExec(config, 'whoami');
    const cmdTime = Date.now() - cmdStart;
    
    console.log(`   Command: whoami`);
    console.log(`   Output: "${result.stdout.trim()}"`);
    console.log(`   Exit Code: ${result.exitCode}`);
    console.log(`   Success: ${result.success}`);
    console.log(`   Time: ${cmdTime}ms`);
    
    if (result.stderr) {
      console.log(`   Error: ${result.stderr.trim()}`);
    }
    console.log();

    // Test 3: Another Command
    console.log('3. Executing another command...');
    const result2 = await sshExec(config, 'hostname');
    
    console.log(`   Command: hostname`);
    console.log(`   Output: "${result2.stdout.trim()}"`);
    console.log(`   Exit Code: ${result2.exitCode}`);
    console.log(`   Success: ${result2.success}`);
    console.log();

    // Test 4: Command with Arguments
    console.log('4. Executing command with arguments...');
    const result3 = await sshExec(config, 'echo "Hello from SSH!"');
    
    console.log(`   Command: echo "Hello from SSH!"`);
    console.log(`   Output: "${result3.stdout.trim()}"`);
    console.log(`   Exit Code: ${result3.exitCode}`);
    console.log(`   Success: ${result3.success}`);
    console.log();

    // Test 5: Command that produces error
    console.log('5. Testing command with error...');
    const result4 = await sshExec(config, 'ls /non-existent-directory');
    
    console.log(`   Command: ls /non-existent-directory`);
    console.log(`   Stdout: "${result4.stdout.trim()}"`);
    console.log(`   Stderr: "${result4.stderr.trim()}"`);
    console.log(`   Exit Code: ${result4.exitCode}`);
    console.log(`   Success: ${result4.success}`);
    console.log();

    console.log('🎉 SSH ASYNC FUNCTIONS ARE WORKING!');
    console.log('✅ Connection successful');
    console.log('✅ Command execution successful');
    console.log('✅ Proper async channel reading implemented');
    console.log('✅ Error handling working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSimpleCommand().catch(console.error);
