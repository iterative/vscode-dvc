import { Config } from './Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from './git'
import { SourceControlManagement } from './views/SourceControlManagement'
import { Status } from './Status'
import { GitExtensionRepository } from './extensions/Git'

export class Repository {
  private config: Config
  public readonly dispose = Disposable.fn()

  constructor(
    config: Config,
    dvcRoot: string,
    gitExtensionRepository: GitExtensionRepository
  ) {
    this.config = config
    getAllUntracked(dvcRoot).then(untracked => {
      const status = this.dispose.track(new Status(this.config, dvcRoot))
      const scm = this.dispose.track(
        new SourceControlManagement(dvcRoot, untracked, status)
      )

      gitExtensionRepository.onDidUntrackedChange(async () => {
        const untrackedChanges = await getAllUntracked(dvcRoot)
        return scm.updateUntracked(untrackedChanges)
      })
    })
  }
}
