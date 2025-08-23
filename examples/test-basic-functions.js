/**
 * Test basic libssh2 functions to see what's actually working
 */

const { loadlibssh2 } = require('../dist/core/ffi.js');

console.log('🧪 Testing Basic libssh2 Functions\n');

try {
  const lib = loadlibssh2();
  
  console.log('1. Testing Library Initialization...');
  
  // Test basic initialization
  if (lib.libssh2_init) {
    console.log('   ✅ libssh2_init available');
    const initResult = lib.libssh2_init(0);
    console.log(`   ✅ libssh2_init(0) result: ${initResult}`);
  } else {
    console.log('   ❌ libssh2_init not available');
  }
  
  console.log('\n2. Testing Session Functions...');
  
  // Test session creation
  if (lib.libssh2_session_init_ex) {
    console.log('   ✅ libssh2_session_init_ex available');
    const session = lib.libssh2_session_init_ex(null, null, null, null);
    console.log(`   ✅ Session created: ${session ? 'Yes' : 'No'}`);
    
    if (session) {
      // Test session configuration
      if (lib.libssh2_session_set_blocking) {
        console.log('   ✅ libssh2_session_set_blocking available');
        lib.libssh2_session_set_blocking(session, 1);
        console.log('   ✅ Session set to blocking mode');
      }
      
      if (lib.libssh2_session_set_timeout) {
        console.log('   ✅ libssh2_session_set_timeout available');
        lib.libssh2_session_set_timeout(session, 30000);
        console.log('   ✅ Session timeout set to 30 seconds');
      }
      
      // Test session cleanup
      if (lib.libssh2_session_free) {
        console.log('   ✅ libssh2_session_free available');
        const freeResult = lib.libssh2_session_free(session);
        console.log(`   ✅ Session freed, result: ${freeResult}`);
      }
    }
  } else {
    console.log('   ❌ libssh2_session_init_ex not available');
  }
  
  console.log('\n3. Testing Authentication Functions...');
  
  if (lib.libssh2_userauth_password_ex) {
    console.log('   ✅ libssh2_userauth_password_ex available');
  } else {
    console.log('   ❌ libssh2_userauth_password_ex not available');
  }
  
  if (lib.libssh2_userauth_publickey_fromfile_ex) {
    console.log('   ✅ libssh2_userauth_publickey_fromfile_ex available');
  } else {
    console.log('   ❌ libssh2_userauth_publickey_fromfile_ex not available');
  }
  
  if (lib.libssh2_userauth_authenticated) {
    console.log('   ✅ libssh2_userauth_authenticated available');
  } else {
    console.log('   ❌ libssh2_userauth_authenticated not available');
  }
  
  console.log('\n4. Testing Channel Functions...');
  
  if (lib.libssh2_channel_open_ex) {
    console.log('   ✅ libssh2_channel_open_ex available');
  } else {
    console.log('   ❌ libssh2_channel_open_ex not available');
  }
  
  if (lib.libssh2_channel_process_startup) {
    console.log('   ✅ libssh2_channel_process_startup available');
  } else {
    console.log('   ❌ libssh2_channel_process_startup not available');
  }
  
  if (lib.libssh2_channel_read_ex) {
    console.log('   ✅ libssh2_channel_read_ex available');
  } else {
    console.log('   ❌ libssh2_channel_read_ex not available');
  }
  
  if (lib.libssh2_channel_eof) {
    console.log('   ✅ libssh2_channel_eof available');
  } else {
    console.log('   ❌ libssh2_channel_eof not available');
  }
  
  if (lib.libssh2_channel_get_exit_status) {
    console.log('   ✅ libssh2_channel_get_exit_status available');
  } else {
    console.log('   ❌ libssh2_channel_get_exit_status not available');
  }
  
  if (lib.libssh2_channel_close) {
    console.log('   ✅ libssh2_channel_close available');
  } else {
    console.log('   ❌ libssh2_channel_close not available');
  }
  
  if (lib.libssh2_channel_free) {
    console.log('   ✅ libssh2_channel_free available');
  } else {
    console.log('   ❌ libssh2_channel_free not available');
  }
  
  console.log('\n5. Testing Network Functions...');
  
  if (lib.libssh2_session_handshake) {
    console.log('   ✅ libssh2_session_handshake available');
  } else {
    console.log('   ❌ libssh2_session_handshake not available');
  }
  
  if (lib.libssh2_session_disconnect_ex) {
    console.log('   ✅ libssh2_session_disconnect_ex available');
  } else {
    console.log('   ❌ libssh2_session_disconnect_ex not available');
  }
  
  console.log('\n6. Testing Cleanup Functions...');
  
  if (lib.libssh2_exit) {
    console.log('   ✅ libssh2_exit available');
    lib.libssh2_exit();
    console.log('   ✅ libssh2_exit() called successfully');
  } else {
    console.log('   ❌ libssh2_exit not available');
  }
  
  console.log('\n🎉 Basic Function Test Complete!');
  
  // Summary of essential functions
  const essentialFunctions = [
    'libssh2_init',
    'libssh2_session_init_ex',
    'libssh2_session_handshake',
    'libssh2_userauth_password_ex',
    'libssh2_channel_open_ex',
    'libssh2_channel_process_startup',
    'libssh2_channel_read_ex',
    'libssh2_channel_eof',
    'libssh2_session_free',
    'libssh2_exit'
  ];
  
  console.log('\n📊 Essential Functions Summary:');
  let availableCount = 0;
  essentialFunctions.forEach(funcName => {
    const available = typeof lib[funcName] === 'function';
    console.log(`   ${available ? '✅' : '❌'} ${funcName}`);
    if (available) availableCount++;
  });
  
  console.log(`\n📈 Availability: ${availableCount}/${essentialFunctions.length} essential functions available`);
  
  if (availableCount === essentialFunctions.length) {
    console.log('🎉 All essential functions are available! SSH should work.');
  } else {
    console.log('⚠️  Some essential functions are missing. SSH may not work properly.');
  }

} catch (error) {
  console.error('❌ Test failed:', error.message);
}
