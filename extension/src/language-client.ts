import path from 'path'
import { ExtensionContext, workspace } from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node'
import { Disposable } from './class/dispose'

export class DVCLanguageClient extends Disposable {
  private client: LanguageClient

  constructor(context: ExtensionContext) {
    super()

    const serverModule = context.asAbsolutePath(
      path.join('..', 'languageServer', 'dist', 'server.js')
    )
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] }

    const serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: {
        module: serverModule,
        transport: TransportKind.ipc,
        options: debugOptions
      }
    }

    const clientOptions: LanguageClientOptions = {
      documentSelector: [
        {
          language: 'yaml'
        },
        {
          language: 'python'
        },
        {
          language: 'json'
        },
        {
          language: 'toml'
        }
      ],

      synchronize: {
        fileEvents: workspace.createFileSystemWatcher(
          '**/*.{yaml,dvc,dvc.lock,json,toml}'
        )
      }
    }

    this.client = new LanguageClient(
      'dvc-vscode-lsp',
      'DVC Language Server',
      serverOptions,
      clientOptions
    )

    // Start the client. This will also launch the server
    this.client.start()
  }

  stop() {
    this.client.stop()
  }
}
