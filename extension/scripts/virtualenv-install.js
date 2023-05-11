const { join, resolve } = require('path')
require('../dist/vscode/mockModule')

const importModuleAfterMockingVsCode = async () => {
  const { setupTestVenv } = require('../dist/python')
  return setupTestVenv
}

importModuleAfterMockingVsCode().then(setupTestVenv => {
  const cwd = resolve(__dirname, '..', '..', 'demo')

  setupTestVenv(cwd, '.env', '-r', join('.', 'requirements.txt'))
})
