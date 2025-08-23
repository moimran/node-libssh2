/**
 * SSH Terminal API Tests
 * 
 * Basic tests to verify the new SSH terminal APIs work correctly.
 * These tests ensure the APIs are non-blocking and high-performance.
 */

const { SSHClient, SSHTerminal, SSHShell } = require('../src/wrapper/index.js');

// Test configuration (update with your test server)
const testConfig = {
  host: process.env.SSH_TEST_HOST || '192.168.1.17',
  port: parseInt(process.env.SSH_TEST_PORT) || 22,
  username: process.env.SSH_TEST_USER || 'root',
  password: process.env.SSH_TEST_PASS || 'test-password',
  timeout: 30000
};

/**
 * Test helper to check if SSH server is available
 */
async function isSSHServerAvailable() {
  try {
    const client = new SSHClient();
    await client.connect(testConfig);
    await client.disconnect();
    return true;
  } catch (error) {
    console.log('SSH server not available for testing:', error.message);
    return false;
  }
}

/**
 * Test 1: SSHClient Basic Operations
 */
async function testSSHClientBasics() {
  console.log('Testing SSHClient basic operations...');
  
  const client = new SSHClient();
  
  // Test initial state
  if (client.connectionState !== 'disconnected') {
    throw new Error('Initial state should be disconnected');
  }
  
  if (client.isConnected) {
    throw new Error('Should not be connected initially');
  }
  
  // Test connection
  await client.connect(testConfig);
  
  if (!client.isConnected) {
    throw new Error('Should be connected after connect()');
  }
  
  if (client.connectionState !== 'authenticated') {
    throw new Error('Should be authenticated after successful connect()');
  }
  
  // Test getting session and config
  const session = client.getSession();
  if (!session) {
    throw new Error('Should return valid session');
  }
  
  const config = client.getConfig();
  if (config.host !== testConfig.host) {
    throw new Error('Config should match provided config');
  }
  
  // Test disconnection
  await client.disconnect();
  
  if (client.isConnected) {
    throw new Error('Should not be connected after disconnect()');
  }
  
  console.log('✅ SSHClient basic operations test passed');
}

/**
 * Test 2: SSHTerminal Basic Operations
 */
async function testSSHTerminalBasics() {
  console.log('Testing SSHTerminal basic operations...');
  
  const client = new SSHClient();
  await client.connect(testConfig);
  
  const terminal = new SSHTerminal(client);
  
  // Test initial state
  if (terminal.active) {
    throw new Error('Terminal should not be active initially');
  }
  
  // Test terminal start
  await terminal.start({
    term: 'xterm-256color',
    cols: 80,
    rows: 24,
    env: { 'TEST_VAR': 'test_value' }
  });
  
  if (!terminal.active) {
    throw new Error('Terminal should be active after start()');
  }
  
  // Test dimensions
  const dimensions = terminal.getDimensions();
  if (dimensions.cols !== 80 || dimensions.rows !== 24) {
    throw new Error('Dimensions should match start options');
  }
  
  // Test write operation (should be non-blocking)
  const startTime = Date.now();
  const bytesWritten = terminal.write('echo "test"\n');
  const writeTime = Date.now() - startTime;
  
  if (bytesWritten <= 0) {
    throw new Error('Write should return positive bytes written');
  }
  
  if (writeTime > 100) {
    throw new Error('Write operation should be fast (< 100ms)');
  }
  
  // Test read operation (should be non-blocking)
  await new Promise(resolve => setTimeout(resolve, 500)); // Wait for output
  
  const readStartTime = Date.now();
  const data = terminal.read(4096);
  const readTime = Date.now() - readStartTime;
  
  if (readTime > 50) {
    throw new Error('Read operation should be fast (< 50ms)');
  }
  
  if (data && data.length > 0) {
    console.log('  Read data:', data.data.toString().trim());
  }
  
  // Test resize
  terminal.resize(120, 30);
  const newDimensions = terminal.getDimensions();
  if (newDimensions.cols !== 120 || newDimensions.rows !== 30) {
    throw new Error('Resize should update dimensions');
  }
  
  // Test close
  await terminal.close();
  
  if (terminal.active) {
    throw new Error('Terminal should not be active after close()');
  }
  
  await client.disconnect();
  
  console.log('✅ SSHTerminal basic operations test passed');
}

/**
 * Test 3: Multiple Terminals on Same Connection
 */
