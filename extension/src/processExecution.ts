import { ChildProcess } from 'child_process'
import execa from 'execa'
import { Readable } from 'stream'

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

export type Process = RunningProcess & Promise<ProcessResult>

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
  return execa(executable, args, {
    all: true,
    cwd,
    env,
    extendEnv: true
  })
}

export const executeProcess = async (
  options: ProcessOptions
): Promise<string> => {
  try {
    const { stdout } = await createProcess(options)
    return stdout
  } catch (e) {
    return Promise.reject(e.stderr)
  }
}
