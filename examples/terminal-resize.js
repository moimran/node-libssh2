/**
 * Terminal Resize Example
 * 
 * Demonstrates SSH terminal resize functionality for xterm.js integration
 */

const { SSHClient, SSHShell } = require('../dist/index.js');

// Connection configuration
const connectionOptions = {
  host: '192.168.1.17',
  username: 'root',
  password: 'moimran@123'
};

async function demonstrateTerminalResize() {
  console.log('🖥️  SSH Terminal Resize Demo');
  console.log('============================\n');

  const client = new SSHClient();
  
  try {
    console.log('🔌 Connecting to SSH server...');
    await client.connect(connectionOptions);
    console.log('✅ Connected successfully\n');

    console.log('🚀 Starting interactive shell...');
    const shell = new SSHShell(client);
    
    // Start with standard terminal size
    await shell.start({
      terminalType: 'xterm',
      width: 80,
      height: 24
    });
    console.log('✅ Shell started with 80x24 dimensions\n');

    // Demonstrate dimension tracking
    console.log('📏 Initial Dimensions:');
    console.log(shell.getDimensions());
    console.log();

    // Simulate xterm.js resize events
    console.log('🔄 Simulating terminal resize events...\n');

    // Resize 1: Larger terminal (common laptop screen)
    console.log('📺 Resizing to 120x30 (larger terminal)...');
    await shell.resize(120, 30);
    console.log('✅ Resized successfully');
    console.log('📏 New dimensions:', shell.getDimensions());
    
    // Test terminal functionality after resize
    await shell.write('echo "Terminal is now 120 columns wide"\n');
    await new Promise(resolve => setTimeout(resolve, 500));
    let output = await shell.read(1000);
    console.log('📤 Output:', output.split('\n').pop().trim());
    console.log();

    // Resize 2: Mobile/tablet size
    console.log('📱 Resizing to 60x20 (mobile/tablet)...');
    await shell.resizeTerminal(60, 20);  // Using alias method
    console.log('✅ Resized successfully');
    console.log('📏 New dimensions:', shell.getDimensions());
    
    await shell.write('echo "Now 60 cols"\n');
    await new Promise(resolve => setTimeout(resolve, 500));
    output = await shell.read(1000);
    console.log('📤 Output:', output.split('\n').pop().trim());
    console.log();

    // Resize 3: Ultra-wide monitor
    console.log('🖥️  Resizing to 200x50 (ultra-wide monitor)...');
    await shell.resize(200, 50);
    console.log('✅ Resized successfully');
    console.log('📏 New dimensions:', shell.getDimensions());
    
    await shell.write('echo "Ultra-wide terminal with 200 columns!"\n');
    await new Promise(resolve => setTimeout(resolve, 500));
    output = await shell.read(1000);
    console.log('📤 Output:', output.split('\n').pop().trim());
    console.log();

    // Demonstrate error handling
    console.log('❌ Testing error handling with invalid dimensions...');
    try {
      await shell.resize(-10, 0);
    } catch (error) {
      console.log('✅ Properly caught error:', error.message);
    }
    console.log();

    // Final demonstration with a command that shows terminal width
    console.log('🧪 Final test - showing terminal width detection...');
    await shell.resize(100, 25);
    await shell.write('tput cols && echo "columns detected"\n');
    await new Promise(resolve => setTimeout(resolve, 500));
    output = await shell.read(1000);
    console.log('📤 Terminal width detection output:');
    console.log(output.split('\n').slice(-3, -1).join('\n'));

    shell.close();
    console.log('\n✅ Shell closed');

  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    client.disconnect();
    console.log('✅ Disconnected');
  }
}

// Run the demonstration
demonstrateTerminalResize().then(() => {
  console.log('\n🎉 Terminal resize demonstration complete!');
  console.log('\n💡 Integration Tips:');
  console.log('   - Use shell.resize(cols, rows) when xterm.js fires resize events');
  console.log('   - Call shell.getDimensions() to verify current size');
  console.log('   - Handle resize errors gracefully in production');
  console.log('   - Perfect for responsive terminal applications');
}).catch(console.error);
