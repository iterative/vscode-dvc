import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node'
import { documentSelector, serverModule } from 'dvc-vscode-lsp'
import { ConfigurationChangeEvent, workspace } from 'vscode'
import { Disposable } from '../class/dispose'
import { ConfigKey, getConfigValue } from '../vscode/config'

export class LanguageClientWrapper extends Disposable {
  private client: LanguageClient

  constructor() {
    super()

    const clientOptions: LanguageClientOptions = {
      documentSelector
    }

    this.client = this.dispose.track(
      new LanguageClient(
        'dvc-vscode-lsp',
        'DVC Language Server',
        this.getServerOptions(),
        clientOptions
      )
    )

    this.start()
  }

  async start() {
    if (!this.languageServerDisabled()) {
      // This will also start the server process
      await this.client.start()

      workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
        if (
          event.affectsConfiguration(ConfigKey.DISABLE_LANGUAGE_SERVER) &&
          this.isRunning() &&
          this.languageServerDisabled()
        ) {
          this.stop()
        }
      })
    }

    return this
  }

  stop() {
    this.client.stop()
  }

  private isRunning() {
    return this.client.isRunning()
  }

  private languageServerDisabled() {
    return getConfigValue<boolean>(ConfigKey.DISABLE_LANGUAGE_SERVER)
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
