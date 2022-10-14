import { join, resolve } from 'path'
require('dvc/src/vscode/mockModule')

const importModuleAfterMockingVsCode = () => {
  const { setupVenv } = require('dvc/src/python')

  return setupVenv
}

const setupVenv = importModuleAfterMockingVsCode()

const cwd = resolve(__dirname, '..', 'vscode-dvc-demo')

setupVenv(cwd, '.env', '-r', join('.', 'requirements.txt'))
