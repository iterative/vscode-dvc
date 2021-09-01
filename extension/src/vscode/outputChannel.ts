import { Disposable } from '@hediet/std/disposable'
import { OutputChannel as VSOutputChannel, window } from 'vscode'
import { ICli } from '../cli'

export class OutputChannel {
  public dispose = Disposable.fn()
  private readonly outputChannel: VSOutputChannel
  private readonly version: string

  constructor(cliInteractors: ICli[], version: string, name = 'DVC') {
    this.outputChannel = this.dispose.track(window.createOutputChannel(name))
    this.version = version

    cliInteractors.forEach(cli => {
      this.dispose.track(
        cli.onDidCompleteProcess(result => {
          const { command, stderr, pid } = result
          if (stderr) {
            return this.outputChannel.append(
              `${this.getPrefix(pid)} > ${command} failed. ${stderr}\n`
            )
          }
          return this.outputChannel.append(
            `${this.getPrefix(pid)} > ${command} \n`
          )
        })
      )
    })
  }

  private getPrefix(pid: number | undefined) {
    return `[${this.getVersionAndISOString()}, pid: ${pid}]`
  }

  private getVersionAndISOString() {
    return `version: ${this.version}, ${new Date().toISOString()}`
  }
}
