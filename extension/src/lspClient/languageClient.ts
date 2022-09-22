import { workspace } from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node'
import { documentSelector, serverModule } from 'dvc-vscode-lsp'
import { Disposable } from '../class/dispose'

export class LanguageClientWrapper extends Disposable {
  private client: LanguageClient

  constructor() {
    super()

    const clientOptions: LanguageClientOptions = {
      documentSelector,

      synchronize: {
        fileEvents: workspace.createFileSystemWatcher(
          '**/*.{yaml,dvc,dvc.lock,json,toml}'
        )
      }
    }

    this.client = this.dispose.track(
      new LanguageClient(
        'dvc-vscode-lsp',
        'DVC Language Server',
        this.getServerOptions(),
        clientOptions
      )
    )

    // Start the client. This will also launch the server
    this.start()
  }

  start() {
    this.client.start()

    return this
  }

  stop() {
    this.client.stop()
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
