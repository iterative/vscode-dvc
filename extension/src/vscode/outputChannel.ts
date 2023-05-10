import { OutputChannel as VSOutputChannel, window } from 'vscode'
import { Disposable } from '../class/dispose'
import { ICli } from '../cli'

enum ProcessStatus {
  INITIALIZED = 'INITIALIZED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export class OutputChannel extends Disposable {
  private readonly outputChannel: VSOutputChannel
  private readonly version: string

  constructor(cliInteractors: ICli[], version: string, name = 'DVC') {
    super()

    this.outputChannel = this.dispose.track(window.createOutputChannel(name))
    this.version = version

    for (const cli of cliInteractors) {
      this.onDidStartProcess(cli)
      this.onDidCompleteProcess(cli)
    }
  }

  public show() {
    return this.outputChannel.show()
  }

  private onDidStartProcess(cli: ICli) {
    this.dispose.track(
      cli.onDidStartProcess(({ command, pid }) => {
        this.outputChannel.append(
          `${this.getBaseOutput(pid, command, ProcessStatus.INITIALIZED)}\n`
        )
      })
    )
  }

  private onDidCompleteProcess(cli: ICli) {
    this.dispose.track(
      cli.onDidCompleteProcess(
        ({ command, duration, exitCode, pid, errorOutput }) => {
          const processStatus =
            exitCode && errorOutput
              ? ProcessStatus.FAILED
              : ProcessStatus.COMPLETED

          const baseOutput = this.getBaseOutput(pid, command, processStatus)
          const completionOutput = this.getCompletionOutput(
            exitCode,
            duration,
            errorOutput
          )

          return this.outputChannel.append(`${baseOutput}${completionOutput}\n`)
        }
      )
    )
  }

  private getBaseOutput(
    pid: number | undefined,
    command: string,
    processStatus: ProcessStatus
  ) {
    return `${this.getPrefix(pid)} > ${command} - ${processStatus}`
  }

  private getPrefix(pid = 0) {
    return `[version: ${
      this.version
    }, ${new Date().toISOString()}, pid: ${pid}]`
  }

  private getCompletionOutput(
    exitCode: number | null,
    duration: number,
    errorOutput?: string
  ) {
    let completionOutput = ''
    if (exitCode) {
      completionOutput += ` with code ${exitCode}`
    }

    completionOutput += ` (${duration}ms)`

    if (exitCode && errorOutput) {
      completionOutput += `\n${errorOutput}`
    }

    return completionOutput
  }
}
