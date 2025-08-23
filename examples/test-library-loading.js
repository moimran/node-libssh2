/**
 * Test libssh2 library loading and function availability
 */

const { loadlibssh2, getLibraryInfo } = require('../dist/core/ffi.js');

console.log('🧪 Testing libssh2 Library Loading\n');

try {
  // Get library info
  console.log('1. Library Information:');
  const info = getLibraryInfo();
  console.log(`   Platform: ${info.platform}`);
  console.log(`   Architecture: ${info.arch}`);
  console.log(`   Library Path: ${info.libraryPath}`);
  console.log(`   Version: ${info.version}\n`);

  // Check if library file exists
  const fs = require('fs');
  const exists = fs.existsSync(info.libraryPath);
  console.log(`2. Library File Check:`);
  console.log(`   File exists: ${exists}`);
  
  if (!exists) {
    console.log('   ❌ Library file not found!');
    console.log('   This explains why functions cannot be loaded.\n');
    
    // Try to find alternative paths
    console.log('3. Searching for alternative libssh2 libraries...');
    const path = require('path');
    const os = require('os');
    
    const searchPaths = [
      'C:\\Windows\\System32\\libssh2.dll',
      'C:\\Program Files\\Git\\usr\\bin\\msys-ssh2-1.dll',
      'C:\\msys64\\usr\\bin\\msys-ssh2-1.dll',
      path.join(process.cwd(), 'libssh2.dll'),
      path.join(process.cwd(), 'node_modules', 'libssh2', 'libssh2.dll')
    ];
    
    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        console.log(`   Found: ${searchPath}`);
      }
    }
    
    console.log('\n   💡 Solutions:');
    console.log('   1. Install libssh2 system-wide');
    console.log('   2. Place libssh2.dll in the project root');
    console.log('   3. Use a different SSH library like ssh2');
    return;
  }
  
  console.log(`   File size: ${fs.statSync(info.libraryPath).size} bytes\n`);

  // Try to load the library
  console.log('3. Loading libssh2 library...');
  const lib = loadlibssh2();
  console.log('   ✅ Library loaded successfully!\n');

  // Check available functions
  console.log('4. Available Functions:');
  const functionNames = Object.keys(lib).filter(key => typeof lib[key] === 'function');
  console.log(`   Total functions loaded: ${functionNames.length}`);
  
  if (functionNames.length > 0) {
    console.log('   First 10 functions:');
    functionNames.slice(0, 10).forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`);
    });
    
    if (functionNames.length > 10) {
      console.log(`   ... and ${functionNames.length - 10} more`);
    }
  } else {
    console.log('   ❌ No functions loaded!');
  }
  
  console.log();

  // Check for essential SSH functions
  console.log('5. Essential SSH Functions Check:');
  const essentialFunctions = [
    'libssh2_init',
    'libssh2_session_init',
    'libssh2_session_handshake',
    'libssh2_userauth_password',
    'libssh2_channel_open_session',
    'libssh2_channel_exec',
    'libssh2_channel_read',
    'libssh2_channel_close',
    'libssh2_session_disconnect',
    'libssh2_session_free'
  ];
  
  essentialFunctions.forEach(funcName => {
    const available = typeof lib[funcName] === 'function';
    console.log(`   ${available ? '✅' : '❌'} ${funcName}`);
  });
  
  console.log();

  // Test basic initialization
  console.log('6. Testing Basic Initialization...');
  try {
    if (lib.libssh2_init) {
      const initResult = lib.libssh2_init(0);
      console.log(`   libssh2_init result: ${initResult}`);
      
      if (lib.libssh2_session_init) {
        const session = lib.libssh2_session_init();
        console.log(`   Session created: ${session ? 'Yes' : 'No'}`);
        
        if (session && lib.libssh2_session_free) {
          lib.libssh2_session_free(session);
          console.log('   Session freed successfully');
        }
      }
      
      if (lib.libssh2_exit) {
        lib.libssh2_exit();
        console.log('   libssh2_exit called');
      }
    } else {
      console.log('   ❌ libssh2_init not available');
    }
  } catch (error) {
    console.log(`   ❌ Initialization test failed: ${error.message}`);
  }
  
  console.log();
  console.log('🎉 Library loading test completed!');

} catch (error) {
  console.error('❌ Library loading failed:', error.message);
  console.error('Stack trace:', error.stack);
  
  console.log('\n💡 Troubleshooting:');
  console.log('1. Make sure libssh2 is installed on your system');
  console.log('2. On Windows: Install Git for Windows or MSYS2');
  console.log('3. On Linux: sudo apt-get install libssh2-1-dev');
  console.log('4. On macOS: brew install libssh2');
  console.log('5. Or use a pure JavaScript SSH library like ssh2');
}
