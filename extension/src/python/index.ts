import { join } from 'path'
import { getVenvBinPath } from './path'
import { getProcessPlatform } from '../env'
import { exists } from '../fileSystem'
import { createProcessWithOutput } from '../processExecution'

const installPackages = (cwd: string, pythonBin: string, ...args: string[]) => {
  return createProcessWithOutput({
    args: ['-m', 'pip', 'install', '--upgrade', ...args],
    cwd,
    executable: pythonBin
  })
}

export const setupVenv = async (
  cwd: string,
  envDir: string,
  ...installArgs: string[]
) => {
  if (!exists(join(cwd, envDir))) {
    await createProcessWithOutput({
      args: ['-m', 'venv', envDir],
      cwd,
      executable: getProcessPlatform() === 'win32' ? 'python' : 'python3'
    })
  }

  const venvPython = getVenvBinPath(cwd, envDir, 'python')

  await installPackages(cwd, venvPython, 'pip', 'wheel')

  return installPackages(cwd, venvPython, ...installArgs)
}
