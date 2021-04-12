import { Config } from './Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from './git'
import { SourceControlManagement } from './views/SourceControlManagement'
import { DecorationProvider } from './DecorationProvider'
import { findDvcTrackedPaths } from './fileSystem'
import { Uri } from 'vscode'
import { getStatus } from './cli'
import { Deferred } from '@hediet/std/synchronization'

export class Repository {
  public readonly dispose = Disposable.fn()

  private readonly _initialized = new Deferred()
  private readonly initialized = this._initialized.promise

  public get ready() {
    return this.initialized
  }

  private config: Config
  private dvcRoot: string
  private decorationProvider?: DecorationProvider
  private scm?: SourceControlManagement

  deleted: Uri[] = []
  modified: Uri[] = []
  new: Uri[] = []
  notInCache: Uri[] = []

  public async updateStatus() {
    const status = await getStatus({
      dvcRoot: this.dvcRoot,
      cliPath: this.config.dvcPath
    })

    this.modified = status.modified || []
    this.deleted = status.deleted || []
    this.new = status.new || []
    this.notInCache = status['not in cache'] || []
  }

  public async updateTracked() {
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
      getAllUntracked(dvcRoot),
      getStatus({
        dvcRoot: this.dvcRoot,
        cliPath: this.config.dvcPath
      })
    ])
      .then(promises => {
        const [files, untracked, status] = promises

        this.decorationProvider?.setTrackedFiles(files)

        this.scm = this.dispose.track(
          new SourceControlManagement(dvcRoot, {
            modified: status.modified || [],
            untracked
          })
        )
      })
      .then(() => this._initialized.resolve())
  }
}
