import { ChildProcess } from 'child_process'
import { Readable } from 'stream'
import { Disposable } from '@hediet/std/disposable'
import execa from 'execa'

interface RunningProcess extends ChildProcess {
  all?: Readable
}
interface ProcessResult {
  command: string
  exitCode: number
  stdout: string
  stderr: string
  killed: boolean
  signal?: string
}

export type Process = RunningProcess & Promise<ProcessResult> & Disposable

export interface ProcessOptions {
  executable: string
  args: string[]
  cwd: string
  env?: NodeJS.ProcessEnv
}

export const createProcess = ({
  executable,
  args,
  cwd,
  env
}: ProcessOptions): Process => {
  const process = execa(executable, args, {
    all: true,
    cwd,
    env,
    extendEnv: true,
    windowsHide: true
  })

  Object.assign(process, {
    dispose: () => {
      process.kill('SIGINT')
    }
  })

  return process as unknown as Process
}

export const executeProcess = async (
  options: ProcessOptions
): Promise<string> => {
  const { stdout } = await createProcess(options)
  return stdout
}
