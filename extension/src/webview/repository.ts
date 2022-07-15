import { Event, EventEmitter } from 'vscode'
import { BaseWebview } from '.'
import { ViewKey } from './constants'
import { MessageFromWebview, WebviewData } from './contract'
import { createWebview } from './factory'
import { Resource } from '../resourceLocator'
import { DeferredDisposable } from '../class/deferred'

export abstract class BaseRepository<
  T extends WebviewData
> extends DeferredDisposable {
  public readonly onDidChangeIsWebviewFocused: Event<string | undefined>

  protected readonly onDidReceivedWebviewMessage: Event<MessageFromWebview>

  protected readonly isWebviewFocusedChanged: EventEmitter<string | undefined> =
    this.dispose.track(new EventEmitter())

  protected readonly dvcRoot: string

  protected webview?: BaseWebview<T>

  private readonly receivedWebviewMessage = this.dispose.track(
    new EventEmitter<MessageFromWebview>()
  )

  private readonly webviewIcon: Resource

  abstract readonly viewKey: ViewKey

  constructor(dvcRoot: string, webviewIcon: Resource) {
    super()

    this.dvcRoot = dvcRoot
    this.webviewIcon = webviewIcon

    this.onDidChangeIsWebviewFocused = this.isWebviewFocusedChanged.event
    this.onDidReceivedWebviewMessage = this.receivedWebviewMessage.event
  }

  public async showWebview() {
    if (this.webview) {
      return this.webview.reveal()
    }

    const webview = await createWebview(
      this.viewKey,
      this.dvcRoot,
      this.webviewIcon
    )

    this.setWebview(webview)

    this.isWebviewFocusedChanged.fire(this.dvcRoot)

    return webview
  }

  public setWebview(view: BaseWebview<T>) {
    this.webview = this.dispose.track(view)
    view.isReady().then(() => this.sendInitialWebviewData())

    const listener = this.dispose.track(
      view.onDidReceiveMessage(message =>
        this.receivedWebviewMessage.fire(message)
      )
    )

    this.dispose.track(
      view.onDidDispose(() => {
        this.resetWebview()
        this.dispose.untrack(listener)
        listener.dispose()
      })
    )
    this.dispose.track(
      view.onDidChangeIsFocused(dvcRoot => {
        this.isWebviewFocusedChanged.fire(dvcRoot)
      })
    )
  }

  protected getWebview() {
    return this.webview
  }

  private resetWebview() {
    this.isWebviewFocusedChanged.fire(undefined)
    this.dispose.untrack(this.webview)
    this.webview = undefined
  }

  abstract sendInitialWebviewData(): void
}
