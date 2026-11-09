const { app, BrowserWindow, Menu, dialog, session, shell } = require('electron')
const fs = require('fs')
const path = require('path')

const APP_ID = 'com.sancheng.app.desktop'
const EXTERNAL_PROTOCOL = /^https?:\/\//i

// The app only loads local, trusted content and runs with contextIsolation.
// Chromium's sandbox can fail to initialize on some locked-down Windows setups,
// which makes the process exit before the first window appears.
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu-sandbox')

app.setName('结绳 KNOT')
app.setAppUserModelId(APP_ID)

const logFile = path.join(app.getPath('temp'), 'knot-desktop.log')

function log(message) {
  try {
    fs.appendFileSync(
      logFile,
      `[${new Date().toISOString()}] ${message}\n`,
      'utf8',
    )
  } catch {
    // Logging must never prevent startup.
  }
}

function createUserDataDirectory() {
  const candidates = [
    process.env.KNOT_USER_DATA,
    process.env.PORTABLE_EXECUTABLE_DIR
      ? path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'KnotData')
      : null,
    path.join(app.getPath('appData'), 'Knot'),
    path.join(app.getPath('temp'), 'KnotData'),
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      fs.mkdirSync(candidate, { recursive: true })
      app.setPath('userData', candidate)
      log(`userData=${candidate}`)
      return
    } catch (error) {
      log(`userData failed ${candidate}: ${error.message}`)
    }
  }

  log(`falling back to default userData=${app.getPath('userData')}`)
}

createUserDataDirectory()
app.disableHardwareAcceleration()
log(`starting app=${app.getVersion()} electron=${process.versions.electron}`)

process.on('uncaughtException', (error) => {
  log(`uncaughtException: ${error.stack || error.message}`)
})

let mainWindow = null

function openExternal(url) {
  if (EXTERNAL_PROTOCOL.test(url)) {
    void shell.openExternal(url)
  }
}

function showStartupError(title, detail) {
  log(`${title}: ${detail}`)
  try {
    dialog.showErrorBox(title, detail)
  } catch {
    // The dialog is best-effort.
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 560,
    height: 860,
    minWidth: 430,
    minHeight: 680,
    useContentSize: true,
    show: false,
    title: '结绳 KNOT',
    backgroundColor: '#f4efe4',
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  })

  const reveal = () => {
    if (!mainWindow) return
    if (!mainWindow.isVisible()) mainWindow.show()
  }

  mainWindow.once('ready-to-show', reveal)
  mainWindow.webContents.once('did-finish-load', reveal)
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      showStartupError(
        '结绳无法打开',
        `${errorDescription} (${errorCode})\n${validatedURL}`,
      )
    },
  )

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log(`render-process-gone: ${JSON.stringify(details)}`)
  })

  mainWindow.webContents.on('child-process-gone', (_event, details) => {
    log(`child-process-gone: ${JSON.stringify(details)}`)
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) return
    event.preventDefault()
    openExternal(url)
  })

  mainWindow.webContents.on('will-attach-webview', (event) => {
    event.preventDefault()
  })

  void mainWindow
    .loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
    .catch((error) => {
      showStartupError('结绳无法读取应用文件', error.message)
    })
}

const hasLock = app.requestSingleInstanceLock()
log(`singleInstanceLock=${hasLock}`)

if (!hasLock) {
  log('another instance owns the lock; exiting')
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app
    .whenReady()
    .then(() => {
      Menu.setApplicationMenu(null)
      session.defaultSession.setPermissionRequestHandler(
        (_webContents, _permission, callback) => {
          callback(false)
        },
      )
      createWindow()

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
      })
    })
    .catch((error) => {
      showStartupError('结绳启动失败', error.message)
      app.quit()
    })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
