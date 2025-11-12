class Logger {
  private isDev: boolean
  private isDebugMode: boolean

  constructor() {
    this.isDev = import.meta.env.DEV
    this.isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true'
  }

  private shouldLog(): boolean {
    // Log in dev mode OR when debug mode is explicitly enabled
    return this.isDev || this.isDebugMode
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog()) {
      console.debug(`[DEBUG] ${message}`, data ?? '')
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog()) {
      console.info(`[INFO] ${message}`, data ?? '')
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog()) {
      console.warn(`[WARN] ${message}`, data ?? '')
    }
  }

  error(message: string, error?: unknown): void {
    // Always log errors, even in production
    console.error(`[ERROR] ${message}`, error ?? '')
  }
}

export const logger = new Logger()
