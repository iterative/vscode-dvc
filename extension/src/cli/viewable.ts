import { Event, EventEmitter } from 'vscode'
import { CliEvent, CliResult, CliStarted } from '.'
import {
  captureStdErr,
  notifyCompleted,
  notifyOutput,
  notifyStarted
} from './util'
import { getCommandString } from './command'
import { ProcessOptions, createProcess } from '../process/execution'
import { StopWatch } from '../util/time'
import { PseudoTerminal } from '../vscode/pseudoTerminal'
import { DeferredDisposable } from '../class/deferred'

export class ViewableCliProcess extends DeferredDisposable {
  public readonly onDidDispose: Event<void>

  private readonly pseudoTerminal: PseudoTerminal

  constructor(
    id: string,
    options: ProcessOptions,
    processStarted: EventEmitter<CliStarted>,
    processCompleted: EventEmitter<CliResult>
  ) {
    super()
    const processOutput = this.dispose.track(new EventEmitter<string>())
    const terminalClosed = this.dispose.track(new EventEmitter<void>())
    const onDidCloseTerminal = terminalClosed.event

    this.pseudoTerminal = this.dispose.track(
      new PseudoTerminal(processOutput, terminalClosed, id)
    )

    this.pseudoTerminal.setBlocked(true)
    void this.show().then(() => this.deferred.resolve())

    this.createProcess(options, processStarted, processOutput, processCompleted)

    const disposed = this.dispose.track(new EventEmitter<void>())
    this.onDidDispose = disposed.event

    this.dispose.track(
      onDidCloseTerminal(() => {
        disposed.fire()
        this.dispose()
      })
    )
  }

  public show() {
    return this.pseudoTerminal.openCurrentInstance()
  }

  private createProcess(
    options: ProcessOptions,
    processStarted: EventEmitter<CliEvent>,
    processOutput: EventEmitter<string>,
    processCompleted: EventEmitter<CliResult>
  ) {
    const stopWatch = new StopWatch()
    const command = getCommandString(options)
    processOutput.fire(`Running: ${command}\r\n\n`)
    const process = this.dispose.track(createProcess(options))

    const baseEvent = { command, cwd: options.cwd, pid: process.pid }

    notifyStarted(baseEvent, processStarted)

    notifyOutput(process, processOutput)

    const stderr = captureStdErr(process)

    void process.on('close', exitCode => {
      void this.dispose.untrack(process)
      notifyCompleted(
        {
          ...baseEvent,
          duration: stopWatch.getElapsedTime(),
          exitCode,
          stderr
        },
        processCompleted
      )
      this.pseudoTerminal.setBlocked(false)
      processOutput.fire('\r\nPress any key to close\r\n\n')
    })
  }
}
