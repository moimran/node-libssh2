/**
 * Debug Interactive Shell Performance
 */

const { NodeSSH } = require('../dist/index.js');

const config = {
  host: '192.168.1.17',
  username: 'root',
  password: 'moimran@123',
  port: 22
};

async function debugShell() {
  console.log('🔍 Debug Interactive Shell Performance');
  console.log('=====================================\n');

  const ssh = new NodeSSH();

  try {
    await ssh.connect(config);
    console.log('✅ Connected');

    await ssh.withShell(async (shell) => {
      console.log('✅ Shell started');
      
      // Test 1: Simple command with timing
      console.log('\n🧪 Test 1: Simple pwd command');
      const start1 = Date.now();
      
      await shell.write('pwd\n');
      console.log('📤 Command sent');
      
      // Read with short timeout to see what we get
      const output1 = await shell.read(100);
      const time1 = Date.now() - start1;
      console.log(`📥 Quick read (${time1}ms): "${output1}"`);
      
      // Read more if needed
      const output2 = await shell.read(200);
      const time2 = Date.now() - start1;
      console.log(`📥 Additional read (${time2}ms total): "${output2}"`);
      
      // Test 2: Using the optimized method
      console.log('\n🧪 Test 2: Using executeCommand');
      const start2 = Date.now();
      const output3 = await shell.executeCommand('whoami');
      const time3 = Date.now() - start2;
      console.log(`📥 executeCommand (${time3}ms): "${output3}"`);
      
      // Test 3: Check what the prompt looks like
      console.log('\n🧪 Test 3: Analyzing prompt');
      await shell.write('echo "PROMPT_TEST"\n');
      await new Promise(resolve => setTimeout(resolve, 50));
      const promptOutput = await shell.read(200);
      console.log(`📥 Prompt analysis: "${promptOutput}"`);
      
      // Show the last line specifically
      const lines = promptOutput.split('\n');
      const lastLine = lines[lines.length - 1] || '';
      console.log(`📥 Last line: "${lastLine}"`);
      console.log(`📥 Last line length: ${lastLine.length}`);
      console.log(`📥 Last line chars: ${lastLine.split('').map(c => c.charCodeAt(0)).join(',')}`);
    });

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  } finally {
    ssh.dispose();
    console.log('🔌 Disconnected');
  }
}

if (require.main === module) {
  debugShell().catch(console.error);
}

module.exports = { debugShell };
