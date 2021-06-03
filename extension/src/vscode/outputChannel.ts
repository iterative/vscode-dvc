import { Disposable } from '@hediet/std/disposable'
import { OutputChannel as VSOutputChannel, window } from 'vscode'
import { ICli } from '../cli'

export class OutputChannel {
  public dispose = Disposable.fn()
  private readonly outputChannel: VSOutputChannel

  constructor(cliInteractors: ICli[], name = 'DVC') {
    this.outputChannel = this.dispose.track(window.createOutputChannel(name))

    cliInteractors.forEach(cli => {
      this.dispose.track(
        cli.onDidCompleteProcess(result => {
          const { command, stderr } = result
          if (stderr) {
            return this.outputChannel.append(`> ${command} failed. ${stderr}\n`)
          }
          return this.outputChannel.append(`> ${command} \n`)
        })
      )
    })
  }
}
