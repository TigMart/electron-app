import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import contractTemplatesRouter from './routes/contractTemplates'
import settingsRouter from './routes/settings'

let app: Application | null = null
let serverInstance: ReturnType<Application['listen']> | null = null

/**
 * Create and configure Express application
 */
function createExpressApp(): Application {
  const expressApp = express()

  // Middleware
  expressApp.use(cors())
  expressApp.use(express.json())
  expressApp.use(express.urlencoded({ extended: true }))

  // Request logging middleware
  expressApp.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[Express] ${req.method} ${req.url}`)
    next()
  })

  // API Routes
  expressApp.use('/api/contract-templates', contractTemplatesRouter)
  expressApp.use('/api/settings', settingsRouter)

  // Health check endpoint
  expressApp.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // 404 handler
  expressApp.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' })
  })

  // Error handling middleware
  expressApp.use((err: Error, _req: Request, res: Response) => {
    console.error('[Express] Error:', err)
    res.status(500).json({ error: 'Internal Server Error', message: err.message })
  })

  return expressApp
}

/**
 * Start Express server on specified port
 * @param port Port number to listen on
 * @returns Promise that resolves to the port number
 */
export async function startServer(port = 3000): Promise<number> {
  if (app) {
    console.log('[Express] Server already running')
    return port
  }

  app = createExpressApp()

  return new Promise((resolve, reject) => {
    try {
      serverInstance = app!.listen(port, () => {
        console.log(`[Express] Server started on http://localhost:${port}`)
        resolve(port)
      })

      serverInstance.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`[Express] Port ${port} is already in use`)
          // Try next port
          app = null
          serverInstance = null
          resolve(startServer(port + 1))
        } else {
          reject(error)
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Stop Express server
 */
export async function stopServer(): Promise<void> {
  if (serverInstance) {
    return new Promise((resolve, reject) => {
      serverInstance!.close((err?: Error) => {
        if (err) {
          console.error('[Express] Error stopping server:', err)
          reject(err)
        } else {
          console.log('[Express] Server stopped')
          app = null
          serverInstance = null
          resolve()
        }
      })
    })
  }
}

/**
 * Get the Express app instance
 */
export function getApp(): Application | null {
  return app
}
