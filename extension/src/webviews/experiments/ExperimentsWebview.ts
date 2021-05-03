import { window, ViewColumn, WebviewPanel, Uri } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import * as dvcVscodeWebview from 'dvc-vscode-webview'
import { autorun } from 'mobx'
import { Config } from '../../Config'
import {
  WebviewType as Experiments,
  ExperimentsRepoJSONOutput,
  MessageFromWebview,
  MessageFromWebviewType,
  MessageToWebview,
  MessageToWebviewType,
  WindowWithWebviewData
} from './contract'
import { Logger } from '../../common/Logger'
import { ResourceLocator } from '../../ResourceLocator'

export class ExperimentsWebview {
  public static viewKey = 'dvc-experiments'

  public isActive = () => this.webviewPanel.active

  public isVisible = () => this.webviewPanel.visible

  public static async restore(
    webviewPanel: WebviewPanel,
    config: Config
  ): Promise<ExperimentsWebview> {
    const view = new ExperimentsWebview(webviewPanel, config)
    await view.initialized
    return view
  }

  public static async create(
    config: Config,
    resourceLocator: ResourceLocator
  ): Promise<ExperimentsWebview> {
    const webviewPanel = window.createWebviewPanel(
      ExperimentsWebview.viewKey,
      Experiments,
      ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [Uri.file(dvcVscodeWebview.distPath)]
      }
    )

    webviewPanel.iconPath = resourceLocator.dvcIconPath

    const view = new ExperimentsWebview(webviewPanel, config)
    await view.initialized
    return view
  }

  private readonly _disposer = Disposable.fn()

  private readonly _initialized = new Deferred()

  protected readonly initialized = this._initialized.promise

  public readonly onDidDispose = this.webviewPanel.onDidDispose

  public reveal = () => {
    this.webviewPanel.reveal()
    return this
  }

  private constructor(
    private readonly webviewPanel: WebviewPanel,
    private readonly config: Config
  ) {
    webviewPanel.onDidDispose(() => {
      this._disposer.dispose()
    })
    webviewPanel.webview.onDidReceiveMessage(arg => {
      this.handleMessage(arg as MessageFromWebview)
    })

    webviewPanel.webview.html = this.getHtml()

    this._disposer.track({
      dispose: autorun(async () => {
        // Update theme changes
        const { theme } = config
        await this.initialized // Read all mobx dependencies before await
        this.sendMessage({ type: MessageToWebviewType.setTheme, theme })
      })
    })
  }

  public dispose(): void {
    this.webviewPanel.dispose()
  }

  private getHtml(): string {
    let urls: {
      publicPath: string
      mainJsUrl: string
    }

    if (process.env.USE_DEV_UI === 'true') {
      const baseUrl = 'http://localhost:8080/'
      urls = {
        mainJsUrl: `${baseUrl}main.js`,
        publicPath: baseUrl
      }
    } else {
      urls = {
        mainJsUrl: this.webviewPanel.webview
          .asWebviewUri(Uri.file(dvcVscodeWebview.mainJsFilename))
          .toString(),
        publicPath: this.webviewPanel.webview
          .asWebviewUri(Uri.file(dvcVscodeWebview.distPath))
          .toString()
      }
    }

    const data: WindowWithWebviewData = {
      webviewData: {
        theme: this.config.theme,
        publicPath: urls.publicPath
      }
    }

    // TODO make CSP more strict!
    return `
			  <html>
				  <head>
				  <meta charset="UTF-8">
				  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src ${
            this.webviewPanel.webview.cspSource
          } * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline'; worker-src * data: blob: data: 'unsafe-inline' 'unsafe-eval'; font-src * 'unsafe-inline' 'unsafe-eval' 'self' data: blob:;">
				  <style>
					  html { height: 100%; width: 100%; padding: 0; margin: 0; }
					  body { height: 100%; width: 100%; padding: 0; margin: 0; }
				  </style>
				  </head>
				  <body>
					  <script>
						  Object.assign(window, ${JSON.stringify(data)});
					  </script>
					  <script type="text/javascript" src="${urls.mainJsUrl}"></script>
				  </body>
			  </html>
		  `
  }

  // TODO: Implement Request/Response Semantic!

  private sendMessage(message: MessageToWebview) {
    if (this._initialized.state !== 'resolved') {
      throw new Error(
        'Cannot send message when webview is not initialized yet!'
      )
    }
    this.webviewPanel.webview.postMessage(message)
  }

  private handleMessage(message: MessageFromWebview) {
    if (message.type === MessageFromWebviewType.initialized) {
      this._initialized.resolve()
    } else {
      Logger.error(`Unexpected message: ${message}`)
    }
  }

  public showExperiments(
    payload: {
      tableData?: ExperimentsRepoJSONOutput | null
      errors?: Error[]
    } = {}
  ): void {
    this.sendMessage({
      type: MessageToWebviewType.showExperiments,
      ...payload
    })
  }
}
