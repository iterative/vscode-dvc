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
} from '../process/execution'

const sendOutput = (process: Process) => {
  process.all?.on('data', chunk =>
    Logger.log((chunk as Buffer).toString().replace(/(\r?\n)/g, ''))
  )
  return process
}

export const installPackages = (
  cwd: string,
  pythonBin: string,
  isGlobalEnv: boolean,
  ...args: string[]
): Process => {
  const options: ProcessOptions = {
    args: ['-m', 'pip', 'install', '--upgrade'],
    cwd,
    executable: pythonBin
  }

  if (isGlobalEnv) {
    options.args.push('--user')
  }

  options.args.push(...args)

  return createProcess(options)
}

export const getDefaultPython = (): string =>
  getProcessPlatform() === 'win32' ? 'python' : 'python3'

export const setupTestVenv = async (
  cwd: string,
  envDir: string,
  isGlobalEnv: boolean,
  ...installArgs: string[]
) => {
  if (!exists(join(cwd, envDir))) {
    const initVenv = createProcess({
      args: ['-m', 'venv', envDir],
      cwd,
      executable: getDefaultPython()
    })
    await sendOutput(initVenv)
  }

  const venvPython = getVenvBinPath(cwd, envDir, 'python')

  const venvUpgrade = installPackages(
    cwd,
    venvPython,
    isGlobalEnv,
    'pip',
    'wheel'
  )
  await sendOutput(venvUpgrade)

  const installRequestedPackages = installPackages(
    cwd,
    venvPython,
    isGlobalEnv,
    ...installArgs
  )
  return sendOutput(installRequestedPackages)
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
