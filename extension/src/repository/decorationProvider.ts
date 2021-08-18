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

export type DecorationState = Record<Status, Set<string>>

export interface DecorationModel {
  getState: () => DecorationState
}

enum Status {
  ADDED = 'added',
  DELETED = 'deleted',
  MODIFIED = 'modified',
  NOT_IN_CACHE = 'notInCache',
  RENAMED = 'renamed',
  STAGE_MODIFIED = 'stageModified',
  TRACKED = 'tracked'
}

export class DecorationProvider implements FileDecorationProvider {
  private static DecorationAdded: FileDecoration = {
    badge: 'A',
    color: new ThemeColor('gitDecoration.addedResourceForeground'),
    tooltip: 'DVC added'
  }

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

  private static DecorationNotInCache: FileDecoration = {
    badge: 'NC',
    color: new ThemeColor('gitDecoration.renamedResourceForeground'),
    tooltip: 'DVC not in cache'
  }

  private static DecorationRenamed: FileDecoration = {
    badge: 'R',
    color: new ThemeColor('gitDecoration.renamedResourceForeground'),
    tooltip: 'DVC renamed'
  }

  private static DecorationStageModified: FileDecoration = {
    badge: 'M',
    color: new ThemeColor('gitDecoration.stageModifiedResourceForeground'),
    tooltip: 'DVC staged modified'
  }

  private static DecorationTracked: FileDecoration = {
    tooltip: 'DVC tracked'
  }

  @observable
  private state: DecorationState

  public readonly dispose = Disposable.fn()

  public readonly onDidChangeFileDecorations: Event<Uri[]>
  private readonly decorationsChanged: EventEmitter<Uri[]>

  private readonly decorationMapping: Partial<Record<Status, FileDecoration>> =
    {
      added: DecorationProvider.DecorationAdded,
      deleted: DecorationProvider.DecorationDeleted,
      modified: DecorationProvider.DecorationModified,
      notInCache: DecorationProvider.DecorationNotInCache,
      renamed: DecorationProvider.DecorationRenamed,
      stageModified: DecorationProvider.DecorationStageModified
    }

  constructor(decorationsChanged?: EventEmitter<Uri[]>) {
    makeObservable(this)

    this.state = {} as DecorationState

    this.decorationsChanged = this.dispose.track(
      decorationsChanged || new EventEmitter()
    )
    this.onDidChangeFileDecorations = this.decorationsChanged.event

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  public provideFileDecoration(uri: Uri): FileDecoration | undefined {
    const decoration = Object.keys(this.decorationMapping).find(status => {
      if (this.state[status as Status]?.has(uri.fsPath)) {
        return status
      }
    }) as Status

    if (decoration) {
      return this.decorationMapping[decoration]
    }
    if (this.state.tracked?.has(uri.fsPath)) {
      return DecorationProvider.DecorationTracked
    }
  }

  public setState = (state: DecorationState) => {
    const urisToUpdate = this.getUnion(this.state, state)
    this.state = state
    this.decorationsChanged.fire(urisToUpdate)
  }

  private getUnion(existingState: DecorationState, newState: DecorationState) {
    return [
      ...new Set([
        ...(existingState.tracked || []),
        ...(newState.tracked || [])
      ])
    ].map(path => Uri.file(path))
  }
}
