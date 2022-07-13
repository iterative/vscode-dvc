import { join } from 'path'
import { getProcessPlatform } from '../env'

export const getVenvBinPath = (cwd: string, envDir: string, name: string) =>
  getProcessPlatform() === 'win32'
    ? join(cwd, envDir, 'Scripts', `${name}.exe`)
    : join(cwd, envDir, 'bin', name)
