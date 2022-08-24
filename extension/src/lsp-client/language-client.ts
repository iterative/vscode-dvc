import { ExtensionContext, workspace } from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions
} from 'vscode-languageclient/node'
import { ServerModule } from './server-options'
import { Disposable } from '../class/dispose'

export class DVCLanguageClient extends Disposable {
  private client: LanguageClient

  constructor(context: ExtensionContext) {
    super()

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
      new ServerModule(context).options,
      clientOptions
    )

    // Start the client. This will also launch the server
    this.dispose.track(this.start())
  }

  start() {
    this.client.start()
    return this
  }

  stop() {
    this.client.stop()
  }
}
