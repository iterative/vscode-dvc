import { spawn } from 'child_process'
import { getProcessEnv } from '../env'
import { Commands } from './commands'
import { execPromise } from '../util/exec'
import { trim, trimAndSplit } from '../util/stdout'
import { PromiseWithChild } from 'node:child_process'
export interface ReaderOptions {
  cliPath: string | undefined
  pythonBinPath: string | undefined
  cwd: string
}

type ExecutionOptions = ReaderOptions & {
  command: Commands
}

const getPATH = (existingPath: string, pythonBinPath?: string): string =>
  [pythonBinPath, existingPath].filter(Boolean).join(':')

const getEnv = (pythonBinPath?: string): NodeJS.ProcessEnv => {
  const env = getProcessEnv()
  const PATH = getPATH(env?.PATH as string, pythonBinPath)
  return {
    ...env,
    PATH
  }
}

export const getExecutionDetails = (
  options: ExecutionOptions
): {
  command: string
  cwd: string
  env: NodeJS.ProcessEnv
} => {
  const { command, cliPath, pythonBinPath } = options
  return {
    env: getEnv(pythonBinPath),
    command: `${cliPath || 'dvc'} ${command}`,
    cwd: options.cwd
  }
}

interface CompletionEvent {
  code: number | null
  signal: NodeJS.Signals | null
}

export const spawnProcess = (
  options: ReaderOptions,
  partialCommand: Commands
): PromiseWithChild<CompletionEvent> => {
  const { command, cwd, env } = getExecutionDetails({
    ...options,
    command: partialCommand
  })

  const [executable, ...args] = command.split(' ')

  const childProcess = spawn(executable, args, {
    cwd,
    env
  })

  const promise: Promise<CompletionEvent> = new Promise(resolve => {
    childProcess.on('close', (code, signal) => resolve({ code, signal }))
  })
  ;(promise as PromiseWithChild<CompletionEvent>).child = childProcess

  return promise as PromiseWithChild<CompletionEvent>
}

export const execProcess = <T>(
  options: ReaderOptions,
  partialCommand: Commands,
  formatter: typeof trimAndSplit | typeof trim | typeof JSON.parse = trim
): PromiseWithChild<T> => {
  const { command, cwd, env } = getExecutionDetails({
    ...options,
    command: partialCommand
  })
  const basePromiseWithChild = execPromise(command, {
    cwd,
    env
  })
  const { child } = basePromiseWithChild

  const promise: Promise<T> | PromiseWithChild<T> = new Promise(
    (resolve, reject) => {
      basePromiseWithChild
        .then(({ stdout }) => {
          resolve((formatter(stdout) as unknown) as T)
        })
        .catch(({ stdout, stderr }) => {
          const err = Object.assign(new Error(), {
            stdout,
            stderr
          })
          if (child) {
            Object.assign(err, {
              code: child.exitCode,
              signal: child.signalCode
            })
          }
          reject(err)
        })
    }
  )
  ;(promise as PromiseWithChild<T>).child = child

  return promise as PromiseWithChild<T>
}
