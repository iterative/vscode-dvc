import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { getProcessEnv } from '../env'
import { Args } from './args'
import { executeProcess } from '../processExecution'
import { Config } from '../Config'
import { CliProcessError } from '../vscode/reporting'

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

export class Cli {
  public dispose = Disposable.fn()

  protected config: Config

  private ran: EventEmitter<string>
  public onDidRun: Event<string>

  private getExecutionOptions(cwd: string, args: Args) {
    return {
      executable: this.config.getCliPath() || 'dvc',
      args,
      cwd,
      env: getEnv(this.config.pythonBinPath)
    }
  }

  public async executeProcess(cwd: string, ...args: Args): Promise<string> {
    const command = `dvc ${args.join(' ')}`
    const options = this.getExecutionOptions(cwd, args)
    try {
      const stdout = await executeProcess(options)
      this.ran?.fire(`> ${command}\n`)
      return stdout
    } catch (error) {
      const cliError = new CliProcessError({ options, baseError: error })
      this.ran?.fire(`> ${command} failed. ${cliError.stderr}\n`)
      throw cliError
    }
  }

  constructor(config: Config, ran?: EventEmitter<string>) {
    this.config = config

    this.ran = ran || this.dispose.track(new EventEmitter<string>())
    this.onDidRun = this.ran.event
  }
}
