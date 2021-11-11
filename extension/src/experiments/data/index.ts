import { join, resolve } from 'path'
import { collectFiles } from './collect'
import { DOT_GIT, EXPERIMENTS_GIT_REFS, GIT_REFS } from './constants'
import { createNecessaryFileSystemWatcher } from '../../fileSystem/watcher'
import { getGitRepositoryRoot } from '../../git'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { ExperimentsOutput } from '../../cli/reader'
import { BaseData } from '../../data'

export class ExperimentsData extends BaseData<ExperimentsOutput> {
  constructor(dvcRoot: string, internalCommands: InternalCommands) {
    super(dvcRoot, internalCommands, AvailableCommands.EXPERIMENT_SHOW, [
      'dvc.lock',
      'dvc.yaml',
      'params.yaml'
    ])

    this.watchExpGitRefs()
  }

  public collectFiles(data: ExperimentsOutput) {
    return collectFiles(data)
  }

  private async watchExpGitRefs(): Promise<void> {
    const gitRoot = await getGitRepositoryRoot(this.dvcRoot)
    const dotGitGlob = resolve(gitRoot, DOT_GIT, '**')
    this.dispose.track(
      createNecessaryFileSystemWatcher(dotGitGlob, (path: string) => {
        if (
          path.includes('HEAD') ||
          path.includes(EXPERIMENTS_GIT_REFS) ||
          path.includes(join(GIT_REFS, 'heads'))
        ) {
          return this.update()
        }
      })
    )
  }
}
