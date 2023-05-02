import { join } from 'path'
import { getProcessPlatform } from '../env'

const { userConfigDir } = require('appdirs') as {
  userConfigDir: (appName: string) => string
}

export const getIterativeAppDir = (): string => userConfigDir('iterative')

export const getDVCAppDir = (): string => {
  if (getProcessPlatform() === 'win32') {
    return join(getIterativeAppDir(), 'dvc')
  }
  return userConfigDir('dvc')
}
