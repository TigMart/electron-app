/* eslint-disable @typescript-eslint/no-explicit-any */
import log from 'electron-log'

class MainLogger {
  private isDev: boolean

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development'

    // Configure electron-log
    log.transports.file.level = 'info'
    log.transports.console.level = this.isDev ? 'debug' : 'info'
  }

  debug(message: string, ...args: any[]): void {
    log.debug(message, ...args)
  }

  info(message: string, ...args: any[]): void {
    log.info(message, ...args)
  }

  warn(message: string, ...args: any[]): void {
    log.warn(message, ...args)
  }

  error(message: string, ...args: any[]): void {
    log.error(message, ...args)
  }

  log(message: string, ...args: any[]): void {
    log.info(message, ...args)
  }
}

export const logger = new MainLogger()
