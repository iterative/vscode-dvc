import { join } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { readFileSync } from 'fs-extra'
import { load } from 'js-yaml'
import isEqual from 'lodash.isequal'
import { ValueTreeRoot } from '../../cli/reader'
import { onDidChangeFileSystem } from '../../fileSystem/watcher'
import { reset } from '../../util/disposable'

export class WorkspaceParams {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly dvcLock: string
  private paramsFiles: string[] = []
  private watchers: Record<string, Disposable> = {}

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  constructor(dvcRoot: string, updater: () => Promise<void>) {
    this.dvcRoot = dvcRoot
    this.dvcLock = join(dvcRoot, 'dvc.lock')

    this.dispose.track(
      onDidChangeFileSystem(this.dvcLock, () => {
        const paramsFiles = this.findParams()
        if (!isEqual(this.paramsFiles, paramsFiles)) {
          this.watchers = reset(this.watchers, this.dispose)

          this.paramsFiles = paramsFiles
          this.watchParams(updater)
        }
      })
    )

    this.findAndWatchParams(updater).then(() => this.deferred.resolve())
  }

  public isReady() {
    return this.initialized
  }

  private findAndWatchParams(updater: () => Promise<void>) {
    this.paramsFiles = this.findParams()
    return this.watchParams(updater)
  }

  private findParams() {
    const yaml = load(readFileSync(this.dvcLock, 'utf-8')) as {
      stages: {
        train: {
          params: ValueTreeRoot
        }
      }
    }

    return Object.keys(yaml.stages.train.params).map(paramsFile =>
      join(this.dvcRoot, paramsFile)
    )
  }

  private watchParams(updater: () => Promise<void>) {
    return Promise.all(
      this.paramsFiles.map(paramsFile => {
        const { isReady, ...disposable } = this.dispose.track(
          onDidChangeFileSystem(paramsFile, () => updater())
        )
        this.watchers[paramsFile] = disposable

        return isReady
      })
    )
  }
}
