export const BaseDataStatus = {
  COMMITTED_ADDED: 'committedAdded',
  COMMITTED_DELETED: 'committedDeleted',
  COMMITTED_MODIFIED: 'committedModified',
  COMMITTED_RENAMED: 'committedRenamed',
  NOT_IN_CACHE: 'notInCache',
  UNCOMMITTED_ADDED: 'uncommittedAdded',
  UNCOMMITTED_DELETED: 'uncommittedDeleted',
  UNCOMMITTED_MODIFIED: 'uncommittedModified',
  UNCOMMITTED_RENAMED: 'uncommittedRenamed'
} as const
