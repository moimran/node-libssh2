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
const events_1 = require("events");
const logger_js_1 = require("../utils/logger.js");
/**
 * Interactive SSH shell for terminal-like sessions
 *
 * Features:
 * - PTY (pseudo-terminal) support
 * - Real-time input/output streaming
 * - Terminal resizing
 * - Event-based data handling
 * - Proper shell cleanup
 *
 * Events:
 * - 'data': Emitted when data is received from the shell
 * - 'error': Emitted when an error occurs
 * - 'close': Emitted when the shell is closed
 * - 'ready': Emitted when the shell is ready for input
 */
class SSHShell extends events_1.EventEmitter {
    constructor(client) {
        super();
        this.channel = null;
        this.active = false;
        this.lib = null;
        this.currentWidth = 80;
        this.currentHeight = 24;
        this.streamingActive = false;
        this.streamingInterval = null;
        this.sessionStartTime = 0;
        this.lastCommandTime = 0;
        this.client = client;
        this.correlationId = (0, logger_js_1.createCorrelationId)();
        logger_js_1.logger.info('SSHShell', 'Shell instance created', { correlationId: this.correlationId });
    }
    /**
     * Start an interactive shell session
     *
     * @param options Shell configuration options
     */
    async start(options = {}) {
        const startTimerId = (0, logger_js_1.startTimer)('SSHShell', 'start', this.correlationId);
        this.sessionStartTime = performance.now();
        logger_js_1.logger.info('SSHShell', 'Starting shell session', { options, correlationId: this.correlationId });
        if (!this.client.isConnected()) {
            logger_js_1.logger.error('SSHShell', 'SSH client not connected', {}, this.correlationId);
            throw new index_js_1.SSHCommandError('SSH client not connected');
        }
        const { terminalType = 'xterm', width = 80, height = 24 } = options;
        logger_js_1.logger.debug('SSHShell', 'Shell options configured', { terminalType, width, height }, this.correlationId);
        // Access private members for shell operations
        this.lib = this.client.lib;
        const session = this.client.session;
        // Open channel
        const channelTimerId = (0, logger_js_1.startTimer)('SSHShell', 'open-channel', this.correlationId);
        logger_js_1.logger.debug('SSHShell', 'Opening SSH channel', {}, this.correlationId);
        this.channel = this.lib.libssh2_channel_open_ex(session, (0, ffi_js_1.cstr)('session'), 7, 65536, 32768, null, 0);
        if (!this.channel || (0, ffi_js_1.isNull)(this.channel)) {
            (0, logger_js_1.endTimer)(channelTimerId, { success: false });
            logger_js_1.logger.error('SSHShell', 'Failed to open shell channel', {}, this.correlationId);
            throw new index_js_1.SSHCommandError('Failed to open shell channel');
        }
        (0, logger_js_1.endTimer)(channelTimerId, { success: true });
        logger_js_1.logger.debug('SSHShell', 'SSH channel opened successfully', {}, this.correlationId);
        try {
            // Request PTY
            const ptyTimerId = (0, logger_js_1.startTimer)('SSHShell', 'request-pty', this.correlationId);
            logger_js_1.logger.debug('SSHShell', 'Requesting PTY', { terminalType, width, height }, this.correlationId);
            const ptyResult = this.lib.libssh2_channel_request_pty_ex(this.channel, (0, ffi_js_1.cstr)(terminalType), terminalType.length, null, 0, width, height, 0, 0);
            if (ptyResult !== 0) {
                (0, logger_js_1.endTimer)(ptyTimerId, { success: false, result: ptyResult });
                logger_js_1.logger.error('SSHShell', 'Failed to request PTY', { result: ptyResult }, this.correlationId);
                throw new index_js_1.SSHCommandError(`Failed to request PTY: ${ptyResult}`);
            }
            (0, logger_js_1.endTimer)(ptyTimerId, { success: true });
            logger_js_1.logger.debug('SSHShell', 'PTY requested successfully', {}, this.correlationId);
            // Start shell
            const shellTimerId = (0, logger_js_1.startTimer)('SSHShell', 'start-shell-process', this.correlationId);
            logger_js_1.logger.debug('SSHShell', 'Starting shell process', {}, this.correlationId);
            const shellResult = this.lib.libssh2_channel_process_startup(this.channel, (0, ffi_js_1.cstr)('shell'), 5, null, 0);
            if (shellResult !== 0) {
                (0, logger_js_1.endTimer)(shellTimerId, { success: false, result: shellResult });
                logger_js_1.logger.error('SSHShell', 'Failed to start shell', { result: shellResult }, this.correlationId);
                throw new index_js_1.SSHCommandError(`Failed to start shell: ${shellResult}`);
            }
            (0, logger_js_1.endTimer)(shellTimerId, { success: true });
            logger_js_1.logger.debug('SSHShell', 'Shell process started successfully', {}, this.correlationId);
            // Set session to non-blocking mode to prevent event loop blocking
            const session = this.client.getSession();
            this.lib.libssh2_session_set_blocking(session, 0);
            logger_js_1.logger.debug('SSHShell', 'Session set to non-blocking mode', {}, this.correlationId);
            // Store initial dimensions
            this.currentWidth = width;
            this.currentHeight = height;
            this.active = true;
            logger_js_1.logger.debug('SSHShell', 'Shell setup complete, starting data streaming', {}, this.correlationId);
            // Start data streaming immediately (no delay needed with non-blocking mode)
            this.startStreaming();
            // Emit ready event after streaming is set up
            this.emit('ready');
            (0, logger_js_1.endTimer)(startTimerId, { success: true });
            logger_js_1.logger.info('SSHShell', 'Shell session started successfully', {
                totalTime: `${(performance.now() - this.sessionStartTime).toFixed(2)}ms`
            }, this.correlationId);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            (0, logger_js_1.endTimer)(startTimerId, { success: false, error: errorMessage });
            logger_js_1.logger.error('SSHShell', 'Failed to start shell session', { error: errorMessage }, this.correlationId);
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
     * Start data streaming with on-demand reading (no continuous polling)
     */
    startStreaming() {
        if (this.streamingActive) {
            logger_js_1.logger.debug('SSHShell', 'Data streaming already active', {}, this.correlationId);
            return;
        }
        logger_js_1.logger.info('SSHShell', 'Starting data streaming', {}, this.correlationId);
        this.streamingActive = true;
        // Perform initial read to get any available data
        this.performSingleRead();
    }
    /**
     * Perform a single read operation to check for available data
     * This is called on-demand rather than in a continuous loop
     */
    performSingleRead() {
        if (!this.streamingActive || !this.active || !this.channel) {
            return;
        }
        try {
            // Read all available data in a single operation
            let hasMoreData = true;
            let readCount = 0;
            const maxReads = 10; // Prevent infinite loops
            while (hasMoreData && readCount < maxReads) {
                hasMoreData = this.readAvailableData();
                readCount++;
            }
        }
        catch (error) {
            console.error('SSH Shell: Data read error:', error);
            this.emit('error', error);
            this.stopStreaming();
        }
    }
    /**
     * Trigger a read operation (called after write operations to check for responses)
     */
    triggerRead() {
        if (this.streamingActive) {
            // Use setImmediate to avoid blocking the current operation
            setImmediate(() => this.performSingleRead());
        }
    }
    /**
     * Stop data streaming
     */
    stopStreaming() {
        this.streamingActive = false;
        if (this.streamingInterval) {
            clearTimeout(this.streamingInterval);
            this.streamingInterval = null;
        }
    }
    /**
     * Read available data with robust error handling
     * @returns true if data was read, false otherwise
     */
    readAvailableData() {
        if (!this.active || !this.channel || !this.streamingActive) {
            return false;
        }
        try {
            const buffer = Buffer.alloc(65536);
            const readStartTime = performance.now();
            const bytesRead = this.lib.libssh2_channel_read_ex(this.channel, 0, buffer, buffer.length);
            const readDuration = performance.now() - readStartTime;
            if (bytesRead > 0) {
                const data = buffer.subarray(0, Number(bytesRead)).toString();
                const timestamp = new Date().toISOString().substring(11, 23); // HH:mm:ss.SSS
                // Raw data logging without interpretation
                console.log(`📥 SSH DATA [${timestamp}]: ${bytesRead} bytes received (${readDuration.toFixed(2)}ms)`);
                console.log(`    Preview: "${data.substring(0, 50).replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`);
                logger_js_1.logger.logDataFlow('SSHShell', 'IN', bytesRead, {
                    readDuration: `${readDuration.toFixed(2)}ms`,
                    preview: data.substring(0, 50).replace(/\n/g, '\\n')
                }, this.correlationId);
                this.emit('data', data);
                return true; // Data was read
            }
            else if (bytesRead === 0) {
                // EOF - shell closed
                logger_js_1.logger.info('SSHShell', 'Shell closed (EOF)', {}, this.correlationId);
                this.emit('close');
                this.stopStreaming();
                return false;
            }
            else if (bytesRead === -37 || bytesRead === -9) {
                // EAGAIN (-37) or EWOULDBLOCK (-9) - no data available right now, this is normal
                logger_js_1.logger.trace('SSHShell', 'No data available (EAGAIN/EWOULDBLOCK)', {
                    bytesRead,
                    readDuration: `${readDuration.toFixed(2)}ms`
                }, this.correlationId);
                return false; // No data available
            }
            else if (bytesRead < 0) {
                // Other libssh2 errors - log occasionally for debugging
                if (Math.random() < 0.001) { // Log 0.1% of the time to avoid spam
                    logger_js_1.logger.debug('SSHShell', 'Read error (libssh2)', {
                        bytesRead,
                        readDuration: `${readDuration.toFixed(2)}ms`
                    }, this.correlationId);
                }
                return false; // No data due to error
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_js_1.logger.error('SSHShell', 'Exception in readAvailableData', { error: errorMessage }, this.correlationId);
            this.emit('error', error);
            this.stopStreaming();
            return false;
        }
        return false;
    }
    /**
     * Send input to the shell (synchronous, non-blocking)
     *
     * @param data Data to send to shell
     * @returns Number of bytes written
     */
    write(data) {
        if (!this.active || !this.channel) {
            console.log(`❌ SSH WRITE FAILED: Shell not active (data: "${data.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}")`);
            return 0;
        }
        const writeTimerId = (0, logger_js_1.startTimer)('SSHShell', 'write-data', this.correlationId);
        this.lastCommandTime = performance.now();
        // Enhanced logging for SSH command sending
        const isEnterKey = data === '\r' || data === '\n' || data === '\r\n';
        const timestamp = new Date().toISOString().substring(11, 23); // HH:mm:ss.SSS
        if (isEnterKey) {
            console.log(`🚀 SSH COMMAND EXECUTION [${timestamp}]: Sending Enter key to execute command`);
        }
        else if (data.charCodeAt(0) < 32) {
            console.log(`⌨️  SSH CONTROL KEY [${timestamp}]: Sending control character (code: ${data.charCodeAt(0)})`);
        }
        else {
            console.log(`📝 SSH INPUT [${timestamp}]: "${data}" (${data.length} bytes)`);
        }
        try {
            const buffer = Buffer.from(data, 'utf8');
            logger_js_1.logger.logDataFlow('SSHShell', 'OUT', buffer.length, {
                preview: data.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
            }, this.correlationId);
            console.log(`📡 SSH WRITE START [${timestamp}]: Calling libssh2_channel_write_ex with ${buffer.length} bytes`);
            const writeStartTime = performance.now();
            const bytesWritten = this.lib.libssh2_channel_write_ex(this.channel, 0, buffer, buffer.length);
            const writeDuration = performance.now() - writeStartTime;
            if (bytesWritten < 0) {
                console.log(`❌ SSH WRITE FAILED [${timestamp}]: libssh2_channel_write_ex returned ${bytesWritten} (${writeDuration.toFixed(2)}ms)`);
                (0, logger_js_1.endTimer)(writeTimerId, { success: false, bytesWritten, writeDuration: `${writeDuration.toFixed(2)}ms` });
                logger_js_1.logger.warn('SSHShell', 'Write operation failed', {
                    bytesWritten,
                    writeDuration: `${writeDuration.toFixed(2)}ms`,
                    data: data.substring(0, 50)
                }, this.correlationId);
                return 0;
            }
            console.log(`✅ SSH WRITE SUCCESS [${timestamp}]: ${bytesWritten} bytes written to SSH channel (${writeDuration.toFixed(2)}ms)`);
            (0, logger_js_1.endTimer)(writeTimerId, { success: true, bytesWritten, writeDuration: `${writeDuration.toFixed(2)}ms` });
            logger_js_1.logger.debug('SSHShell', 'Data written successfully', {
                bytesWritten,
                writeDuration: `${writeDuration.toFixed(2)}ms`
            }, this.correlationId);
            // Trigger a read to check for immediate response (like Python bindings approach)
            this.triggerRead();
            return Number(bytesWritten);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            (0, logger_js_1.endTimer)(writeTimerId, { success: false, error: errorMessage });
            logger_js_1.logger.error('SSHShell', 'Exception in write', { error: errorMessage }, this.correlationId);
            return 0;
        }
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
     * Read output from a long-running command with real-time streaming
     *
     * This method is designed for commands that may take minutes to complete
     * and provides real-time output streaming with progress callbacks.
     *
     * @param maxWaitMs Maximum time to wait for command completion (default: 10 minutes)
     * @param onData Callback for real-time data streaming
     * @param promptPattern Pattern to detect command completion (default: shell prompt)
     * @returns Complete output from the long-running command
     */
    async readLongRunningCommand(maxWaitMs = 600000, // 10 minutes default
    onData, promptPattern = /[#$%>]\s*$/) {
        if (!this.active || !this.channel) {
            throw new index_js_1.SSHCommandError('Shell not active');
        }
        const buffer = Buffer.alloc(65536); // Large buffer for long output
        let output = '';
        let lastDataTime = Date.now();
        const startTime = Date.now();
        let consecutiveEmptyReads = 0;
        logger_js_1.logger.info('SSHShell', 'Starting long-running command read', {
            maxWaitMs,
            hasCallback: !!onData
        }, this.correlationId);
        while (Date.now() - startTime < maxWaitMs) {
            const bytesRead = this.lib.libssh2_channel_read_ex(this.channel, 0, buffer, buffer.length);
            if (bytesRead > 0) {
                const chunk = buffer.subarray(0, Number(bytesRead)).toString();
                output += chunk;
                lastDataTime = Date.now();
                consecutiveEmptyReads = 0;
                // Call real-time callback if provided
                if (onData) {
                    onData(chunk);
                }
                // Check if we've reached a shell prompt (command completed)
                if (promptPattern.test(output)) {
                    logger_js_1.logger.debug('SSHShell', 'Command completion detected via prompt pattern', {
                        outputLength: output.length,
                        duration: Date.now() - startTime
                    }, this.correlationId);
                    break;
                }
                // Continue immediately if we got data
                continue;
            }
            else if (bytesRead === 0) {
                // EOF - command completed
                logger_js_1.logger.debug('SSHShell', 'Command completion detected via EOF', {
                    outputLength: output.length,
                    duration: Date.now() - startTime
                }, this.correlationId);
                break;
            }
            else if (bytesRead === -37) {
                // EAGAIN - no data available
                consecutiveEmptyReads++;
                // For long-running commands, be more patient
                // Only break if no data for 5 seconds and we have some output
                if (Date.now() - lastDataTime > 5000 && output.length > 0 && consecutiveEmptyReads > 100) {
                    logger_js_1.logger.debug('SSHShell', 'Command timeout - no data for 5 seconds', {
                        outputLength: output.length,
                        duration: Date.now() - startTime
                    }, this.correlationId);
                    break;
                }
                // Longer delay for long-running commands to reduce CPU usage
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            else {
                // Error
                logger_js_1.logger.error('SSHShell', 'Read error in long-running command', {
                    error: bytesRead,
                    outputLength: output.length
                }, this.correlationId);
                break;
            }
        }
        logger_js_1.logger.info('SSHShell', 'Long-running command read completed', {
            outputLength: output.length,
            duration: Date.now() - startTime,
            timedOut: Date.now() - startTime >= maxWaitMs
        }, this.correlationId);
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
        this.write(command + '\n');
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
                this.write('\x03');
                break;
            case 'TERM':
            case 'SIGTERM':
                // Send exit command
                this.write('exit\n');
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
        // Stop streaming first
        this.stopStreaming();
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
            // Emit close event
            this.emit('close');
        }
    }
}
exports.SSHShell = SSHShell;
//# sourceMappingURL=ssh-shell.js.map