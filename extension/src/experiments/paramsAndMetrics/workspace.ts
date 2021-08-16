import { join } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { readFileSync } from 'fs-extra'
import { load } from 'js-yaml'
import { ValueTreeRoot } from '../../cli/reader'
import { onDidChangeFileSystem } from '../../fileSystem/watcher'
import { reset } from '../../util/disposable'
import { sameContents } from '../../util/array'

type Updater = () => Promise<void>

type PartialLockFile = {
  stages: {
    train: {
      params: ValueTreeRoot
    }
  }
}

export class WorkspaceParams {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly dvcLock: string
  private paramsFiles: string[] = []
  private watchers: Record<string, Disposable> = {}

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  constructor(dvcRoot: string, updater: Updater) {
    this.dvcRoot = dvcRoot
    this.dvcLock = join(dvcRoot, 'dvc.lock')

    Promise.all(this.findAndWatchParams(updater))
      .then(() => this.watchLockFile(updater))
      .then(() => this.deferred.resolve())
  }

  public isReady() {
    return this.initialized
  }

  private watchLockFile(updater: Updater) {
    const { isReady } = this.dispose.track(
      onDidChangeFileSystem(this.dvcLock, () => {
        const paramsFiles = this.findParams()
        const existingParamsFiles = this.getParamsFiles()
        if (!sameContents(existingParamsFiles, paramsFiles)) {
          this.watchers = reset(this.watchers, this.dispose)
          this.paramsFiles = paramsFiles

          this.watchParams(updater)
        }
      })
    )
    return isReady
  }

  private getParamsFiles() {
    return this.paramsFiles
  }

  private findAndWatchParams(updater: Updater) {
    this.paramsFiles = this.findParams()
    return this.watchParams(updater)
  }

  private findParams() {
    const lockFileYaml = load(
      readFileSync(this.dvcLock, 'utf-8')
    ) as PartialLockFile

    return Object.keys(lockFileYaml.stages.train.params).map(paramsFile =>
      join(this.dvcRoot, paramsFile)
    )
  }

  private watchParams(updater: Updater) {
    return this.paramsFiles.map(paramsFile => {
      const { isReady, ...disposable } = this.dispose.track(
        onDidChangeFileSystem(paramsFile, () => updater())
      )
      this.watchers[paramsFile] = disposable

      return isReady
    })
  }
}