async function testMultipleTerminals() {
  console.log('Testing multiple terminals on same connection...');
  
  const client = new SSHClient();
  await client.connect(testConfig);
  
  // Create multiple terminals
  const terminal1 = new SSHTerminal(client);
  const terminal2 = new SSHTerminal(client);
  
  await terminal1.start({ cols: 80, rows: 24 });
  await terminal2.start({ cols: 80, rows: 24 });
  
  if (!terminal1.active || !terminal2.active) {
    throw new Error('Both terminals should be active');
  }
  
  // Test independent operations
  terminal1.write('echo "Terminal 1"\n');
  terminal2.write('echo "Terminal 2"\n');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const data1 = terminal1.read(4096);
  const data2 = terminal2.read(4096);
  
  console.log('  Terminal 1 output:', data1 ? data1.data.toString().trim() : 'No data');
  console.log('  Terminal 2 output:', data2 ? data2.data.toString().trim() : 'No data');
  
  // Clean up
  await terminal1.close();
  await terminal2.close();
  await client.disconnect();
  
  console.log('✅ Multiple terminals test passed');
}

/**
 * Test 4: SSHShell Alias
 */
async function testSSHShellAlias() {
  console.log('Testing SSHShell alias...');
  
  const client = new SSHClient();
  await client.connect(testConfig);
  
  // Test that SSHShell is an alias for SSHTerminal
  const shell = new SSHShell(client);
  
  if (!(shell instanceof SSHTerminal)) {
    throw new Error('SSHShell should be instance of SSHTerminal');
  }
  
  await shell.start({ cols: 80, rows: 24 });
  
  if (!shell.active) {
    throw new Error('SSHShell should work like SSHTerminal');
  }
  
  shell.write('echo "Shell test"\n');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  const data = shell.read(4096);
  
  if (data) {
    console.log('  Shell output:', data.data.toString().trim());
  }
  
  await shell.close();
  await client.disconnect();
  
  console.log('✅ SSHShell alias test passed');
}

/**
 * Test 5: Performance and Non-blocking Behavior
 */
async function testPerformanceAndNonBlocking() {
  console.log('Testing performance and non-blocking behavior...');
  
  const client = new SSHClient();
  await client.connect(testConfig);
  
  const terminal = new SSHTerminal(client);
  await terminal.start({ cols: 80, rows: 24 });
  
  // Test that operations are non-blocking
  const operations = [];
  const startTime = Date.now();
  
  // Perform multiple operations rapidly
  for (let i = 0; i < 10; i++) {
    const opStart = Date.now();
    terminal.write(`echo "Operation ${i}"\n`);
    const opTime = Date.now() - opStart;
    operations.push(opTime);
  }
  
  const totalTime = Date.now() - startTime;
  const avgOpTime = operations.reduce((a, b) => a + b, 0) / operations.length;
  
  console.log(`  Total time for 10 operations: ${totalTime}ms`);
  console.log(`  Average operation time: ${avgOpTime.toFixed(2)}ms`);
  
  if (avgOpTime > 10) {
    throw new Error('Operations should be fast (< 10ms average)');
  }
  
  if (totalTime > 200) {
    throw new Error('Total time should be reasonable (< 200ms for 10 ops)');
  }
  
  await terminal.close();
  await client.disconnect();
  
  console.log('✅ Performance and non-blocking test passed');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Starting SSH Terminal API Tests\n');
  
  // Check if SSH server is available
  const serverAvailable = await isSSHServerAvailable();
  if (!serverAvailable) {
    console.log('⚠️  SSH server not available - skipping tests');
    console.log('   Set SSH_TEST_HOST, SSH_TEST_USER, SSH_TEST_PASS environment variables');
    return;
  }
  
  try {
    await testSSHClientBasics();
    await testSSHTerminalBasics();
    await testMultipleTerminals();
    await testSSHShellAlias();
    await testPerformanceAndNonBlocking();
    
    console.log('\n🎉 All SSH Terminal API tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ SSHClient connection management');
    console.log('✅ SSHTerminal basic operations');
    console.log('✅ Multiple terminals on same connection');
    console.log('✅ SSHShell alias functionality');
    console.log('✅ Performance and non-blocking behavior');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other files
module.exports = {
  testSSHClientBasics,
  testSSHTerminalBasics,
  testMultipleTerminals,
  testSSHShellAlias,
  testPerformanceAndNonBlocking,
  runAllTests
};

// Run if called directly
if (require.main === module) {
  runAllTests();
}
