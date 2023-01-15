import {
  window,
  Event,
  EventEmitter,
  FileDecorationProvider,
  FileDecoration,
  Uri,
  ThemeColor
} from 'vscode'
import { BaseDataStatus } from '../constants'
import { Disposable } from '../../class/dispose'
import { flattenUnique } from '../../util/array'

export const DecorationDataStatus = Object.assign({}, BaseDataStatus, {
  TRACKED: 'tracked'
} as const)

type ScmDecorationStatus =
  (typeof DecorationDataStatus)[keyof typeof DecorationDataStatus]

export type ScmDecorationState = Record<ScmDecorationStatus, Set<string>>

const IGNORED_DECORATION = 'gitDecoration.ignoredResourceForeground'

const decorationPriority: ScmDecorationStatus[] = [
  DecorationDataStatus.NOT_IN_CACHE,
  DecorationDataStatus.UNCOMMITTED_UNKNOWN,
  DecorationDataStatus.UNCOMMITTED_ADDED,
  DecorationDataStatus.UNCOMMITTED_DELETED,
  DecorationDataStatus.UNCOMMITTED_MODIFIED,
  DecorationDataStatus.UNCOMMITTED_RENAMED,
  DecorationDataStatus.COMMITTED_UNKNOWN,
  DecorationDataStatus.COMMITTED_ADDED,
  DecorationDataStatus.COMMITTED_DELETED,
  DecorationDataStatus.COMMITTED_MODIFIED,
  DecorationDataStatus.COMMITTED_RENAMED,
  DecorationDataStatus.TRACKED
]

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

  private static DecorationCommittedUnknown: FileDecoration = {
    badge: 'X',
    color: new ThemeColor(IGNORED_DECORATION),
    tooltip: 'DVC Committed Unknown'
  }

  private static DecorationNotInCache: FileDecoration = {
    badge: 'NC',
    color: new ThemeColor(IGNORED_DECORATION),
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

  private static DecorationUncommittedUnknown: FileDecoration = {
    badge: 'X',
    color: new ThemeColor(IGNORED_DECORATION),
    tooltip: 'DVC Uncommitted Unknown'
  }

  private static DecorationTracked: FileDecoration = {
    tooltip: 'DVC Tracked'
  }

  public readonly onDidChangeFileDecorations: Event<Uri[]>
  private readonly decorationsChanged: EventEmitter<Uri[]>

  private state: ScmDecorationState

  private readonly decorationMapping: Partial<
    Record<ScmDecorationStatus, FileDecoration>
  > = {
    committedAdded: DecorationProvider.DecorationCommittedAdded,
    committedDeleted: DecorationProvider.DecorationCommittedDeleted,
    committedModified: DecorationProvider.DecorationCommittedModified,
    committedRenamed: DecorationProvider.DecorationCommittedRenamed,
    committedUnknown: DecorationProvider.DecorationCommittedUnknown,
    notInCache: DecorationProvider.DecorationNotInCache,
    tracked: DecorationProvider.DecorationTracked,
    uncommittedAdded: DecorationProvider.DecorationUncommittedAdded,
    uncommittedDeleted: DecorationProvider.DecorationUncommittedDeleted,
    uncommittedModified: DecorationProvider.DecorationUncommittedModified,
    uncommittedRenamed: DecorationProvider.DecorationUncommittedRenamed,
    uncommittedUnknown: DecorationProvider.DecorationUncommittedUnknown
  }

  constructor(decorationsChanged?: EventEmitter<Uri[]>) {
    super()

    this.state = {} as ScmDecorationState

    this.decorationsChanged = this.dispose.track(
      decorationsChanged || new EventEmitter()
    )
    this.onDidChangeFileDecorations = this.decorationsChanged.event

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  public provideFileDecoration(uri: Uri): FileDecoration | undefined {
    const path = uri.fsPath

    const decoration = decorationPriority.find(status => {
      if (this.state[status]?.has(path)) {
        return status
      }
    })

    if (decoration) {
      return this.decorationMapping[decoration]
    }
  }

  public setState(state: ScmDecorationState) {
    const urisToUpdate = this.getUnion(this.state, state)
    this.state = state
    this.decorationsChanged.fire(urisToUpdate)
  }

  private getUnion(
    existingState: ScmDecorationState,
    newState: ScmDecorationState
  ) {
    return flattenUnique([
      ...Object.values(existingState).map(status => [...(status || [])]),
      ...Object.values(newState).map(status => [...(status || [])])
    ]).map(path => Uri.file(path))
  }
}
