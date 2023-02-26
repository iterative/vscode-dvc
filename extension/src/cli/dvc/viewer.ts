import { EventEmitter, Event } from 'vscode'
import { Args, Command, QueueSubCommand } from './constants'
import { getOptions } from './options'
import { CliResult, CliStarted, ICli, typeCheckCommands } from '..'
import { Config } from '../../config'
import { Disposable } from '../../class/dispose'
import { SingleUsePseudoTerminal } from '../../vscode/pseudoTerminal/singleUse'

export const autoRegisteredCommands = {
  QUEUE_LOGS: 'queueLogs'
} as const

export class DvcViewer extends Disposable implements ICli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  public readonly processCompleted: EventEmitter<CliResult>
  public readonly onDidCompleteProcess: Event<CliResult>

  public readonly processStarted: EventEmitter<CliStarted>
  public readonly onDidStartProcess: Event<CliStarted>

  private processes: {
    [key: string]: SingleUsePseudoTerminal
  }

  private readonly config: Config

  constructor(config: Config) {
    super()

    this.config = config

    this.processes = {}

    this.processCompleted = this.dispose.track(new EventEmitter<CliResult>())
    this.onDidCompleteProcess = this.processCompleted.event

    this.processStarted = this.dispose.track(new EventEmitter<CliStarted>())
    this.onDidStartProcess = this.processStarted.event
  }

  public run(cwd: string, ...args: Args) {
    const viewableProcess = this.getRunningProcess(cwd, ...args)
    if (viewableProcess) {
      return viewableProcess.show()
    }

    return this.viewProcess(cwd, args)
  }

  public queueLogs(cwd: string, expName: string) {
    return this.run(cwd, Command.QUEUE, QueueSubCommand.LOGS, expName, '-f')
  }

  public getRunningProcess(cwd: string, ...args: Args) {
    return this.processes[[cwd, ...args].join('')]
  }

  private viewProcess(cwd: string, args: Args) {
    const pseudoTerminal = this.dispose.track(
      new SingleUsePseudoTerminal(
        `DVC: ${args.join(' ')}`,
        this.getOptions(cwd, args),
        this.processStarted,
        this.processCompleted
      )
    )

    this.processes[[cwd, ...args].join('')] = pseudoTerminal
  }

  private getOptions(cwd: string, args: Args) {
    return getOptions(
      this.config.getPythonBinPath(),
      this.config.getCliPath(),
      cwd,
      ...args
    )
  }
}
