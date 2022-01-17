import { join, relative } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { Event, EventEmitter } from 'vscode'
import { collectFiles } from './collect'
import { EXPERIMENTS_GIT_REFS } from './constants'
import {
  createFileSystemWatcher,
  createNecessaryFileSystemWatcher
} from '../../fileSystem/watcher'
import {
  DOT_GIT,
  DOT_GIT_HEAD,
  HEADS_GIT_REFS,
  getGitRepositoryRoot
} from '../../git'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { ExperimentsOutput } from '../../cli/reader'
import { BaseData } from '../../data'
import {
  definedAndNonEmpty,
  sameContents,
  uniqueValues
} from '../../util/array'

export class ExperimentsData extends BaseData<ExperimentsOutput> {
  private collectedFiles: string[] = []
  private readonly staticFiles: string[]
  private watcher?: Disposable

  private readonly collectedFilesChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  private readonly onDidChangeCollectedFiles: Event<void> =
    this.collectedFilesChanged.event

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>
  ) {
    super(dvcRoot, internalCommands, updatesPaused)

    this.staticFiles = ['dvc.lock', 'dvc.yaml', 'params.yaml']

    this.watchExpGitRefs()
    this.initialize()
  }

  public forceUpdate() {
    return this.processManager.forceRunQueued()
  }

  public async update(): Promise<void> {
    const data = await this.internalCommands.executeCommand<ExperimentsOutput>(
      AvailableCommands.EXPERIMENT_SHOW,
      this.dvcRoot
    )

    const files = this.collectFiles(data)

    this.compareFiles(files)

    return this.notifyChanged(data)
  }

  private collectFiles(data: ExperimentsOutput) {
    return collectFiles(data)
  }

  private compareFiles(files: string[]) {
    if (sameContents(this.collectedFiles, files)) {
      return
    }

    this.collectedFiles = files
    this.collectedFilesChanged.fire()
  }

  private watchFiles() {
    const files = uniqueValues([...this.staticFiles, ...this.collectedFiles])
    if (!definedAndNonEmpty(files)) {
      return
    }

    return this.dispose.track(
      createFileSystemWatcher(
        join(this.dvcRoot, '**', `{${files.join(',')}}`),
        path => {
          if (!path) {
            return
          }
          this.managedUpdate()
        }
      )
    )
  }

  private initialize() {
    const waitForInitialData = this.dispose.track(
      this.onDidUpdate(() => {
        this.watcher = this.watchFiles()

        this.dispose.track(
          this.onDidChangeCollectedFiles(() => {
            const watcher = this.watchFiles()
            this.dispose.untrack(this.watcher)
            this.watcher?.dispose()
            this.watcher = watcher
          })
        )
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
        this.deferred.resolve()
      })
    )
    this.managedUpdate()
  }

  private async watchExpGitRefs(): Promise<void> {
    const gitRoot = await getGitRepositoryRoot(this.dvcRoot)
    const watchedRelPaths = [DOT_GIT_HEAD, EXPERIMENTS_GIT_REFS, HEADS_GIT_REFS]
    this.dispose.track(
      createNecessaryFileSystemWatcher(
        join(gitRoot, DOT_GIT),
        watchedRelPaths.map(path => relative(DOT_GIT, path)),
        (path: string) => {
          if (
            watchedRelPaths.some(watchedRelPath =>
              path.includes(watchedRelPath)
            )
          ) {
            return this.managedUpdate()
          }
        }
      )
    )
  }
}
