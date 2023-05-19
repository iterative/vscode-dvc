/* eslint-disable */
import { join, resolve } from 'path'
require('dvc/src/vscode/mockModule')

const importModuleAfterMockingVsCode = () => {
  const { setupTestVenv } = require('dvc/src/python')

  return setupTestVenv
}

const setupTestVenv = importModuleAfterMockingVsCode()

const cwd = resolve(__dirname, '..', 'demo')

setupTestVenv(cwd, '.env', '-r', join('.', 'requirements.txt'))
