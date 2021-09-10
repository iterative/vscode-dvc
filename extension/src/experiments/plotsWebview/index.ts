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
import {
  MessageFromWebview,
  MessageFromWebviewType,
  MessageToWebview,
  MessageToWebviewType,
  WindowWithWebviewData,
  ExperimentsWebviewState,
  WebviewColorTheme,
  TableData
} from './contract'
import { Logger } from '../../common/logger'
import { ResourceLocator } from '../../resourceLocator'
import { setContextValue } from '../../vscode/context'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { sendTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'

export class PlotsWebview {
  public static viewKey = 'dvc-experiments-plots'

  public readonly onDidDispose: Event<void>

  public readonly onDidChangeIsFocused: Event<string | undefined>

  protected readonly initialized: Promise<void>

  private readonly disposer = Disposable.fn()

  private readonly deferred = new Deferred()

  private dvcRoot: string

  private readonly isFocusedChanged: EventEmitter<string | undefined> =
    this.disposer.track(new EventEmitter())

  private readonly webviewPanel: WebviewPanel
  private readonly internalCommands: InternalCommands

  private constructor(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState
  ) {
    this.webviewPanel = webviewPanel
    this.onDidDispose = this.webviewPanel.onDidDispose

    this.initialized = this.deferred.promise

    this.onDidChangeIsFocused = this.isFocusedChanged.event

    this.internalCommands = internalCommands
    this.dvcRoot = state.dvcRoot

    webviewPanel.onDidDispose(() => {
      PlotsWebview.setPanelActiveContext(false)
      sendTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_TABLE_CLOSED,
        undefined,
        undefined
      )
      this.disposer.dispose()
    })

    webviewPanel.webview.onDidReceiveMessage(arg => {
      this.handleMessage(arg as MessageFromWebview)
    })

    this.getHtml().then(html => (webviewPanel.webview.html = html))

    this.disposer.track(
      webviewPanel.onDidChangeViewState(({ webviewPanel }) => {
        this.notifyActiveStatus(webviewPanel)
      })
    )

    this.notifyActiveStatus(webviewPanel)

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_CREATED,
      undefined,
      undefined
    )

    this.disposer.track({
      dispose: autorun(async () => {
        await this.isReady() // Read all mobx dependencies before await
        const theme =
          await this.internalCommands.executeCommand<WebviewColorTheme>(
            AvailableCommands.GET_THEME
          )
        this.sendMessage({
          theme,
          type: MessageToWebviewType.setTheme
        })
        this.sendMessage({
          dvcRoot: this.dvcRoot,
          type: MessageToWebviewType.setDvcRoot
        })
        const tableData = state.tableData
        if (tableData) {
          this.sendMessage({
            tableData: tableData,
            type: MessageToWebviewType.showExperiments
          })
        }
      })
    })
  }

  public static restore(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState
  ): Promise<PlotsWebview> {
    return new Promise((resolve, reject) => {
      try {
        resolve(new PlotsWebview(webviewPanel, internalCommands, state))
      } catch (e) {
        reject(e)
      }
    })
  }

  public static async create(
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState,
    resourceLocator: ResourceLocator
  ): Promise<PlotsWebview> {
    const webviewPanel = window.createWebviewPanel(
      PlotsWebview.viewKey,
      'Plots',
      ViewColumn.Active,
      {
        enableScripts: true,
        localResourceRoots: [Uri.file(dvcVscodeWebview.distPath)],
        retainContextWhenHidden: true
      }
    )

    webviewPanel.iconPath = resourceLocator.dvcIcon

    const view = new PlotsWebview(webviewPanel, internalCommands, state)
    await view.isReady()
    return view
  }

  private static setPanelActiveContext(state: boolean) {
    setContextValue('dvc.experiments.webviewActive', state)
  }

  public dispose(): void {
    this.webviewPanel.dispose()
  }

  public isReady() {
    return this.initialized
  }

  public isActive = () => this.webviewPanel.active

  public isVisible = () => this.webviewPanel.visible

  public reveal = () => {
    this.webviewPanel.reveal()
    return this
  }

  public async showExperiments(payload: {
    tableData: TableData
    errors?: Error[]
  }): Promise<boolean> {
    await this.isReady()
    return this.sendMessage({
      type: MessageToWebviewType.showExperiments,
      ...payload
    })
  }

  private notifyActiveStatus(webviewPanel: WebviewPanel) {
    PlotsWebview.setPanelActiveContext(webviewPanel.active)

    const active = webviewPanel.active ? this.dvcRoot : undefined
    this.isFocusedChanged.fire(active)

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_CHANGED,
      {
        active: webviewPanel.active,
        viewColumn: webviewPanel.viewColumn,
        visible: webviewPanel.visible
      },
      undefined
    )
  }

  private async getHtml(): Promise<string> {
    let urls: {
      publicPath: string
      plotsJsUrl: string
      reactJsUrl: string
    }

    if (process.env.USE_DEV_UI === 'true') {
      const baseUrl = 'http://localhost:8080/'
      urls = {
        plotsJsUrl: `${baseUrl}plots.js`,
        publicPath: baseUrl,
        reactJsUrl: `${baseUrl}react.js`
      }
    } else {
      urls = {
        plotsJsUrl: this.webviewPanel.webview
          .asWebviewUri(Uri.file(dvcVscodeWebview.plotsJsFilename))
          .toString(),
        publicPath: this.webviewPanel.webview
          .asWebviewUri(Uri.file(dvcVscodeWebview.distPath))
          .toString(),
        reactJsUrl: this.webviewPanel.webview
          .asWebviewUri(Uri.file(dvcVscodeWebview.reactJsFilename))
          .toString()
      }
    }

    const theme = await this.internalCommands.executeCommand<WebviewColorTheme>(
      AvailableCommands.GET_THEME
    )
    const data: WindowWithWebviewData = {
      webviewData: {
        publicPath: urls.publicPath,
        theme
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
					  <script type="text/javascript" src="${urls.reactJsUrl}"></script>
					  <script type="text/javascript" src="${urls.plotsJsUrl}"></script>
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
}
