import { Disposable } from '@hediet/std/disposable'
import { OutputChannel as VSOutputChannel, window } from 'vscode'
import { Cli } from './cli'

export class OutputChannel {
  public dispose = Disposable.fn()
  private readonly outputChannel: VSOutputChannel

  constructor(cliInteractors: Cli[], name = 'DVC') {
    this.outputChannel = this.dispose.track(window.createOutputChannel(name))

    cliInteractors.forEach(cli => {
      this.dispose.track(
        cli.onDidRun(event => this.outputChannel.append(event))
      )
    })
  }
}
