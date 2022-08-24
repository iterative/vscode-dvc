import path from 'path'
import { ExtensionContext } from 'vscode'
import { ServerOptions, TransportKind } from 'vscode-languageclient/node'

export class ServerModule {
  options: ServerOptions

  constructor(context: ExtensionContext) {
    const serverModule = context.asAbsolutePath(
      path.join('..', 'languageServer', 'dist', 'server.js')
    )
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
