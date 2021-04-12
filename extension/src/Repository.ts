import { Config } from './Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from './git'
import { SourceControlManagement } from './views/SourceControlManagement'
import { DecorationProvider } from './DecorationProvider'
import { Uri } from 'vscode'
import { getStatus } from './cli'
import { Deferred } from '@hediet/std/synchronization'
import { listDvcOnlyRecursive } from './cli/reader'
import { dirname, join } from 'path'

const filterRootDir = (dirs: string[], rootDir: string) =>
  dirs.filter(dir => dir !== rootDir)

const getAbsolutePath = (rootDir: string, files: string[]): string[] =>
  files.map(file => join(rootDir, file))

const getAbsoluteParentPath = (rootDir: string, files: string[]): string[] => {
  return filterRootDir(
    files.map(file => join(rootDir, dirname(file))),
    rootDir
  )
}

export const findDvcTrackedPaths = async (
  cwd: string,
  cliPath: string | undefined
): Promise<Set<string>> => {
  const dvcListFiles = await listDvcOnlyRecursive({ cwd, cliPath })

  return new Set([
    ...getAbsolutePath(cwd, dvcListFiles),
    ...getAbsoluteParentPath(cwd, dvcListFiles)
  ])
}

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
    dvcRoot: string,
    config: Config,
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
