import { OutputChannel as VSOutputChannel, window } from 'vscode'
import { BaseClass } from '../class'
import { ICli } from '../cli'

enum ProcessStatus {
  INITIALIZED = 'INITIALIZED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export class OutputChannel extends BaseClass {
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
        ({ command, duration, exitCode, pid, stderr }) => {
          const processStatus =
            exitCode && stderr ? ProcessStatus.FAILED : ProcessStatus.COMPLETED

          const baseOutput = this.getBaseOutput(pid, command, processStatus)
          const completionOutput = this.getCompletionOutput(
            exitCode,
            duration,
            stderr
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
    stderr?: string
  ) {
    let completionOutput = ''
    if (exitCode) {
      completionOutput += ` with code ${exitCode}`
    }

    completionOutput += ` (${duration}ms)`

    if (exitCode && stderr) {
      completionOutput += `\n${stderr}`
    }

    return completionOutput
  }
}
