import { ChildProcess } from 'child_process'
import { Readable } from 'stream'
import { Disposable } from '@hediet/std/disposable'
import execa from 'execa'
import { Logger } from './common/logger'

interface RunningProcess extends ChildProcess {
  all?: Readable
}
interface ProcessResult {
  command: string
  exitCode: number | null
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

  return Object.assign(process, {
    dispose: () => {
      process.kill('SIGINT')
    }
  })
}

export const executeProcess = async (
  options: ProcessOptions
): Promise<string> => {
  const { stdout } = await createProcess(options)
  return stdout
}

const sendOutput = (process: Process) =>
  process.all?.on('data', chunk =>
    Logger.log(chunk.toString().replace(/(\r?\n)/g, ''))
  )

export const createProcessWithOutput = (options: ProcessOptions) => {
  const process = createProcess(options)

  sendOutput(process)

  return process
}
