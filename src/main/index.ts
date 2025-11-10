import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import electronLog from 'electron-log'

const log = (() => {
  try {
    electronLog.transports.file.level = 'info'
    return electronLog
  } catch {
    return null
  }
})()

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupAutoUpdate(): void {
  if (log) autoUpdater.logger = log
  // For private GitHub releases, uncomment and pass a token via env:
  autoUpdater.requestHeaders = { Authorization: `token ${process.env.GH_TOKEN ?? ''}` }

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('updater:status', { state: 'checking' })
  })
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('updater:status', {
      state: 'available',
      info
    })
  })
  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('updater:status', { state: 'idle' })
  })
  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('updater:status', {
      state: 'error',
      message: String(err)
    })
    log?.error?.('autoUpdater error', err)
  })
  autoUpdater.on('download-progress', (p) => {
    mainWindow?.webContents.send('updater:progress', {
      percent: p.percent,
      transferred: p.transferred,
      total: p.total,
      bytesPerSecond: p.bytesPerSecond
    })
  })
  autoUpdater.on('update-downloaded', async () => {
    const res = await dialog.showMessageBox(mainWindow!, {
      type: 'question',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      message: 'Update ready',
      detail: 'Restart the app to apply the update?'
    })
    if (res.response === 0) {
      autoUpdater.quitAndInstall()
    } else {
      mainWindow?.webContents.send('updater:status', { state: 'downloaded' })
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('updater:check-now', async () => {
    const result = await autoUpdater.checkForUpdates()
    return { version: result?.updateInfo?.version ?? null }
  })

  createWindow()

  if (!is.dev) {
    setupAutoUpdate()
    autoUpdater.checkForUpdatesAndNotify()
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
