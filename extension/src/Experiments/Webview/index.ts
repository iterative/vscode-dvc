import {
  Event,
  EventEmitter,
  window,
  ViewColumn,
  WebviewPanel,
  Uri
} from 'vscode'
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
import { setContextValue } from '../../vscode/context'

export class ExperimentsWebview {
  public static viewKey = 'dvc-experiments'

  private readonly disposer = Disposable.fn()

  private readonly deferred = new Deferred()
  protected readonly initialized = this.deferred.promise

  public isReady() {
    return this.initialized
  }

  public isActive = () => this.webviewPanel.active

  public isVisible = () => this.webviewPanel.visible

  private dvcRoot: string
  private readonly isFocusedChanged: EventEmitter<
    string | undefined
  > = this.disposer.track(new EventEmitter())

  public readonly onDidChangeIsFocused: Event<string | undefined> = this
    .isFocusedChanged.event

  private readonly webviewPanel: WebviewPanel
  private readonly config: Config

  public readonly onDidDispose: Event<void>

  public static restore(
    webviewPanel: WebviewPanel,
    config: Config,
    state: {
      dvcRoot: string
      experiments?: ExperimentsRepoJSONOutput
    }
  ): Promise<ExperimentsWebview> {
    return new Promise((resolve, reject) => {
      try {
        resolve(new ExperimentsWebview(webviewPanel, config, state))
      } catch (e) {
        reject(e)
      }
    })
  }

  public static async create(
    config: Config,
    state: {
      dvcRoot: string
      experiments?: ExperimentsRepoJSONOutput
    },
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

    const view = new ExperimentsWebview(webviewPanel, config, state)
    await view.isReady()
    return view
  }

  public reveal = () => {
    this.webviewPanel.reveal()
    return this
  }

  private notifyActiveStatus(webviewPanel: WebviewPanel) {
    ExperimentsWebview.setPanelActiveContext(webviewPanel.active)

    const active = webviewPanel.active ? this.dvcRoot : undefined
    this.isFocusedChanged.fire(active)
  }

  private constructor(
    webviewPanel: WebviewPanel,
    config: Config,
    state: {
      dvcRoot: string
      experiments?: ExperimentsRepoJSONOutput
    }
  ) {
    this.webviewPanel = webviewPanel
    this.onDidDispose = this.webviewPanel.onDidDispose

    this.config = config
    this.dvcRoot = state.dvcRoot

    webviewPanel.onDidDispose(() => {
      ExperimentsWebview.setPanelActiveContext(false)
      this.disposer.dispose()
    })
    webviewPanel.webview.onDidReceiveMessage(arg => {
      this.handleMessage(arg as MessageFromWebview)
    })

    webviewPanel.webview.html = this.getHtml()

    this.disposer.track(
      webviewPanel.onDidChangeViewState(({ webviewPanel }) => {
        this.notifyActiveStatus(webviewPanel)
      })
    )

    this.notifyActiveStatus(webviewPanel)

    this.disposer.track({
      dispose: autorun(async () => {
        await this.isReady() // Read all mobx dependencies before await
        this.sendMessage({
          type: MessageToWebviewType.setTheme,
          theme: config.getTheme()
        })
        this.sendMessage({
          type: MessageToWebviewType.setDvcRoot,
          dvcRoot: this.dvcRoot
        })
        const experiments = state.experiments
        if (experiments) {
          this.sendMessage({
            type: MessageToWebviewType.showExperiments,
            tableData: experiments
          })
        }
      })
    })
  }

  private static setPanelActiveContext(state: boolean) {
    setContextValue('dvc.experiments.webviewActive', state)
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
        theme: this.config.getTheme(),
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
    if (this.deferred.state !== 'resolved') {
      throw new Error(
        'Cannot send message when webview is not initialized yet!'
      )
    }
    return this.webviewPanel.webview.postMessage(message)
  }

  private handleMessage(message: MessageFromWebview) {
    if (message.type === MessageFromWebviewType.initialized) {
      this.deferred.resolve()
    } else {
      Logger.error(`Unexpected message: ${message}`)
    }
  }

  public showExperiments(
    payload: {
      tableData?: ExperimentsRepoJSONOutput | null
      errors?: Error[]
    } = {}
  ): Thenable<boolean> {
    return this.sendMessage({
      type: MessageToWebviewType.showExperiments,
      ...payload
    })
  }
}
