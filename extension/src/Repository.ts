import { Config } from './Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from './git'
import { SourceControlManagement } from './views/SourceControlManagement'
import { Status } from './Status'
import { GitExtensionRepository } from './extensions/Git'
import { DecorationProvider } from './DecorationProvider'
import { findDvcTrackedPaths } from './fileSystem'

export class Repository {
  private config: Config
  private decorationProvider?: DecorationProvider
  public readonly dispose = Disposable.fn()

  constructor(
    config: Config,
    dvcRoot: string,
    gitExtensionRepository: GitExtensionRepository,
    decorationProvider?: DecorationProvider
  ) {
    this.config = config
    this.decorationProvider = decorationProvider

    Promise.all([
      findDvcTrackedPaths(dvcRoot, this.config.dvcPath),
      getAllUntracked(dvcRoot)
    ]).then(promises => {
      const [files, untracked] = promises

      this.decorationProvider?.setTrackedFiles(files)

      const status = this.dispose.track(new Status(this.config, dvcRoot))
      const scm = this.dispose.track(
        new SourceControlManagement(dvcRoot, untracked, status)
      )

      gitExtensionRepository.onDidUntrackedChange(async () => {
        const untrackedChanges = await getAllUntracked(dvcRoot)
        return scm.setUntracked(untrackedChanges)
      })
    })
  }
}
