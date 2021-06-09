import { Disposable } from '@hediet/std/disposable'
import { OutputChannel as VSOutputChannel, window } from 'vscode'
import { ICli } from '../cli'

export class OutputChannel {
  public dispose = Disposable.fn()
  private readonly outputChannel: VSOutputChannel
  private readonly version: string

  private getVersionAndISOString = () =>
    `[version: ${this.version}, ${new Date().toISOString()}]`

  constructor(cliInteractors: ICli[], version: string, name = 'DVC') {
    this.outputChannel = this.dispose.track(window.createOutputChannel(name))
    this.version = version

    cliInteractors.forEach(cli => {
      this.dispose.track(
        cli.onDidCompleteProcess(result => {
          const { command, stderr } = result
          if (stderr) {
            return this.outputChannel.append(
              `${this.getVersionAndISOString()} > ${command} failed. ${stderr}\n`
            )
          }
          return this.outputChannel.append(
            `${this.getVersionAndISOString()} > ${command} \n`
          )
        })
      )
    })
  }
}
