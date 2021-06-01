import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { getProcessEnv } from '../env'
import { Args } from './args'
import { CliError } from './error'
import { executeProcess } from '../processExecution'
import { Config } from '../config'

const getPATH = (existingPath: string, pythonBinPath?: string): string =>
  [pythonBinPath, existingPath].filter(Boolean).join(':')

export const getEnv = (pythonBinPath?: string): NodeJS.ProcessEnv => {
  const env = getProcessEnv()
  const PATH = getPATH(env?.PATH as string, pythonBinPath)
  return {
    ...env,
    PATH
  }
}

export type CliResult = { stderr?: string; command: string }

export class Cli {
  public dispose = Disposable.fn()

  protected config: Config

  private ran: EventEmitter<CliResult>
  public onDidRun: Event<CliResult>

  private getExecutionOptions(cwd: string, args: Args) {
    return {
      args,
      cwd,
      env: getEnv(this.config.pythonBinPath),
      executable: this.config.getCliPath() || 'dvc'
    }
  }

  public async executeProcess(cwd: string, ...args: Args): Promise<string> {
    const command = `dvc ${args.join(' ')}`
    const options = this.getExecutionOptions(cwd, args)
    try {
      const stdout = await executeProcess(options)
      this.ran?.fire({ command })
      return stdout
    } catch (error) {
      const cliError = new CliError({ baseError: error, options })
      this.ran?.fire({ command, stderr: cliError.stderr })
      throw cliError
    }
  }

  constructor(config: Config, ran?: EventEmitter<CliResult>) {
    this.config = config

    this.ran = ran || this.dispose.track(new EventEmitter<CliResult>())
    this.onDidRun = this.ran.event
  }
}
