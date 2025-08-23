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
exports.LIBSSH2_VERSION = exports.VERSION = exports.NodeSSH = exports.SSHUtils = exports.SSHShell = exports.SSHClient = exports.isNull = exports.readCString = exports.cstr = exports.loadlibssh2 = void 0;
// Core FFI bindings
var ffi_js_1 = require("./core/ffi.js");
Object.defineProperty(exports, "loadlibssh2", { enumerable: true, get: function () { return ffi_js_1.loadlibssh2; } });
Object.defineProperty(exports, "cstr", { enumerable: true, get: function () { return ffi_js_1.cstr; } });
Object.defineProperty(exports, "readCString", { enumerable: true, get: function () { return ffi_js_1.readCString; } });
Object.defineProperty(exports, "isNull", { enumerable: true, get: function () { return ffi_js_1.isNull; } });
// Main SSH client classes
var ssh_client_js_1 = require("./client/ssh-client.js");
Object.defineProperty(exports, "SSHClient", { enumerable: true, get: function () { return ssh_client_js_1.SSHClient; } });
var ssh_shell_js_1 = require("./client/ssh-shell.js");
Object.defineProperty(exports, "SSHShell", { enumerable: true, get: function () { return ssh_shell_js_1.SSHShell; } });
var ssh_utils_js_1 = require("./client/ssh-utils.js");
Object.defineProperty(exports, "SSHUtils", { enumerable: true, get: function () { return ssh_utils_js_1.SSHUtils; } });
// Node-SSH compatible API (recommended)
var node_ssh_js_1 = require("./client/node-ssh.js");
Object.defineProperty(exports, "NodeSSH", { enumerable: true, get: function () { return node_ssh_js_1.NodeSSH; } });
// Version info
exports.VERSION = '1.0.0';
exports.LIBSSH2_VERSION = '1.11.2_DEV';
/**
 * Quick start examples:
 *
 * Node-SSH compatible API (recommended):
 * ```javascript
 * const { NodeSSH } = require('node-libssh2');
 *
 * const ssh = new NodeSSH();
 * await ssh.connect({
 *   host: '192.168.1.100',
 *   username: 'root',
 *   password: 'password'
 * });
 *
 * const result = await ssh.execCommand('pwd');
 * console.log(result.stdout);
 * ssh.dispose();
 * ```
 *
 * Original API (still supported):
 * ```javascript
 * const { SSHUtils } = require('node-libssh2');
 *
 * const result = await SSHUtils.executeCommand({
 *   hostname: '192.168.1.100',
 *   username: 'root',
 *   password: 'password'
 * }, 'pwd');
 *
 * console.log(result.output);
 * ```
 */
//# sourceMappingURL=index.js.map