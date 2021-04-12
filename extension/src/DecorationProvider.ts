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
import { isStringInEnum } from './util'

export type DecorationState = Record<Status, Set<string>>

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

  private isValidStatus(status: string): boolean {
    return isStringInEnum(status, Status)
  }

  public setState = (state: DecorationState) => {
    this.state = state
    this.onDidChangeDecorations.fire(
      Object.entries(this.state)
        .reduce(
          (toDecorate: string[], entry: [string, Set<string>]): string[] => {
            const [status, paths] = entry as [Status, Set<string>]
            if (!this.isValidStatus(status)) {
              return toDecorate
            }
            return [...toDecorate, ...paths]
          },
          []
        )
        .map(path => Uri.file(path))
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
    if (this.state.deleted?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
    if (this.state.modified?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
    if (this.state.new?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
    if (this.state.notInCache?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
    if (this.state.tracked?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
  }
}
