"use strict";
/**
 * node-libssh2 - High-performance SSH client for Node.js
 *
 * This package provides native libssh2 bindings for Node.js applications,
 * offering high-performance SSH connections, command execution, and interactive shells.
 *
 * @author AtlasTerminal Team
 * @license MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIBSSH2_VERSION = exports.VERSION = exports.sshInfo = exports.sshTest = exports.sshExecMultiple = exports.sshExec = exports.Listener = exports.KnownHost = exports.Agent = exports.SFTPHandle = exports.SFTP = exports.Channel = exports.Session = exports.isNull = exports.readCString = exports.cstr = exports.loadlibssh2 = void 0;
// Core FFI bindings
var ffi_js_1 = require("./core/ffi.js");
Object.defineProperty(exports, "loadlibssh2", { enumerable: true, get: function () { return ffi_js_1.loadlibssh2; } });
Object.defineProperty(exports, "cstr", { enumerable: true, get: function () { return ffi_js_1.cstr; } });
Object.defineProperty(exports, "readCString", { enumerable: true, get: function () { return ffi_js_1.readCString; } });
Object.defineProperty(exports, "isNull", { enumerable: true, get: function () { return ffi_js_1.isNull; } });
// Core low-level classes (ssh2-python compatible)
var session_js_1 = require("./core/session.js");
Object.defineProperty(exports, "Session", { enumerable: true, get: function () { return session_js_1.Session; } });
var channel_js_1 = require("./core/channel.js");
Object.defineProperty(exports, "Channel", { enumerable: true, get: function () { return channel_js_1.Channel; } });
var sftp_js_1 = require("./core/sftp.js");
Object.defineProperty(exports, "SFTP", { enumerable: true, get: function () { return sftp_js_1.SFTP; } });
var sftp_handle_js_1 = require("./core/sftp-handle.js");
Object.defineProperty(exports, "SFTPHandle", { enumerable: true, get: function () { return sftp_handle_js_1.SFTPHandle; } });
var agent_js_1 = require("./core/agent.js");
Object.defineProperty(exports, "Agent", { enumerable: true, get: function () { return agent_js_1.Agent; } });
var knownhost_js_1 = require("./core/knownhost.js");
Object.defineProperty(exports, "KnownHost", { enumerable: true, get: function () { return knownhost_js_1.KnownHost; } });
var listener_js_1 = require("./core/listener.js");
Object.defineProperty(exports, "Listener", { enumerable: true, get: function () { return listener_js_1.Listener; } });
// High-level async wrapper functions (recommended for most users)
var ssh_async_js_1 = require("./wrapper/ssh-async.js");
Object.defineProperty(exports, "sshExec", { enumerable: true, get: function () { return ssh_async_js_1.sshExec; } });
Object.defineProperty(exports, "sshExecMultiple", { enumerable: true, get: function () { return ssh_async_js_1.sshExecMultiple; } });
Object.defineProperty(exports, "sshTest", { enumerable: true, get: function () { return ssh_async_js_1.sshTest; } });
Object.defineProperty(exports, "sshInfo", { enumerable: true, get: function () { return ssh_async_js_1.sshInfo; } });
// Version info
exports.VERSION = '1.0.0';
exports.LIBSSH2_VERSION = '1.11.2_DEV';
/**
 * Quick start examples:
 *
 * High-level async functions (recommended):
 * ```javascript
 * const { sshExec, sshTest } = require('node-libssh2');
 *
 * // Test connection
 * const connected = await sshTest({
 *   host: '192.168.1.100',
 *   username: 'root',
 *   password: 'password'
 * });
 *
 * // Execute command
 * const result = await sshExec({
 *   host: '192.168.1.100',
 *   username: 'root',
 *   password: 'password'
 * }, 'pwd');
 *
 * console.log(result.stdout);
 * ```
 *
 * Low-level core classes (for advanced users):
 * ```javascript
 * const { Session, Channel } = require('node-libssh2');
 *
 * const session = new Session();
 * // ... low-level session operations
 * ```
 */
//# sourceMappingURL=index.js.map