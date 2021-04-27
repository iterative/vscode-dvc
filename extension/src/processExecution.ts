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

type Process = RunningProcess & Promise<ProcessResult>

export interface ProcessOptions {
  executable: string
  args: string[]
  cwd: string
  env?: Record<string, string>
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

export const runProcess = async (
  processOptions: ProcessOptions
): Promise<string> => {
  const { stdout } = await createProcess(processOptions)
  return stdout
}
