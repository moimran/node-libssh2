/**
 * Production-level logging system for node-libssh2
 * Provides structured logging with performance tracking and troubleshooting capabilities
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogEntry {
  timestamp: string;
  level: string;
  component: string;
  message: string;
  data?: any;
  duration?: number;
  correlationId?: string;
}

export interface PerformanceTimer {
  start: number;
  component: string;
  operation: string;
  correlationId?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO; // Reduce logging overhead
  private subscribers: ((entry: LogEntry) => void)[] = [];
  private timers: Map<string, PerformanceTimer> = new Map();

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the global log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info('Logger', `Log level set to ${LogLevel[level]}`);
  }

  /**
   * Subscribe to log events for real-time monitoring
   */
  subscribe(callback: (entry: LogEntry) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Start a performance timer
   */
  startTimer(component: string, operation: string, correlationId?: string): string {
    const timerId = `${component}:${operation}:${Date.now()}:${Math.random().toString(36).substr(2, 4)}`;
    this.timers.set(timerId, {
      start: performance.now(),
      component,
      operation,
      correlationId
    });

    this.trace(component, `⏱️  Started: ${operation}`, { timerId, correlationId });
    return timerId;
  }

  /**
   * End a performance timer and log the duration
   */
  endTimer(timerId: string, additionalData?: any): number {
    const timer = this.timers.get(timerId);
    if (!timer) {
      this.warn('Logger', `Timer not found: ${timerId}`);
      return 0;
    }

    const duration = performance.now() - timer.start;
    this.timers.delete(timerId);

    const durationMs = Math.round(duration * 100) / 100;
    const emoji = duration > 1000 ? '🐌' : duration > 100 ? '⚠️' : '✅';

    this.info(timer.component, `${emoji} Completed: ${timer.operation}`, {
      duration: `${durationMs}ms`,
      correlationId: timer.correlationId,
      ...additionalData
    });

    return duration;
  }

  /**
   * Log an error
   */
  error(component: string, message: string, data?: any, correlationId?: string): void {
    this.log(LogLevel.ERROR, component, `❌ ${message}`, data, correlationId);
  }

  /**
   * Log a warning
   */
  warn(component: string, message: string, data?: any, correlationId?: string): void {
    this.log(LogLevel.WARN, component, `⚠️  ${message}`, data, correlationId);
  }

  /**
   * Log an info message
   */
  info(component: string, message: string, data?: any, correlationId?: string): void {
    this.log(LogLevel.INFO, component, `ℹ️  ${message}`, data, correlationId);
  }

  /**
   * Log a debug message
   */
  debug(component: string, message: string, data?: any, correlationId?: string): void {
    this.log(LogLevel.DEBUG, component, `🔍 ${message}`, data, correlationId);
  }

  /**
   * Log a trace message
   */
  trace(component: string, message: string, data?: any, correlationId?: string): void {
    this.log(LogLevel.TRACE, component, `🔬 ${message}`, data, correlationId);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, component: string, message: string, data?: any, correlationId?: string): void {
    if (level > this.logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      timestamp,
      level: LogLevel[level],
      component,
      message,
      data,
      correlationId
    };

    // Console output with color coding and better formatting
    const color = this.getLogColor(level);
    const resetColor = '\x1b[0m';
    const timeStr = timestamp.split('T')[1].split('.')[0]; // HH:MM:SS format

    let logLine = `${color}[${timeStr}] ${entry.level.padEnd(5)} ${component.padEnd(12)}${resetColor} ${message}`;

    if (correlationId) {
      logLine += ` ${'\x1b[90m'}[${correlationId}]${resetColor}`;
    }

    console.log(logLine);

    if (data && Object.keys(data).length > 0) {
      console.log(`${'\x1b[90m'}       Data:${resetColor}`, data);
    }

    // Notify subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('Logger subscriber error:', error);
      }
    });
  }

  /**
   * Get ANSI color code for log level
   */
  private getLogColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.INFO: return '\x1b[36m';  // Cyan
      case LogLevel.DEBUG: return '\x1b[35m'; // Magenta
      case LogLevel.TRACE: return '\x1b[37m'; // White
      default: return '\x1b[0m';              // Reset
    }
  }

  /**
   * Create a correlation ID for tracking related operations
   */
  createCorrelationId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Log performance metrics with automatic severity based on duration
   */
  logPerformance(component: string, operation: string, duration: number, data?: any): void {
    const durationMs = Math.round(duration * 100) / 100;
    let level: LogLevel;
    let emoji: string;

    if (duration > 5000) {
      level = LogLevel.ERROR;
      emoji = '🚨';
    } else if (duration > 1000) {
      level = LogLevel.WARN;
      emoji = '🐌';
    } else if (duration > 100) {
      level = LogLevel.INFO;
      emoji = '⚠️';
    } else {
      level = LogLevel.DEBUG;
      emoji = '✅';
    }

    this.log(level, component, `${emoji} Performance: ${operation} took ${durationMs}ms`, data);
  }

  /**
   * Log data flow events (useful for SSH debugging)
   */
  logDataFlow(component: string, direction: 'IN' | 'OUT', bytes: number, data?: any, correlationId?: string): void {
    const arrow = direction === 'IN' ? '⬇️' : '⬆️';
    const message = `${arrow} Data ${direction}: ${bytes} bytes`;
    this.trace(component, message, { bytes, ...data }, correlationId);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const startTimer = (component: string, operation: string, correlationId?: string) =>
  logger.startTimer(component, operation, correlationId);

export const endTimer = (timerId: string, additionalData?: any) =>
  logger.endTimer(timerId, additionalData);

export const createCorrelationId = () => logger.createCorrelationId();

// Set up default log level based on environment
if (process.env.NODE_ENV === 'production') {
  logger.setLogLevel(LogLevel.INFO);
} else {
  logger.setLogLevel(LogLevel.DEBUG);
}
