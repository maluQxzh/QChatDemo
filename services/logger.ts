// Simple logging abstraction. In a real Electron app, this would write to a file via IPC.

type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel = 'info';

  setLevel(level: LogLevel) {
    this.level = level;
  }

  info(module: string, message: string, data?: any) {
    if (this.level === 'error' || this.level === 'warn') return;
    console.log(`[INFO] [${module}] ${message}`, data || '');
  }

  warn(module: string, message: string, data?: any) {
    if (this.level === 'error') return;
    console.warn(`[WARN] [${module}] ${message}`, data || '');
  }

  error(module: string, message: string, error?: any) {
    console.error(`[ERROR] [${module}] ${message}`, error || '');
  }
}

export const logger = new Logger();