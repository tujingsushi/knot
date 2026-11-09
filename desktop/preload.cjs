const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('knotDesktop', {
  platform: process.platform,
  electron: process.versions.electron,
})
