import { window, ViewColumn, WebviewPanel, Uri, commands } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import * as dvcVscodeWebview from 'dvc-vscode-webview'
import { Deferred } from '@hediet/std/synchronization'
import { autorun } from 'mobx'
import { Config } from './Config'
import {
  ExperimentsRepoJSONOutput,
  MessageFromWebview,
  MessageFromWebviewType,
  MessageToWebview,
  MessageToWebviewType,
  WindowWithWebviewData
} from './webviews/experiments/contract'
import { Logger } from './common/Logger'
import { ResourceLocator } from './ResourceLocator'

export class DvcWebview {
  public static viewKey = 'dvc-view'

  public static async restore(
    webviewPanel: WebviewPanel,
    config: Config
  ): Promise<DvcWebview> {
    const view = new DvcWebview(webviewPanel, config)
    await view.initialized
    return view
  }

  public static async create(
    config: Config,
    resourceLocator: ResourceLocator
  ): Promise<DvcWebview> {
    const webviewPanel = window.createWebviewPanel(
      DvcWebview.viewKey,
      'Experiments',
      ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [Uri.file(dvcVscodeWebview.distPath)]
      }
    )

    webviewPanel.iconPath = resourceLocator.dvcIconPath

    const view = new DvcWebview(webviewPanel, config)
    await view.initialized
    return view
  }

  private readonly _disposer = Disposable.fn()

  private readonly _initialized = new Deferred()

  protected readonly initialized = this._initialized.promise

  public readonly onDidDispose = this.webviewPanel.onDidDispose

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
    switch (message.type) {
      case MessageFromWebviewType.initialized: {
        this._initialized.resolve()
        return
      }
      case MessageFromWebviewType.onClickRunExperiment: {
        commands.executeCommand('dvc.runExperiment')
        return
      }
      default: {
        Logger.error(`Unexpected message: ${message}`)
      }
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

export class DvcWebviewManager {
  private readonly openedWebviews = new Set<DvcWebview>()

  public readonly dispose = Disposable.fn()

  constructor(
    private readonly config: Config,
    private readonly resourceLocator: ResourceLocator
  ) {
    this.dispose.track(
      window.registerWebviewPanelSerializer(DvcWebview.viewKey, {
        deserializeWebviewPanel: async (panel: WebviewPanel) => {
          DvcWebview.restore(panel, this.config).then(view => {
            this.addView(view)
          })
        }
      })
    )

    this.dispose.track({
      dispose: () => {
        for (const panel of this.openedWebviews) {
          panel.dispose()
        }
      }
    })
  }

  public async findOrCreate(): Promise<DvcWebview> {
    const _set = this.openedWebviews.values()
    for (let i = 0; i < this.openedWebviews.size; i += 1) {
      const item = _set.next().value
      if (item.webviewPanel.title === 'Experiments') {
        item.webviewPanel.reveal()
        return item
      }
    }

    const view = await DvcWebview.create(this.config, this.resourceLocator)
    this.addView(view)
    return view
  }

  public refreshAll(tableData: ExperimentsRepoJSONOutput | null): void {
    for (const panel of this.openedWebviews) {
      try {
        panel.showExperiments({ tableData })
      } catch (e) {
        panel.showExperiments({ errors: [e.toString()] })
      }
    }
  }

  private addView(view: DvcWebview) {
    this.openedWebviews.add(view)
    view.onDidDispose(() => {
      this.openedWebviews.delete(view)
    })
  }
}
