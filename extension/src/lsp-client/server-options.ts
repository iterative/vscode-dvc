import { serverModule } from 'dvc-vscode-lsp'
import { ServerOptions, TransportKind } from 'vscode-languageclient/node'

export class ServerModule {
  options: ServerOptions

  constructor() {
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] }

    this.options = {
      debug: {
        module: serverModule,
        options: debugOptions,
        transport: TransportKind.ipc
      },
      run: { module: serverModule, transport: TransportKind.ipc }
    }
  }
}
