import { Uri, workspace } from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node'
import { documentSelector, serverModule } from 'dvc-vscode-lsp'
import { readFileSync } from 'fs-extra'
import { Disposable } from '../class/dispose'
import { findFiles } from '../fileSystem/workspace'

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
    void this.start()
  }

  async start() {
    await this.client.start()

    const files = await findFiles('**/*.{yaml,json,py,toml}', '.??*')

    const textDocuments = files.map(filePath => {
      const uri = Uri.file(filePath).toString()
      const languageId = filePath.endsWith('yaml') ? 'yaml' : 'json'
      const text = readFileSync(filePath, 'utf8')

      return {
        languageId,
        text,
        uri,
        version: 0
      }
    })

    await this.client.sendRequest('initialTextDocuments', {
      textDocuments
    })

    return this
  }

  stop() {
    void this.client.stop()
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
