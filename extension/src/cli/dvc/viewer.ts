import { EventEmitter, Event } from 'vscode'
import { Args, Command, Flag, QueueSubCommand } from './constants'
import { getOptions } from './options'
import { CliResult, CliStarted, ICli, typeCheckCommands } from '..'
import { Config } from '../../config'
import { Disposable } from '../../class/dispose'
import { ViewableCliProcess } from '../viewable'

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
    [id: string]: ViewableCliProcess
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

  public run(name: string, cwd: string, ...args: Args) {
    const viewableProcess = this.getRunningProcess(cwd, ...args)
    if (viewableProcess) {
      return viewableProcess.show()
    }

    return this.createProcess(name, cwd, args)
  }

  public queueLogs(cwd: string, id: string) {
    return this.run(
      `${id} logs`,
      cwd,
      Command.QUEUE,
      QueueSubCommand.LOGS,
      id,
      Flag.FOLLOW
    )
  }

  private createProcess(name: string, cwd: string, args: Args) {
    const viewableProcess = this.viewProcess(name, cwd, args)

    this.setRunningProcess(viewableProcess, cwd, ...args)

    const listener = this.dispose.track(
      viewableProcess.onDidDispose(() => {
        delete this.processes[this.getId(cwd, ...args)]
        this.dispose.untrack(listener)
        listener.dispose()
      })
    )
  }

  private viewProcess(name: string, cwd: string, args: Args) {
    return this.dispose.track(
      new ViewableCliProcess(
        `DVC: ${name}`,
        this.getOptions(cwd, args),
        this.processStarted,
        this.processCompleted
      )
    )
  }

  private getOptions(cwd: string, args: Args) {
    return getOptions(
      this.config.getPythonBinPath(),
      this.config.getCliPath(),
      cwd,
      ...args
    )
  }

  private getRunningProcess(cwd: string, ...args: Args) {
    return this.processes[this.getId(cwd, ...args)]
  }

  private setRunningProcess(
    viewableProcess: ViewableCliProcess,
    cwd: string,
    ...args: Args
  ) {
    this.processes[this.getId(cwd, ...args)] = viewableProcess
  }

  private getId(cwd: string, ...args: Args) {
    return [cwd, ...args].join(':')
  }
}
