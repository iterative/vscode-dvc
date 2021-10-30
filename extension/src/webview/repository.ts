import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { BaseWebview } from '.'
import { ViewKey } from './constants'
import { WebviewData } from './contract'
import { createWebview } from './factory'
import { InternalCommands } from '../commands/internal'
import { ResourceLocator } from '../resourceLocator'

export abstract class BaseRepository<T extends WebviewData> {
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeIsWebviewFocused: Event<string | undefined>

  protected readonly isWebviewFocusedChanged: EventEmitter<string | undefined> =
    this.dispose.track(new EventEmitter())

  protected readonly dvcRoot: string

  protected readonly internalCommands: InternalCommands
  protected readonly resourceLocator: ResourceLocator

  protected webview?: BaseWebview<T>

  protected readonly deferred = new Deferred()
  protected readonly initialized = this.deferred.promise

  abstract viewKey: ViewKey

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    this.dvcRoot = dvcRoot
    this.internalCommands = internalCommands
    this.resourceLocator = resourceLocator

    this.onDidChangeIsWebviewFocused = this.isWebviewFocusedChanged.event
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
        data: this.getData(),
        dvcRoot: this.dvcRoot
      },
      this.resourceLocator.dvcIcon
    )

    this.setWebview(webview)

    this.isWebviewFocusedChanged.fire(this.dvcRoot)

    return webview
  }

  public setWebview(view: BaseWebview<T>) {
    this.webview = this.dispose.track(view)
    view.isReady().then(() => this.sendData())

    this.dispose.track(
      view.onDidDispose(() => {
        this.resetWebview()
      })
    )
    this.dispose.track(
      view.onDidChangeIsFocused(dvcRoot => {
        this.isWebviewFocusedChanged.fire(dvcRoot)
      })
    )
  }

  protected sendData() {
    if (this.webview) {
      this.webview.show({
        data: this.getData()
      })
    }
  }

  private resetWebview() {
    this.isWebviewFocusedChanged.fire(undefined)
    this.dispose.untrack(this.webview)
    this.webview = undefined
  }

  abstract getData(): T
}
