import { Config } from './Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from './git'
import { SourceControlManagement } from './views/SourceControlManagement'
import { Status } from './Status'
import { DecorationProvider } from './DecorationProvider'
import { findDvcTrackedPaths } from './fileSystem'

export class Repository {
  private config: Config
  private dvcRoot: string
  private decorationProvider?: DecorationProvider
  private scm?: SourceControlManagement
  public readonly dispose = Disposable.fn()

  public async updateUntracked() {
    const untrackedChanges = await getAllUntracked(this.dvcRoot)
    return this.scm?.setUntracked(untrackedChanges)
  }

  constructor(
    config: Config,
    dvcRoot: string,
    decorationProvider?: DecorationProvider
  ) {
    this.config = config
    this.decorationProvider = decorationProvider
    this.dvcRoot = dvcRoot
    Promise.all([
      findDvcTrackedPaths(dvcRoot, this.config.dvcPath),
      getAllUntracked(dvcRoot)
    ]).then(promises => {
      const [files, untracked] = promises

      this.decorationProvider?.setTrackedFiles(files)

      const status = this.dispose.track(new Status(this.config, dvcRoot))
      this.scm = this.dispose.track(
        new SourceControlManagement(dvcRoot, untracked, status)
      )
    })
  }
}
