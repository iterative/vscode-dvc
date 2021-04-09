import { Config } from './Config'
import { Disposable } from '@hediet/std/disposable'
// import { Deferred } from '@hediet/std/synchronization'
import { findDvcTrackedPaths } from './fileSystem'
import { getAllUntracked } from './git'
import { SourceControlManagement } from './views/SourceControlManagement'
import { DecorationProvider } from './DecorationProvider'
import { Status } from './Status'
import { GitExtensionRepository } from './extensions/Git'

export class Repository {
  private config: Config
  public readonly dispose = Disposable.fn()
  private readonly decorationProvider: DecorationProvider

  constructor(
    config: Config,
    dvcRoot: string,
    gitExtensionRepository: GitExtensionRepository
  ) {
    this.config = config
    this.decorationProvider = this.dispose.track(new DecorationProvider())
    Promise.all([
      findDvcTrackedPaths(dvcRoot, this.config.dvcPath),
      getAllUntracked(dvcRoot)
    ]).then(values => {
      const [tracked, untracked] = values

      this.decorationProvider.setTracked(tracked)
      const status = this.dispose.track(new Status(this.config, dvcRoot))
      const scm = this.dispose.track(
        new SourceControlManagement(dvcRoot, untracked, status)
      )

      gitExtensionRepository.onDidUntrackedChange(async () => {
        const untrackedChanges = await getAllUntracked(dvcRoot)
        this.decorationProvider.setTracked(tracked)
        return scm.updateUntracked(untrackedChanges)
      })
    })
  }
}
