export const DiscardedStatus = {
  UNCHANGED: 'unchanged'
} as const

export const UndecoratedDataStatus = {
  TRACKED_DECORATIONS: 'trackedDecorations',
  UNTRACKED: 'untracked'
} as const

export const BaseDataStatus = {
  COMMITTED_ADDED: 'committedAdded',
  COMMITTED_DELETED: 'committedDeleted',
  COMMITTED_MODIFIED: 'committedModified',
  COMMITTED_RENAMED: 'committedRenamed',
  COMMITTED_UNKNOWN: 'committedUnknown',
  NOT_IN_CACHE: 'notInCache',
  UNCOMMITTED_ADDED: 'uncommittedAdded',
  UNCOMMITTED_DELETED: 'uncommittedDeleted',
  UNCOMMITTED_MODIFIED: 'uncommittedModified',
  UNCOMMITTED_RENAMED: 'uncommittedRenamed',
  UNCOMMITTED_UNKNOWN: 'uncommittedUnknown'
} as const
