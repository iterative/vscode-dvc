import { ChildProcess } from 'child_process'
import { Readable } from 'stream'
import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import kill from 'tree-kill'
import { getProcessPlatform } from '../env'

const deferred = new Deferred()
export const esmModulesImported = deferred.promise

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
type EsmExeca = typeof import('execa').execa
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
type EsmProcessExists = typeof import('process-exists').processExists

const shouldImportEsm = !process.env.JEST_WORKER_ID

let execa: EsmExeca
let doesProcessExist: EsmProcessExists
const importEsmModules = async () => {
  const [{ execa: esmExeca }, { processExists: esmProcessExists }] =
    await Promise.all([import('execa'), import('process-exists')])
  execa = esmExeca
  doesProcessExist = esmProcessExists
  deferred.resolve()
}

if (shouldImportEsm) {
  void importEsmModules()
}

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

export type Process = RunningProcess &
  Promise<ProcessResult> &
  Disposable & { onDidDispose: Event<boolean> }

export interface ProcessOptions {
  executable: string
  args: string[]
  cwd: string
  detached?: boolean
  env?: NodeJS.ProcessEnv
}

const getOptions = (
  cwd: string,
  detached?: boolean,
  env?: NodeJS.ProcessEnv
) => {
  const options = {
    all: true,
    cwd,
    env,
    extendEnv: true,
    windowsHide: true
  }

  if (!detached) {
    return options
  }

  // a detached/non-shell/windowsHide process will error on Windows:
  // https://github.com/nodejs/node/issues/21825#issuecomment-503766781
  // use this workaround: https://github.com/sindresorhus/execa/issues/433
  const detachedOption =
    getProcessPlatform() === 'win32' ? { shell: true } : { detached }

  return { ...options, ...detachedOption }
}

export const createProcess = ({
  executable,
  args,
  cwd,
  detached,
  env
}: ProcessOptions): Process => {
  const options = getOptions(cwd, detached, env)

  const process = execa(executable, args, options)

  const disposed = new EventEmitter<boolean>()

  return Object.assign(process, {
    dispose: () => {
      kill(process.pid as number, 'SIGINT', () => disposed.fire(true))
    },
    onDidDispose: disposed.event
  })
}

export const executeProcess = async (
  options: ProcessOptions
): Promise<string> => {
  const { stdout } = await createProcess(options)
  return stdout
}

export const processExists = (pid: number): Promise<boolean> =>
  doesProcessExist(pid)

export const stopProcesses = async (pids: number[]): Promise<boolean> => {
  let allKilled = true
  for (const pid of pids) {
    if (!(await processExists(pid))) {
      allKilled = false
      continue
    }
    kill(pid)
  }
  return allKilled
}
