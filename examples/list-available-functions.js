/**
 * List all available libssh2 functions
 */

const { loadlibssh2 } = require('../dist/core/ffi.js');

console.log('📋 Listing All Available libssh2 Functions\n');

try {
  const lib = loadlibssh2();
  
  // Get all function names
  const functionNames = Object.keys(lib)
    .filter(key => typeof lib[key] === 'function')
    .sort();
  
  console.log(`Total functions available: ${functionNames.length}\n`);
  
  // Group functions by category
  const categories = {
    'Session Management': [],
    'Authentication': [],
    'Channel Operations': [],
    'SFTP Operations': [],
    'Agent Operations': [],
    'Known Hosts': [],
    'Crypto/Keys': [],
    'Utility': [],
    'Other': []
  };
  
  functionNames.forEach(name => {
    if (name.includes('session')) {
      categories['Session Management'].push(name);
    } else if (name.includes('userauth') || name.includes('auth')) {
      categories['Authentication'].push(name);
    } else if (name.includes('channel')) {
      categories['Channel Operations'].push(name);
    } else if (name.includes('sftp')) {
      categories['SFTP Operations'].push(name);
    } else if (name.includes('agent')) {
      categories['Agent Operations'].push(name);
    } else if (name.includes('knownhost')) {
      categories['Known Hosts'].push(name);
    } else if (name.includes('key') || name.includes('crypto') || name.includes('hash')) {
      categories['Crypto/Keys'].push(name);
    } else if (name.includes('init') || name.includes('exit') || name.includes('version') || name.includes('banner')) {
      categories['Utility'].push(name);
    } else {
      categories['Other'].push(name);
    }
  });
  
  // Print categorized functions
  Object.entries(categories).forEach(([category, functions]) => {
    if (functions.length > 0) {
      console.log(`${category} (${functions.length} functions):`);
      functions.forEach(func => {
        console.log(`  - ${func}`);
      });
      console.log();
    }
  });
  
  // Look for essential SSH functions with different names
  console.log('🔍 Looking for Essential SSH Functions:\n');
  
  const essentialMappings = {
    'Session Init': functionNames.filter(f => f.includes('session') && f.includes('init')),
    'Session Handshake': functionNames.filter(f => f.includes('handshake')),
    'Password Auth': functionNames.filter(f => f.includes('userauth') && f.includes('password')),
    'Key Auth': functionNames.filter(f => f.includes('userauth') && (f.includes('publickey') || f.includes('key'))),
    'Channel Open': functionNames.filter(f => f.includes('channel') && f.includes('open')),
    'Channel Exec': functionNames.filter(f => f.includes('channel') && f.includes('exec')),
    'Channel Read': functionNames.filter(f => f.includes('channel') && f.includes('read')),
    'Channel Write': functionNames.filter(f => f.includes('channel') && f.includes('write')),
    'Session Disconnect': functionNames.filter(f => f.includes('session') && f.includes('disconnect')),
    'Session Free': functionNames.filter(f => f.includes('session') && f.includes('free'))
  };
  
  Object.entries(essentialMappings).forEach(([operation, matches]) => {
    console.log(`${operation}:`);
    if (matches.length > 0) {
      matches.forEach(match => console.log(`  ✅ ${match}`));
    } else {
      console.log(`  ❌ No matches found`);
    }
    console.log();
  });
  
} catch (error) {
  console.error('❌ Failed to list functions:', error.message);
}
