import { basename, extname } from 'path'
import { TrackedExplorerTree } from './views/trackedExplorerTree'
import { Repository } from '../repository'

export const getWatcher = (
  repository: Repository,
  trackedExplorerTree: TrackedExplorerTree
): ((path: string) => void) => (path: string) => {
  if (!path) {
    return
  }
  if (
    extname(path) === '.dvc' ||
    basename(path) === 'dvc.lock' ||
    basename(path) === 'dvc.yaml'
  ) {
    repository.resetState()
    trackedExplorerTree.reset()
    return
  }
  repository.updateState()
  trackedExplorerTree.refresh(path)
}
