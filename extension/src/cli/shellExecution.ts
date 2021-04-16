import { Config } from '../Config'
import { Commands } from './commands'
import { getProcessEnv } from '../env'
import { spawn } from 'child_process'
import { EventEmitter } from 'vscode'

const getPATH = (existingPath: string, pythonBinPath?: string): string =>
  [pythonBinPath, existingPath].filter(Boolean).join(':')

const getEnv = (config: Config): NodeJS.ProcessEnv => {
  const env = getProcessEnv()
  const PATH = getPATH(env?.PATH as string, config.pythonBinPath)
  return {
    ...env,
    PATH
  }
}

interface cliExecutionDetails {
  cwd: string
  env: NodeJS.ProcessEnv
  executionCommand: string
  outputCommand: string
}

export const getExecutionDetails = (
  config: Config,
  command: Commands,
  cwd: string
): cliExecutionDetails => {
  const cliPath = config.dvcPath || 'dvc'
  const env = getEnv(config)
  return {
    cwd,
    env,
    executionCommand: `${cliPath} ${command}`,
    outputCommand: `dvc ${command}`
  }
}

const getOutput = (data: string | Buffer): string =>
  data
    .toString()
    .split(/(\r?\n)/g)
    .join('\r')

export class ShellExecution {
  private readonly completedEventEmitter: EventEmitter<void>
  private readonly outputEventEmitter: EventEmitter<string>
  private readonly startedEventEmitter: EventEmitter<void>

  async run(executionDetails: cliExecutionDetails): Promise<void> {
    return new Promise(resolve => {
      const { cwd, env, executionCommand, outputCommand } = executionDetails

      this.outputEventEmitter.fire(`${outputCommand}\r\n`)

      const stream = spawn(`${executionCommand}`, {
        cwd,
        env,
        shell: true
      })
      this.startedEventEmitter.fire()

      const outputListener = (chunk: string | Buffer) => {
        const output = getOutput(chunk)
        this.outputEventEmitter.fire(output)
      }
      stream.stdout?.on('data', outputListener)

      stream.stderr?.on('data', outputListener)

      stream.on('close', () => {
        this.completedEventEmitter.fire()
        resolve()
      })
    })
  }

  constructor(emitters: {
    completedEventEmitter: EventEmitter<void>
    outputEventEmitter: EventEmitter<string>
    startedEventEmitter: EventEmitter<void>
  }) {
    this.completedEventEmitter = emitters.completedEventEmitter
    this.outputEventEmitter = emitters.outputEventEmitter
    this.startedEventEmitter = emitters.startedEventEmitter
  }
}
