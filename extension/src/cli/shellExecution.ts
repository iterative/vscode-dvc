import { spawn } from 'child_process'
import { EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Config } from '../Config'
import { Commands } from './commands'
import { getProcessEnv } from '../env'

interface cliExecutionDetails {
  cwd: string
  env: NodeJS.ProcessEnv
  executionCommand: string
  outputCommand: string
}

export class ShellExecution {
  public readonly dispose = Disposable.fn()

  private readonly config: Config
  private readonly completedEventEmitter?: EventEmitter<void>
  private readonly outputEventEmitter?: EventEmitter<string>
  private readonly startedEventEmitter?: EventEmitter<void>

  private getPATH(existingPath: string): string {
    return [this.config.pythonBinPath, existingPath].filter(Boolean).join(':')
  }

  private getEnv(): NodeJS.ProcessEnv {
    const env = getProcessEnv()
    const PATH = this.getPATH(env?.PATH as string)
    return {
      ...env,
      PATH
    }
  }

  public getCommand(cliPath: string, command: Commands) {
    return `${cliPath} ${command}`
  }

  private getExecutionDetails(
    command: Commands,
    cwd: string
  ): cliExecutionDetails {
    const cliPath = this.config.dvcPath || 'dvc'
    const env = this.getEnv()
    return {
      cwd,
      env,
      executionCommand: this.getCommand(cliPath, command),
      outputCommand: `dvc ${command}`
    }
  }

  private getOutput(data: string | Buffer): string {
    return data
      .toString()
      .split(/(\r?\n)/g)
      .join('\r')
  }

  public async run(
    command: Commands,
    currentWorkingDirectory: string
  ): Promise<void> {
    const {
      cwd,
      env,
      executionCommand,
      outputCommand
    } = this.getExecutionDetails(command, currentWorkingDirectory)

    this.outputEventEmitter?.fire(`${outputCommand}\r\n`)

    const stream = spawn(`${executionCommand}`, {
      cwd,
      env,
      shell: true
    })
    this.startedEventEmitter?.fire()

    const outputListener = (chunk: string | Buffer) => {
      const output = this.getOutput(chunk)
      this.outputEventEmitter?.fire(output)
    }
    stream.stdout?.on('data', outputListener)

    stream.stderr?.on('data', outputListener)

    stream.on('close', () => {
      this.completedEventEmitter?.fire()
    })
  }

  constructor(
    config: Config,
    emitters?: {
      completedEventEmitter?: EventEmitter<void>
      outputEventEmitter?: EventEmitter<string>
      startedEventEmitter?: EventEmitter<void>
    }
  ) {
    this.config = config
    this.completedEventEmitter = emitters?.completedEventEmitter
    this.outputEventEmitter = emitters?.outputEventEmitter
    this.startedEventEmitter = emitters?.startedEventEmitter
  }
}
