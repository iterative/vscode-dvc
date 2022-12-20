import { join } from 'path'
import { getVenvBinPath } from './path'
import { getProcessPlatform } from '../env'
import { exists } from '../fileSystem'
import { Logger } from '../common/logger'
import { createProcess, executeProcess, Process } from '../processExecution'

const sendOutput = (process: Process) =>
  process.all?.on('data', chunk =>
    Logger.log(chunk.toString().replace(/(\r?\n)/g, ''))
  )

export const installPackages = (
  cwd: string,
  pythonBin: string,
  ...args: string[]
): Process => {
  const options = {
    args: ['-m', 'pip', 'install', '--upgrade', ...args],
    cwd,
    executable: pythonBin
  }

  return createProcess(options)
}

export const getDefaultPython = (): string =>
  getProcessPlatform() === 'win32' ? 'python' : 'python3'

export const setupVenv = async (
  cwd: string,
  envDir: string,
  ...installArgs: string[]
) => {
  if (!exists(join(cwd, envDir))) {
    const initVenv = createProcess({
      args: ['-m', 'venv', envDir],
      cwd,
      executable: getDefaultPython()
    })
    sendOutput(initVenv)
    await initVenv
  }

  const venvPython = getVenvBinPath(cwd, envDir, 'python')

  const venvUpgrade = installPackages(cwd, venvPython, 'pip', 'wheel')
  sendOutput(venvUpgrade)
  await venvUpgrade

  const installRequestedPackages = installPackages(
    cwd,
    venvPython,
    ...installArgs
  )
  sendOutput(installRequestedPackages)
  return installRequestedPackages
}

export const findPythonBin = async (
  pythonBin: string
): Promise<string | undefined> => {
  try {
    return await executeProcess({
      args: ['-c', 'import sys; print(sys.executable)'],
      cwd: process.cwd(),
      executable: pythonBin
    })
  } catch {}
}
