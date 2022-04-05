import { join } from 'path'
import { exists } from '../fileSystem'
import { createProcessWithOutput } from '../processExecution'

const installPackages = (cwd: string, pythonBin: string, ...args: string[]) => {
  return createProcessWithOutput({
    args: ['-m', 'pip', 'install', '--upgrade', ...args],
    cwd,
    executable: pythonBin
  })
}

export const getVenvBinPath = (cwd: string, envDir: string, name: string) =>
  process.platform === 'win32'
    ? join(cwd, envDir, 'Scripts', `${name}.exe`)
    : join(cwd, envDir, 'bin', name)

export const setupVenv = async (
  cwd: string,
  envDir: string,
  ...installArgs: string[]
) => {
  if (!exists(join(cwd, envDir))) {
    await createProcessWithOutput({
      args: ['-m', 'venv', envDir],
      cwd,
      executable: process.platform === 'win32' ? 'python' : 'python3'
    })
  }

  const venvPython = getVenvBinPath(cwd, envDir, 'python')

  await installPackages(cwd, venvPython, 'pip')

  return installPackages(cwd, venvPython, ...installArgs)
}
