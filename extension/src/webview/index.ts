import { Event, EventEmitter, WebviewPanel, Uri } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { autorun } from 'mobx'
import { WebviewState } from './factory'
import {
  MessageFromWebview,
  MessageFromWebviewType,
  MessageToWebview,
  MessageToWebviewType,
  WindowWithWebviewData,
  WebviewColorTheme
} from '../experiments/webview/contract'
import { Logger } from '../common/logger'
import { setContextValue } from '../vscode/context'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { sendTelemetryEvent } from '../telemetry'
import { IEventNamePropertyMapping } from '../telemetry/constants'
import { messenger, MessengerEvents } from '../util/messaging'

type EventName = keyof IEventNamePropertyMapping
type EventNames = {
  createdEvent: EventName
  closedEvent: EventName
  focusChangedEvent: EventName
}

export class BaseWebview {
  public readonly onDidDispose: Event<void>

  public readonly onDidChangeIsFocused: Event<string | undefined>

  protected readonly initialized: Promise<void>
  protected readonly disposer = Disposable.fn()
  private readonly deferred = new Deferred()

  private dvcRoot: string

  private readonly isFocusedChanged: EventEmitter<string | undefined> =
    this.disposer.track(new EventEmitter())

  private readonly webviewPanel: WebviewPanel
  private readonly internalCommands: InternalCommands
  private readonly contextKey: string

  protected constructor(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: WebviewState,
    eventsNames: EventNames,
    contextKey: string,
    scripts: string[] = []
  ) {
    this.webviewPanel = webviewPanel
    this.onDidDispose = this.webviewPanel.onDidDispose
    this.contextKey = contextKey

    this.initialized = this.deferred.promise

    this.onDidChangeIsFocused = this.isFocusedChanged.event

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
          type: MessageToWebviewType.setTheme
        })
        this.sendMessage({
          dvcRoot: this.dvcRoot,
          type: MessageToWebviewType.setDvcRoot
        })
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

  public reveal = () => {
    this.webviewPanel.reveal()
    return this
  }

  protected sendMessage(message: MessageToWebview) {
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
