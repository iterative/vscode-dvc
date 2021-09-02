import { Disposable } from '@hediet/std/disposable'
import { OutputChannel as VSOutputChannel, window } from 'vscode'
import { ICli } from '../cli'

enum ProcessStatus {
  INITIALIZED = 'INITIALIZED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export class OutputChannel {
  public dispose = Disposable.fn()
  private readonly outputChannel: VSOutputChannel
  private readonly version: string

  constructor(cliInteractors: ICli[], version: string, name = 'DVC') {
    this.outputChannel = this.dispose.track(window.createOutputChannel(name))
    this.version = version

    cliInteractors.forEach(cli => {
      this.onDidStartProcess(cli)

      this.onDidCompleteProcess(cli)
    })
  }

  private onDidStartProcess(cli: ICli) {
    this.dispose.track(
      cli.onDidStartProcess(({ command, pid }) => {
        this.outputChannel.append(
          `[${this.getVersionAndISOString()}, pid: ${pid}] > ${command} - ${
            ProcessStatus.INITIALIZED
          }\n`
        )
      })
    )
  }

  private onDidCompleteProcess(cli: ICli) {
    this.dispose.track(
      cli.onDidCompleteProcess(
        ({ command, duration, exitCode, pid, stderr }) => {
          const processStatus = stderr
            ? ProcessStatus.FAILED
            : ProcessStatus.COMPLETED

          let prefix = `[${this.getVersionAndISOString()}, pid: ${pid}] > ${command} - ${processStatus}`

          if (exitCode) {
            prefix += ` with code ${exitCode}`
          }

          prefix += ` (${duration}ms)`

          if (stderr) {
            prefix += `\n${stderr}`
          }
          prefix += `\n`

          return this.outputChannel.append(prefix)
        }
      )
    )
  }

  private getVersionAndISOString() {
    return `version: ${this.version}, ${new Date().toISOString()}`
  }
}
