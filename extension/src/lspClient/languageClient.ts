import { extname } from 'path'
import { Uri, workspace } from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node'
import { readFileSync } from 'fs-extra'
import { documentSelector, serverModule } from 'dvc-vscode-lsp'
import { Disposable } from '../class/dispose'
import { isDirectory } from '../fileSystem'

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

    this.client.onRequest('getFileDetails', (uriString: string) => {
      const uri = Uri.parse(uriString)
      const languageId = extname(uriString) === '.py' ? 'python' : 'other'
      try {
        if (isDirectory(uri.fsPath)) {
          return null
        }
        const text = readFileSync(uri.fsPath, 'utf8')
        return {
          languageId,
          text,
          uri: uri.toString(),
          version: 0
        }
      } catch {
        return null
      }
    })

    void this.start()
  }

  start() {
    return this.client.start()
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
