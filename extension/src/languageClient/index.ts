import { Uri, workspace } from 'vscode'
import {
  LanguageClient as Client,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node'
import { documentSelector, serverModule } from 'dvc-vscode-lsp'
import { Disposable } from '../class/dispose'
import { isFile } from '../fileSystem'

export class LanguageClient extends Disposable {
  private client: Client

  constructor() {
    super()

    const clientOptions: LanguageClientOptions = {
      documentSelector,
      synchronize: {
        fileEvents: workspace.createFileSystemWatcher('**/dvc.yaml')
      }
    }

    this.client = this.dispose.track(
      new Client(
        'dvc-vscode-lsp',
        'DVC Language Server',
        this.getServerOptions(),
        clientOptions
      )
    )

    this.dispose.track(
      this.client.onRequest('isFile', (uri: string) => {
        try {
          const path = Uri.parse(uri).fsPath
          return { isFile: isFile(path) }
        } catch {
          return null
        }
      })
    )

    void this.client.start()
  }

  private getServerOptions(): ServerOptions {
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] }

    return {
      debug: {
        module: serverModule,
        options: debugOptions,
        transport: TransportKind.ipc
      },
      run: { module: serverModule, transport: TransportKind.ipc }
    }
  }
}
