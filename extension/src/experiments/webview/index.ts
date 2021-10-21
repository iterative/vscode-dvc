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
import { distPath } from 'dvc-vscode-webview'
import { autorun } from 'mobx'
import {
  WebviewType as Experiments,
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
import { messenger, MessengerEvents } from '../../util/messaging'

export class ExperimentsWebview {
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

  protected constructor(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState,
    scripts: string[] = []
  ) {
    this.webviewPanel = webviewPanel
    this.onDidDispose = this.webviewPanel.onDidDispose

    this.initialized = this.deferred.promise

    this.onDidChangeIsFocused = this.isFocusedChanged.event

    this.internalCommands = internalCommands
    this.dvcRoot = state.dvcRoot

    webviewPanel.onDidDispose(() => {
      ExperimentsWebview.setPanelActiveContext(false)
      this.disposer.dispose()
    })

    webviewPanel.webview.onDidReceiveMessage(arg => {
      this.handleMessage(arg as MessageFromWebview)
    })

    this.getHtml(scripts).then(html => (webviewPanel.webview.html = html))

    this.disposer.track(
      webviewPanel.onDidChangeViewState(({ webviewPanel }) => {
        this.notifyActiveStatus(webviewPanel)
      })
    )

    this.notifyActiveStatus(webviewPanel)

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

  protected static restore(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState,
    scripts: string[]
  ): Promise<ExperimentsWebview> {
    return new Promise((resolve, reject) => {
      try {
        resolve(
          new ExperimentsWebview(webviewPanel, internalCommands, state, scripts)
        )
      } catch (e: unknown) {
        reject(e)
      }
    })
  }

  protected static async create(
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState,
    resourceLocator: ResourceLocator,
    viewKey: string,
    scripts: string[]
  ): Promise<ExperimentsWebview> {
    const webviewPanel = window.createWebviewPanel(
      viewKey,
      Experiments,
      ViewColumn.Active,
      {
        enableScripts: true,
        localResourceRoots: [Uri.file(distPath)],
        retainContextWhenHidden: true
      }
    )

    webviewPanel.iconPath = resourceLocator.dvcIcon

    const view = new ExperimentsWebview(
      webviewPanel,
      internalCommands,
      state,
      scripts
    )
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
    ExperimentsWebview.setPanelActiveContext(webviewPanel.active)

    const active = webviewPanel.active ? this.dvcRoot : undefined
    this.isFocusedChanged.fire(active)
  }

  private async getHtml(scripts: string[]): Promise<string> {
    const webviewScriptTags = scripts
      .map(
        script =>
          `<script type="text/javascript" src="${this.webviewPanel.webview
            .asWebviewUri(Uri.file(script))
            .toString()}"></script>`
      )
      .join('')

    const theme = await this.internalCommands.executeCommand<WebviewColorTheme>(
      AvailableCommands.GET_THEME
    )
    const data: WindowWithWebviewData = {
      webviewData: {
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
					  ${webviewScriptTags}
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
    switch (message.type) {
      case MessageFromWebviewType.initialized:
        this.deferred.resolve()
        break
      case MessageFromWebviewType.columnReordered:
        messenger.emit(MessengerEvents.columnReordered, message.payload)
        break
      default:
        Logger.error(`Unexpected message: ${message}`)
    }
  }
}
