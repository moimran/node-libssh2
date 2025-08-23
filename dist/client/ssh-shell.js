"use strict";
/**
 * Interactive SSH Shell
 *
 * Provides terminal-like interactive shell sessions over SSH.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSHShell = void 0;
const ffi_js_1 = require("../core/ffi.js");
const index_js_1 = require("../types/index.js");
/**
 * Interactive SSH shell for terminal-like sessions
 *
 * Features:
 * - PTY (pseudo-terminal) support
 * - Real-time input/output
 * - Terminal resizing
 * - Proper shell cleanup
 */
class SSHShell {
    constructor(client) {
        this.channel = null;
        this.active = false;
        this.lib = null;
        this.currentWidth = 80;
        this.currentHeight = 24;
        this.client = client;
    }
    /**
     * Start an interactive shell session
     *
     * @param options Shell configuration options
     */
    async start(options = {}) {
        if (!this.client.isConnected()) {
            throw new index_js_1.SSHCommandError('SSH client not connected');
        }
        const { terminalType = 'xterm', width = 80, height = 24 } = options;
        // Access private members for shell operations
        this.lib = this.client.lib;
        const session = this.client.session;
        // Open channel
        this.channel = this.lib.libssh2_channel_open_ex(session, (0, ffi_js_1.cstr)('session'), 7, 65536, 32768, null, 0);
        if (!this.channel || (0, ffi_js_1.isNull)(this.channel)) {
            throw new index_js_1.SSHCommandError('Failed to open shell channel');
        }
        try {
            // Request PTY
            const ptyResult = this.lib.libssh2_channel_request_pty_ex(this.channel, (0, ffi_js_1.cstr)(terminalType), terminalType.length, null, 0, width, height, 0, 0);
            if (ptyResult !== 0) {
                throw new index_js_1.SSHCommandError(`Failed to request PTY: ${ptyResult}`);
            }
            // Start shell
            const shellResult = this.lib.libssh2_channel_process_startup(this.channel, (0, ffi_js_1.cstr)('shell'), 5, null, 0);
            if (shellResult !== 0) {
                throw new index_js_1.SSHCommandError(`Failed to start shell: ${shellResult}`);
            }
            // Store initial dimensions
            this.currentWidth = width;
            this.currentHeight = height;
            this.active = true;
        }
        catch (error) {
            // Cleanup on failure
            if (this.channel) {
                this.lib.libssh2_channel_close(this.channel);
                this.lib.libssh2_channel_free(this.channel);
                this.channel = null;
            }
            throw error;
        }
    }
    /**
     * Send input to the shell
     *
     * @param data Data to send to shell
     * @returns Number of bytes written
     */
    async write(data) {
        if (!this.active || !this.channel) {
            throw new index_js_1.SSHCommandError('Shell not active');
        }
        const buffer = Buffer.from(data, 'utf8');
        const bytesWritten = this.lib.libssh2_channel_write_ex(this.channel, 0, buffer, buffer.length);
        if (bytesWritten < 0) {
            throw new index_js_1.SSHCommandError(`Failed to write to shell: ${bytesWritten}`);
        }
        return Number(bytesWritten);
    }
    /**
     * Read output from the shell (optimized for speed)
     *
     * @param timeoutMs Maximum time to wait for data (default: 1000ms)
     * @returns Output from shell
     */
    async read(timeoutMs = 1000) {
        if (!this.active || !this.channel) {
            throw new index_js_1.SSHCommandError('Shell not active');
        }
        const buffer = Buffer.alloc(16384); // Larger buffer for better performance
        let output = '';
        const startTime = Date.now();
        let emptyReads = 0;
        while (Date.now() - startTime < timeoutMs) {
            const bytesRead = this.lib.libssh2_channel_read_ex(this.channel, 0, buffer, buffer.length);
            if (bytesRead > 0) {
                output += buffer.subarray(0, Number(bytesRead)).toString();
                emptyReads = 0;
                // Continue reading immediately if we got data
                continue;
            }
            else if (bytesRead === 0) {
                // EOF
                break;
            }
            else if (bytesRead === -37) {
                // EAGAIN - no data available
                emptyReads++;
                // If we have some output and multiple empty reads, return what we have
                if (output.length > 0 && emptyReads > 3) {
                    break;
                }
                // Much shorter delay for responsiveness
                await new Promise(resolve => setTimeout(resolve, 1));
            }
            else {
                // Error
                break;
            }
        }
        return output;
    }
    /**
     * Read output from shell with smart detection (optimized)
     *
     * This method reads until no more data is available, making it suitable
     * for reading command output that may arrive in multiple chunks.
     *
     * @param maxWaitMs Maximum time to wait for additional data
     * @returns Complete output from shell
     */
    async readUntilComplete(maxWaitMs = 1000) {
        if (!this.active || !this.channel) {
            throw new index_js_1.SSHCommandError('Shell not active');
        }
        const buffer = Buffer.alloc(16384); // Larger buffer
        let output = '';
        let lastDataTime = Date.now();
        const startTime = Date.now();
        let consecutiveEmptyReads = 0;
        while (Date.now() - startTime < maxWaitMs) {
            const bytesRead = this.lib.libssh2_channel_read_ex(this.channel, 0, buffer, buffer.length);
            if (bytesRead > 0) {
                output += buffer.subarray(0, Number(bytesRead)).toString();
                lastDataTime = Date.now();
                consecutiveEmptyReads = 0;
                // Continue immediately if we got data
                continue;
            }
            else if (bytesRead === 0) {
                // EOF
                break;
            }
            else if (bytesRead === -37) {
                // EAGAIN - no data available
                consecutiveEmptyReads++;
                // Much more aggressive completion detection for speed
                if (Date.now() - lastDataTime > 100 && consecutiveEmptyReads > 5) {
                    break;
                }
                // Very short delay for responsiveness
                await new Promise(resolve => setTimeout(resolve, 1));
            }
            else {
                // Error
                break;
            }
        }
        return output;
    }
    /**
     * Execute a command and read its output quickly (optimized for speed)
     *
     * @param command Command to execute
     * @param timeoutMs Maximum time to wait for output
     * @returns Command output
     */
    async executeCommand(command, timeoutMs = 500) {
        if (!this.active || !this.channel) {
            throw new index_js_1.SSHCommandError('Shell not active');
        }
        // Send command
        await this.write(command + '\n');
        // Read output with smart prompt detection
        return await this.readUntilPrompt(timeoutMs);
    }
    /**
     * Read until we see a shell prompt (much faster than timeout-based reading)
     */
    async readUntilPrompt(timeoutMs = 500) {
        if (!this.active || !this.channel) {
            throw new index_js_1.SSHCommandError('Shell not active');
        }
        const buffer = Buffer.alloc(16384);
        let output = '';
        const startTime = Date.now();
        let lastDataTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            const bytesRead = this.lib.libssh2_channel_read_ex(this.channel, 0, buffer, buffer.length);
            if (bytesRead > 0) {
                const chunk = buffer.subarray(0, Number(bytesRead)).toString();
                output += chunk;
                lastDataTime = Date.now();
                // Check for common shell prompts to detect command completion
                if (this.hasPrompt(output)) {
                    break;
                }
                // Continue immediately if we got data
                continue;
            }
            else if (bytesRead === 0) {
                // EOF
                break;
            }
            else if (bytesRead === -37) {
                // EAGAIN - no data available
                // If we have output and haven't received data recently, we're probably done
                if (output.length > 0 && Date.now() - lastDataTime > 50) {
                    break;
                }
                // Very short delay
                await new Promise(resolve => setTimeout(resolve, 1));
            }
            else {
                // Error
                break;
            }
        }
        return output;
    }
    /**
     * Check if the output contains a shell prompt
     */
    hasPrompt(output) {
        const lines = output.split('\n');
        const lastLine = lines[lines.length - 1] || '';
        // Common shell prompt patterns
        const promptPatterns = [
            /[#$%>]\s*$/, // Basic prompts ending with #, $, %, or >
            /root@.*[#$]\s*$/, // root@hostname# or root@hostname$
            /.*@.*[#$]\s*$/, // user@hostname# or user@hostname$
            /.*:\w*[#$]\s*$/, // path:dir# or path:dir$
            /.*~[#$]\s*$/, // ~/path# or ~/path$
        ];
        return promptPatterns.some(pattern => pattern.test(lastLine));
    }
    /**
     * Resize the terminal
     *
     * @param width New terminal width (columns)
     * @param height New terminal height (rows)
     */
    async resize(width, height) {
        if (!this.active || !this.channel) {
            throw new index_js_1.SSHCommandError('Shell not active');
        }
        if (width <= 0 || height <= 0) {
            throw new index_js_1.SSHCommandError('Width and height must be positive numbers');
        }
        try {
            // Use libssh2_channel_request_pty_size_ex to resize the PTY
            const result = this.lib.libssh2_channel_request_pty_size_ex(this.channel, width, // columns
            height, // rows
            0, // width_px (pixel width, 0 = not specified)
            0 // height_px (pixel height, 0 = not specified)
            );
            if (result !== 0) {
                throw new index_js_1.SSHCommandError(`Failed to resize terminal: ${result}`);
            }
            // Store the new dimensions for reference
            this.currentWidth = width;
            this.currentHeight = height;
        }
        catch (error) {
            if (error instanceof index_js_1.SSHCommandError) {
                throw error;
            }
            throw new index_js_1.SSHCommandError(`Terminal resize failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Resize the terminal using cols/rows (alias for resize)
     *
     * @param cols Number of columns
     * @param rows Number of rows
     */
    async resizeTerminal(cols, rows) {
        return this.resize(cols, rows);
    }
    /**
     * Get current terminal dimensions
     *
     * @returns Object with current width and height
     */
    getDimensions() {
        return {
            width: this.currentWidth,
            height: this.currentHeight,
            cols: this.currentWidth, // Alias for compatibility
            rows: this.currentHeight // Alias for compatibility
        };
    }
    /**
     * Send a signal to the shell process
     *
     * @param signal Signal name (e.g., 'TERM', 'KILL', 'INT')
     */
    async sendSignal(signal) {
        if (!this.active || !this.channel) {
            throw new index_js_1.SSHCommandError('Shell not active');
        }
        // Note: This would require libssh2_channel_send_signal which may not be available
        // in all versions. For now, we can simulate common signals by sending control characters
        switch (signal.toUpperCase()) {
            case 'INT':
            case 'SIGINT':
                // Send Ctrl+C
                await this.write('\x03');
                break;
            case 'TERM':
            case 'SIGTERM':
                // Send exit command
                await this.write('exit\n');
                break;
            default:
                throw new index_js_1.SSHCommandError(`Signal ${signal} not supported`);
        }
    }
    /**
     * Check if shell is active
     */
    isActive() {
        return this.active;
    }
    /**
     * Get shell status information
     */
    getStatus() {
        return {
            active: this.active,
            hasChannel: this.channel !== null,
            clientConnected: this.client.isConnected()
        };
    }
    /**
     * Close the shell session (optimized)
     */
    close() {
        if (this.channel && this.active && this.lib) {
            try {
                // Send exit command to gracefully close shell
                this.lib.libssh2_channel_write_ex(this.channel, 0, Buffer.from('exit\n'), 5);
                // Immediate cleanup for better performance
                // The shell will close on its own with the exit command
                this.lib.libssh2_channel_close(this.channel);
                this.lib.libssh2_channel_free(this.channel);
            }
            catch (e) {
                // Ignore cleanup errors
            }
            this.channel = null;
            this.active = false;
        }
    }
}
exports.SSHShell = SSHShell;
//# sourceMappingURL=ssh-shell.js.map