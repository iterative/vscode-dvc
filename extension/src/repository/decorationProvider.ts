import {
  window,
  Event,
  EventEmitter,
  FileDecorationProvider,
  FileDecoration,
  Uri,
  ThemeColor
} from 'vscode'
import { Disposable } from '../class/dispose'
import { flattenUnique } from '../util/array'

export type DecorationState = Record<DecorationStatus, Set<string>>

export interface DecorationModel {
  getDecorationState: () => DecorationState
}

enum DecorationStatus {
  COMMITTED_ADDED = 'committedAdded',
  COMMITTED_DELETED = 'committedDeleted',
  COMMITTED_MODIFIED = 'committedModified',
  COMMITTED_RENAMED = 'committedRenamed',
  NOT_IN_CACHE = 'notInCache',
  UNCOMMITTED_ADDED = 'uncommittedAdded',
  UNCOMMITTED_DELETED = 'uncommittedDeleted',
  UNCOMMITTED_MODIFIED = 'uncommittedModified',
  UNCOMMITTED_RENAMED = 'uncommittedRenamed',
  TRACKED = 'tracked'
}

export class DecorationProvider
  extends Disposable
  implements FileDecorationProvider
{
  private static DecorationCommittedAdded: FileDecoration = {
    badge: 'A',
    color: new ThemeColor('gitDecoration.addedResourceForeground'),
    tooltip: 'DVC Committed Added'
  }

  private static DecorationCommittedDeleted: FileDecoration = {
    badge: 'D',
    color: new ThemeColor('gitDecoration.stageDeletedResourceForeground'),
    tooltip: 'DVC Committed Deleted'
  }

  private static DecorationCommittedModified: FileDecoration = {
    badge: 'M',
    color: new ThemeColor('gitDecoration.stageModifiedResourceForeground'),
    tooltip: 'DVC Committed Modified'
  }

  private static DecorationCommittedRenamed: FileDecoration = {
    badge: 'R',
    color: new ThemeColor('gitDecoration.renamedResourceForeground'),
    tooltip: 'DVC Committed Renamed'
  }

  private static DecorationNotInCache: FileDecoration = {
    badge: 'NC',
    color: new ThemeColor('gitDecoration.ignoredResourceForeground'),
    tooltip: 'DVC Not In Cache'
  }

  private static DecorationUncommittedAdded: FileDecoration = {
    badge: 'A',
    color: new ThemeColor('gitDecoration.untrackedResourceForeground'),
    tooltip: 'DVC Uncommitted Added'
  }

  private static DecorationUncommittedDeleted: FileDecoration = {
    badge: 'D',
    color: new ThemeColor('gitDecoration.deletedResourceForeground'),
    tooltip: 'DVC Uncommitted Deleted'
  }

  private static DecorationUncommittedModified: FileDecoration = {
    badge: 'M',
    color: new ThemeColor('gitDecoration.modifiedResourceForeground'),
    tooltip: 'DVC Uncommitted Modified'
  }

  private static DecorationUncommittedRenamed: FileDecoration = {
    badge: 'R',
    color: new ThemeColor('gitDecoration.renamedResourceForeground'),
    tooltip: 'DVC Uncommitted Renamed'
  }

  private static DecorationTracked: FileDecoration = {
    tooltip: 'DVC Tracked'
  }

  public readonly onDidChangeFileDecorations: Event<Uri[]>
  private readonly decorationsChanged: EventEmitter<Uri[]>

  private state: DecorationState

  private readonly decorationMapping: Partial<
    Record<DecorationStatus, FileDecoration>
  > = {
    committedAdded: DecorationProvider.DecorationCommittedAdded,
    committedDeleted: DecorationProvider.DecorationCommittedDeleted,
    committedModified: DecorationProvider.DecorationCommittedModified,
    committedRenamed: DecorationProvider.DecorationCommittedRenamed,
    notInCache: DecorationProvider.DecorationNotInCache,
    uncommittedAdded: DecorationProvider.DecorationUncommittedAdded,
    uncommittedDeleted: DecorationProvider.DecorationUncommittedDeleted,
    uncommittedModified: DecorationProvider.DecorationUncommittedModified,
    uncommittedRenamed: DecorationProvider.DecorationUncommittedRenamed
  }

  constructor(decorationsChanged?: EventEmitter<Uri[]>) {
    super()

    this.state = {} as DecorationState

    this.decorationsChanged = this.dispose.track(
      decorationsChanged || new EventEmitter()
    )
    this.onDidChangeFileDecorations = this.decorationsChanged.event

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  public provideFileDecoration(uri: Uri): FileDecoration | undefined {
    const path = uri.fsPath

    const decoration = Object.keys(this.decorationMapping).find(status => {
      if (this.state[status as DecorationStatus]?.has(path)) {
        return status
      }
    }) as DecorationStatus

    if (decoration) {
      return this.decorationMapping[decoration]
    }
    if (this.state.tracked?.has(path)) {
      return DecorationProvider.DecorationTracked
    }
  }

  public setState(state: DecorationState) {
    const urisToUpdate = this.getUnion(this.state, state)
    this.state = state
    this.decorationsChanged.fire(urisToUpdate)
  }

  private getUnion(existingState: DecorationState, newState: DecorationState) {
    return flattenUnique([
      ...Object.values(existingState).map(status => [...(status || [])]),
      ...Object.values(newState).map(status => [...(status || [])])
    ]).map(path => Uri.file(path))
  }
}
