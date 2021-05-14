import { Disposable } from '@hediet/std/disposable'
import { makeObservable, observable } from 'mobx'
import {
  window,
  Event,
  EventEmitter,
  FileDecorationProvider,
  FileDecoration,
  Uri,
  ThemeColor
} from 'vscode'
import { isStringInEnum } from '../util'

export type DecorationState = Record<Status, Set<string>>

enum Status {
  DELETED = 'deleted',
  MODIFIED = 'modified',
  NEW = 'new',
  NOT_IN_CACHE = 'notInCache',
  TRACKED = 'tracked'
}

export class DecorationProvider implements FileDecorationProvider {
  private static DecorationDeleted: FileDecoration = {
    badge: 'D',
    color: new ThemeColor('gitDecoration.deletedResourceForeground'),
    tooltip: 'DVC deleted'
  }

  private static DecorationModified: FileDecoration = {
    badge: 'M',
    color: new ThemeColor('gitDecoration.modifiedResourceForeground'),
    tooltip: 'DVC modified'
  }

  private static DecorationNew: FileDecoration = {
    badge: 'A',
    color: new ThemeColor('gitDecoration.addedResourceForeground'),
    tooltip: 'DVC added'
  }

  private static DecorationNotInCache: FileDecoration = {
    badge: 'NC',
    color: new ThemeColor('gitDecoration.renamedResourceForeground'),
    tooltip: 'DVC not in cache'
  }

  private static DecorationTracked: FileDecoration = {
    tooltip: 'DVC tracked'
  }

  public readonly dispose = Disposable.fn()

  @observable
  private state: DecorationState

  private readonly decorationsChanged: EventEmitter<Uri[]> = new EventEmitter<
    Uri[]
  >()

  public readonly onDidChangeFileDecorations: Event<Uri[]> = this
    .decorationsChanged.event

  private isValidStatus(status: string): boolean {
    return isStringInEnum(status, Status)
  }

  private getUrisFromSet(paths: Set<string>): Uri[] {
    return [...paths].map(path => Uri.file(path))
  }

  private getUrisFromState() {
    const reduceState = (
      toDecorate: Uri[],
      entry: [string, Set<string>]
    ): Uri[] => {
      const [status, paths] = entry as [Status, Set<string>]
      if (!this.isValidStatus(status)) {
        return toDecorate
      }
      return [...toDecorate, ...this.getUrisFromSet(paths)]
    }

    return Object.entries(this.state).reduce(reduceState, [])
  }

  public setState = (state: DecorationState) => {
    this.state = state
    this.decorationsChanged.fire(this.getUrisFromState())
  }

  constructor() {
    makeObservable(this)

    this.state = {} as DecorationState

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  public provideFileDecoration(uri: Uri): FileDecoration | undefined {
    if (this.state.deleted?.has(uri.fsPath)) {
      return DecorationProvider.DecorationDeleted
    }
    if (this.state.new?.has(uri.fsPath)) {
      return DecorationProvider.DecorationNew
    }
    if (this.state.notInCache?.has(uri.fsPath)) {
      return DecorationProvider.DecorationNotInCache
    }
    if (this.state.modified?.has(uri.fsPath)) {
      return DecorationProvider.DecorationModified
    }
    if (this.state.tracked?.has(uri.fsPath)) {
      return DecorationProvider.DecorationTracked
    }
  }
}
