import { Disposable } from '@hediet/std/disposable'
import { makeObservable, observable } from 'mobx'
import {
  window,
  Event,
  EventEmitter,
  FileDecorationProvider,
  FileDecoration,
  Uri
} from 'vscode'

export type DecorationState = {
  [key in Status]: Set<string>
}

enum Status {
  DELETED = 'deleted',
  MODIFIED = 'modified',
  NEW = 'new',
  NOT_IN_CACHE = 'notInCache',
  TRACKED = 'tracked'
}

export class DecorationProvider implements FileDecorationProvider {
  private static DecorationTracked: FileDecoration = {
    tooltip: 'DVC tracked'
  }

  public readonly dispose = Disposable.fn()

  @observable
  private state: DecorationState

  readonly onDidChangeFileDecorations: Event<Uri[]>
  private readonly onDidChangeDecorations: EventEmitter<Uri[]>

  public setState = (state: DecorationState) => {
    this.state = state
    this.onDidChangeDecorations.fire(
      Object.values(this.state)
        .reduce((toDecorate: string[], paths: Set<string>): string[] => {
          return [...toDecorate, ...paths]
        }, [])
        .map(value => Uri.file(value))
    )
  }

  constructor() {
    makeObservable(this)

    this.onDidChangeDecorations = new EventEmitter<Uri[]>()
    this.onDidChangeFileDecorations = this.onDidChangeDecorations.event

    this.state = {} as DecorationState

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  async provideFileDecoration(uri: Uri): Promise<FileDecoration | undefined> {
    if (this.state?.deleted?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
    if (this.state?.modified?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
    if (this.state?.new?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
    if (this.state?.notInCache?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
    if (this.state?.tracked?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
  }
}
