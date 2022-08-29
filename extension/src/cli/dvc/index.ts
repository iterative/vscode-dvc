import { EventEmitter } from 'vscode'
import { Args } from './constants'
import { getOptions } from './options'
import { Cli, CliResult, CliStarted } from '..'
import { Config } from '../../config'

export class DvcCli extends Cli {
  public autoRegisteredCommands: string[] = []

  protected readonly config: Config

  constructor(
    config: Config,
    emitters?: {
      processStarted: EventEmitter<CliStarted>
      processCompleted: EventEmitter<CliResult>
    }
  ) {
    super(emitters)

    this.config = config
  }

  public executeDvcProcess(cwd: string, ...args: Args): Promise<string> {
    const options = getOptions(
      this.config.pythonBinPath,
      this.config.getCliPath(),
      cwd,
      ...args
    )
    return this.executeProcess(options)
  }
}
