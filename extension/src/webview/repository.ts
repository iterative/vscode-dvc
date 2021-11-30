import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { BaseWebview } from '.'
import { ViewKey } from './constants'
import { MessageFromWebview, WebviewData } from './contract'
import { createWebview } from './factory'
import { InternalCommands } from '../commands/internal'
import { Resource } from '../resourceLocator'

export abstract class BaseRepository<T extends WebviewData> {
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeIsWebviewFocused: Event<string | undefined>

  protected readonly onDidReceivedWebviewMessage: Event<MessageFromWebview>

  protected readonly isWebviewFocusedChanged: EventEmitter<string | undefined> =
    this.dispose.track(new EventEmitter())

  protected readonly dvcRoot: string

  protected readonly internalCommands: InternalCommands

  protected webview?: BaseWebview<T>

  protected readonly deferred = new Deferred()
  protected readonly initialized = this.deferred.promise

  private readonly receivedWebviewMessage = this.dispose.track(
    new EventEmitter<MessageFromWebview>()
  )

  private readonly webviewIcon: Resource

  abstract viewKey: ViewKey

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    webviewIcon: Resource
  ) {
    this.dvcRoot = dvcRoot
    this.internalCommands = internalCommands
    this.webviewIcon = webviewIcon

    this.onDidChangeIsWebviewFocused = this.isWebviewFocusedChanged.event
    this.onDidReceivedWebviewMessage = this.receivedWebviewMessage.event
  }

  public isReady() {
    return this.initialized
  }

  public async showWebview() {
    if (this.webview) {
      return this.webview.reveal()
    }

    const webview = await createWebview(
      this.viewKey,
      this.internalCommands,
      {
        data: this.getWebviewData(),
        dvcRoot: this.dvcRoot
      },
      this.webviewIcon
    )

    this.setWebview(webview)

    this.isWebviewFocusedChanged.fire(this.dvcRoot)

    return webview
  }

  public setWebview(view: BaseWebview<T>) {
    this.webview = this.dispose.track(view)
    view.isReady().then(() => this.sendWebviewData())

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

  protected sendWebviewData() {
    this.webview?.show(this.getWebviewData())
  }

  private resetWebview() {
    this.isWebviewFocusedChanged.fire(undefined)
    this.dispose.untrack(this.webview)
    this.webview = undefined
  }

  abstract getWebviewData(): T
}
