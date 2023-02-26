import { EventEmitter } from 'vscode'
import { BasePseudoTerminal } from './base'
import { ProcessOptions, createProcess } from '../../processExecution'
import { CliResult, CliStarted } from '../../cli'
import { getCommandString } from '../../cli/command'
import { StopWatch } from '../../util/time'

export class SingleUsePseudoTerminal extends BasePseudoTerminal {
  constructor(
    termName: string,
    options: ProcessOptions,
    processStarted: EventEmitter<CliStarted>,
    processCompleted: EventEmitter<CliResult>
  ) {
    const processOutput = new EventEmitter<string>()
    const processTerminated = new EventEmitter<string>()

    super(processOutput, processTerminated, termName)

    this.setBlocked(true)
    void this.createInstance()

    this.dispose.track(processOutput)
    this.dispose.track(processTerminated)

    const process = this.dispose.track(createProcess(options))

    const command = getCommandString(options)
    const baseEvent = { command, cwd: options.cwd, pid: process.pid }

    processStarted.fire(baseEvent)
    processOutput.fire(`Running: dvc ${options.args.join(' ')}\r\n\n`)

    process.all?.on('data', chunk =>
      processOutput.fire(
        (chunk as Buffer)
          .toString()
          .split(/(\r?\n)/g)
          .join('\r')
      )
    )

    let stderr = ''
    process.stderr?.on(
      'data',
      chunk => (stderr += (chunk as Buffer).toString())
    )

    const stopWatch = new StopWatch()

    const onDidTerminateProcess = processTerminated.event

    this.dispose.track(
      onDidTerminateProcess(() => {
        process.dispose()
      })
    )

    void process.on('close', exitCode => {
      void this.dispose.untrack(process)

      processCompleted.fire({
        ...baseEvent,
        duration: stopWatch.getElapsedTime(),
        exitCode,
        stderr
      })
      processOutput.fire('\r\nPress any key to close\r\n\n')
    })
  }

  public show() {
    return this.instance?.show()
  }
}
