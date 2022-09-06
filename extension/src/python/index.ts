import { join } from 'path'
import { getVenvBinPath } from './path'
import { getProcessPlatform } from '../env'
import { exists } from '../fileSystem'
import { Logger } from '../common/logger'
import { createProcess, Process, ProcessOptions } from '../processExecution'

const sendOutput = (process: Process) =>
  process.all?.on('data', chunk =>
    Logger.log(chunk.toString().replace(/(\r?\n)/g, ''))
  )

export const createProcessWithOutput = (options: ProcessOptions) => {
  const process = createProcess(options)

  sendOutput(process)

  return process
}

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
