const fs = require('fs')
const path = require('path')

module.exports = async function afterPack(context) {
  const appOutDir = context.appOutDir
  const corePath = path.join(appOutDir, 'knot.exe')
  const renamedCorePath = path.join(appOutDir, 'knot-core.exe')

  if (fs.existsSync(corePath)) {
    fs.renameSync(corePath, renamedCorePath)
  }

  if (!fs.existsSync(renamedCorePath)) {
    throw new Error(`Electron core executable not found: ${renamedCorePath}`)
  }
}
