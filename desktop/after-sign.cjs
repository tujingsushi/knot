const fs = require('fs')
const path = require('path')

module.exports = async function afterSign(context) {
  const launcherSource = path.join(__dirname, 'launcher.exe')
  const launcherPath = path.join(context.appOutDir, 'knot.exe')
  fs.copyFileSync(launcherSource, launcherPath)
}
