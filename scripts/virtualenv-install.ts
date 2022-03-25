import { join, resolve } from 'path'
import { createProcess, Process } from 'dvc/src/processExecution'
import { exists } from 'dvc/src/fileSystem'
import { Logger } from 'dvc/src/common/logger'

const ENV_DIR = '.env'

const cwd = resolve(__dirname, '..', 'demo')

const sendOutput = (process: Process) =>
  process.all?.on('data', chunk =>
    Logger.log(chunk.toString().replace(/(\r?\n)/g, ''))
  )

const createProcessWithOutput = (executable: string, args: string[]) => {
  const process = createProcess({
    args,
    cwd,
    executable
  })

  sendOutput(process)

  return process
}

const upgradePip = (pythonBin: string) => {
  return createProcessWithOutput(pythonBin, [
    '-m',
    'pip',
    'install',
    '--upgrade',
    'pip'
  ])
}

const installVirtualEnv = (pythonBin: string) => {
  return createProcessWithOutput(pythonBin, [
    '-m',
    'pip',
    'install',
    '--upgrade',
    '-r',
    join('.', 'requirements.txt')
  ])
}

const setupVenv = async () => {
  if (!exists(join(cwd, ENV_DIR))) {
    await createProcessWithOutput(
      process.platform === 'win32' ? 'python' : 'python3',
      ['-m', 'venv', ENV_DIR]
    )
  }

  const venvPython =
    process.platform === 'win32'
      ? join(cwd, ENV_DIR, 'Scripts', 'python.exe')
      : join(cwd, ENV_DIR, 'bin', 'python')

  await upgradePip(venvPython)

  return installVirtualEnv(venvPython)
}

setupVenv()
