import { join } from 'path'
import { getVenvBinPath } from './path'
import { getProcessPlatform } from '../env'
import { exists } from '../fileSystem'
import { Logger } from '../common/logger'
import {
  createProcess,
  executeProcess,
  Process,
  ProcessOptions
} from '../processExecution'

const sendOutput = (process: Process) =>
  process.all?.on('data', chunk =>
    Logger.log(chunk.toString().replace(/(\r?\n)/g, ''))
  )

export const createProcessWithOutput = (options: ProcessOptions) => {
  const process = createProcess(options)

  sendOutput(process)

  return process
}

export const installPackages = (
  cwd: string,
  pythonBin: string,
  ...args: string[]
): Process => {
  return createProcessWithOutput({
    args: ['-m', 'pip', 'install', '--upgrade', ...args],
    cwd,
    executable: pythonBin
  })
}

const getDefaultBin = () =>
  getProcessPlatform() === 'win32' ? 'python' : 'python3'

export const setupVenv = async (
  cwd: string,
  envDir: string,
  ...installArgs: string[]
) => {
  if (!exists(join(cwd, envDir))) {
    await createProcessWithOutput({
      args: ['-m', 'venv', envDir],
      cwd,
      executable: getDefaultBin()
    })
  }

  const venvPython = getVenvBinPath(cwd, envDir, 'python')

  await installPackages(cwd, venvPython, 'pip', 'wheel')

  return installPackages(cwd, venvPython, ...installArgs)
}

export const findPythonBin = async (
  pythonBin = getDefaultBin()
): Promise<string | undefined> => {
  try {
    return await executeProcess({
      args: ['-c', 'import sys; print(sys.executable)'],
      cwd: process.cwd(),
      executable: pythonBin
    })
  } catch {}
}
