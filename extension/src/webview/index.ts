import { Event, EventEmitter, WebviewPanel, Uri } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { autorun } from 'mobx'
import {
  MessageFromWebview,
  MessageFromWebviewType,
  MessageToWebview,
  MessageToWebviewType,
  WebviewColorTheme,
  WebviewData,
  WebviewState,
  WindowWithWebviewData
} from './contract'
import { EventNames } from './constants'
import { setContextValue } from '../vscode/context'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { sendTelemetryEvent } from '../telemetry'

export class BaseWebview<T extends WebviewData> {
  public readonly onDidDispose: Event<void>

  public readonly onDidChangeIsFocused: Event<string | undefined>
  public readonly onDidReceiveMessage: Event<MessageFromWebview>

  protected readonly initialized: Promise<void>
  protected readonly disposer = Disposable.fn()
  private readonly deferred = new Deferred()

  private dvcRoot: string

  private readonly isFocusedChanged: EventEmitter<string | undefined> =
    this.disposer.track(new EventEmitter())

  private readonly webviewPanel: WebviewPanel
  private readonly internalCommands: InternalCommands
  private readonly contextKey: string

  private readonly messageReceived = this.disposer.track(
    new EventEmitter<MessageFromWebview>()
  )

  constructor(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: WebviewState<T>,
    contextKey: string,
    eventsNames: EventNames,
    scripts: readonly string[]
  ) {
    this.webviewPanel = webviewPanel
    this.onDidDispose = this.webviewPanel.onDidDispose
    this.contextKey = contextKey

    this.initialized = this.deferred.promise

    this.onDidChangeIsFocused = this.isFocusedChanged.event

    this.onDidReceiveMessage = this.messageReceived.event

    this.internalCommands = internalCommands
    this.dvcRoot = state.dvcRoot

    webviewPanel.onDidDispose(() => {
      this.setPanelActiveContext(false)
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
          type: MessageToWebviewType.SET_THEME
        })
        this.sendMessage({
          dvcRoot: this.dvcRoot,
          type: MessageToWebviewType.SET_DVC_ROOT
        })

        const data = state.data
        if (data) {
          this.sendMessage({
            data,
            type: MessageToWebviewType.SET_DATA
          })
        }
      })
    })

    this.setupTelemetryEvents(webviewPanel, eventsNames)
  }

  public dispose(): void {
    this.webviewPanel.dispose()
  }

  public isReady() {
    return this.initialized
  }

  public isActive() {
    return this.webviewPanel.active
  }

  public isVisible() {
    return this.webviewPanel.visible
  }

  public async show(data: T): Promise<boolean> {
    await this.isReady()
    return this.sendMessage({
      data,
      type: MessageToWebviewType.SET_DATA
    })
  }

  public reveal() {
    this.webviewPanel.reveal()
    return this
  }

  protected sendMessage(message: MessageToWebview<T>) {
    if (this.deferred.state !== 'resolved') {
      throw new Error(
        'Cannot send message when webview is not initialized yet!'
      )
    }
    return this.webviewPanel.webview.postMessage(message)
  }

  private notifyActiveStatus(webviewPanel: WebviewPanel) {
    this.setPanelActiveContext(webviewPanel.active)

    const active = webviewPanel.active ? this.dvcRoot : undefined
    this.isFocusedChanged.fire(active)
  }

  private async getHtml(scripts: readonly string[]): Promise<string> {
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
          } * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src https: ${
      this.webviewPanel.webview.cspSource
    }; frame-src *; style-src * 'unsafe-inline'; worker-src * data: blob: data: 'unsafe-inline' 'unsafe-eval'; font-src * 'unsafe-inline' 'unsafe-eval' 'self' data: blob:;">
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

  private handleMessage(message: MessageFromWebview) {
    if (message.type === MessageFromWebviewType.INITIALIZED) {
      return this.deferred.resolve()
    }
    this.messageReceived.fire(message)
  }

  private setPanelActiveContext(state: boolean) {
    setContextValue(this.contextKey, state)
  }

  private setupTelemetryEvents(
    webviewPanel: WebviewPanel,
    eventNames: EventNames
  ) {
    sendTelemetryEvent(eventNames.createdEvent, undefined, undefined)

    this.onDidDispose(() => {
      sendTelemetryEvent(eventNames.closedEvent, undefined, undefined)
    })

    this.onDidChangeIsFocused(() => {
      sendTelemetryEvent(
        eventNames.focusChangedEvent,
        {
          active: webviewPanel.active,
          viewColumn: webviewPanel.viewColumn,
          visible: webviewPanel.visible
        },
        undefined
      )
    })
  }
}
