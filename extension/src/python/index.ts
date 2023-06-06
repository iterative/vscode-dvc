import { join } from 'path'
import { getVenvBinPath } from './path'
import { getProcessPlatform } from '../env'
import { exists } from '../fileSystem'
import { Logger } from '../common/logger'
import { createProcess, executeProcess, Process } from '../process/execution'
import { Toast } from '../vscode/toast'
import { Environment } from '../extensions/python'

const sendOutput = (process: Process) => {
  process.all?.on('data', chunk =>
    Logger.log((chunk as Buffer).toString().replace(/(\r?\n)/g, ''))
  )
  return process
}

const fileToCommandArgument = (value: string): string => {
  if (!value) {
    return value
  }

  const toCommandArgument =
    value.includes(' ') && !value.startsWith('"') && !value.endsWith('"')
      ? `"${value}"`
      : value.toString()

  return toCommandArgument.replace(/\\/g, '/')
}

const getCondaOptions = (
  cwd: string,
  envInfo: Environment,
  ...args: string[]
) => {
  const defaultArgs = ['install', '-c', 'conda-forge', '-y']

  if (envInfo.environment.name) {
    defaultArgs.push('--name', envInfo.environment.name)
  } else {
    defaultArgs.push(
      '--prefix',
      // need to research on getting prefix path
      // not sure if this is the best way
      fileToCommandArgument(envInfo.environment.folderUri.path)
    )
  }

  return {
    args: [...defaultArgs, ...args],
    cwd,
    executable: 'conda'
  }
}

export const getPipOptions = (
  cwd: string,
  pythonBin: string,
  ...args: string[]
) => {
  return {
    args: ['-m', 'pip', 'install', '--upgrade', ...args],
    cwd,
    executable: pythonBin
  }
}

export const installPackages = (
  cwd: string,
  pythonBin: string,
  envInfo: Environment | undefined,
  ...args: string[]
) => {
  const envType = envInfo?.environment?.type
  let opts = getPipOptions(cwd, pythonBin, ...args)
  if (envInfo && envType === 'Conda') {
    opts = getCondaOptions(cwd, envInfo, ...args)
  }
  return createProcess(opts)
}

export const getDefaultPython = (): string =>
  getProcessPlatform() === 'win32' ? 'python' : 'python3'

export const setupTestVenv = async (
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
    await sendOutput(initVenv)
  }

  const venvPython = getVenvBinPath(cwd, envDir, 'python')

  const venvUpgrade = installPackages(cwd, venvPython, 'pip', 'wheel')
  await sendOutput(venvUpgrade)

  const installRequestedPackages = installPackages(
    cwd,
    venvPython,
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
