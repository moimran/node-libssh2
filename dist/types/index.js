"use strict";
/**
 * Type definitions for node-libssh2
 *
 * Includes both original API types and node-ssh compatible types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSHCommandError = exports.SSHAuthenticationError = exports.SSHConnectionError = exports.SSHError = void 0;
/**
 * Error types that can be thrown by the library
 */
class SSHError extends Error {
    constructor(message, code, errno) {
        super(message);
        this.name = 'SSHError';
        this.code = code || null;
        this.errno = errno;
    }
}
exports.SSHError = SSHError;
class SSHConnectionError extends SSHError {
    constructor(message, code) {
        super(message, code);
        this.name = 'SSHConnectionError';
    }
}
exports.SSHConnectionError = SSHConnectionError;
class SSHAuthenticationError extends SSHError {
    constructor(message, code) {
        super(message, code);
        this.name = 'SSHAuthenticationError';
    }
}
exports.SSHAuthenticationError = SSHAuthenticationError;
class SSHCommandError extends SSHError {
    constructor(message, exitCode, output) {
        super(message);
        this.exitCode = exitCode;
        this.output = output;
        this.name = 'SSHCommandError';
    }
}
exports.SSHCommandError = SSHCommandError;
//# sourceMappingURL=index.js.map