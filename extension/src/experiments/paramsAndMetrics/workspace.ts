import { join } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { readFileSync } from 'fs-extra'
import { load } from 'js-yaml'
import { ValueTreeRoot } from '../../cli/reader'
import { onDidChangeFileSystem } from '../../fileSystem/watcher'

export class WorkspaceParams {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly dvcLock: string
  private paramsFiles: string[] = []

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  constructor(dvcRoot: string, updater: () => Promise<void>) {
    this.dvcRoot = dvcRoot
    this.dvcLock = join(dvcRoot, 'dvc.lock')

    // check to see if params file moved! this.dispose.track(onDidChangeFileSystem(this.dvcLock, () => undefined))

    this.findAndWatchParams(updater).then(() => this.deferred.resolve())
  }

  public isReady() {
    return this.initialized
  }

  private findAndWatchParams(updater: () => Promise<void>) {
    const yaml = load(readFileSync(this.dvcLock, 'utf-8')) as {
      stages: {
        train: {
          params: ValueTreeRoot
        }
      }
    }

    this.paramsFiles = Object.keys(yaml.stages.train.params).map(paramsFile =>
      join(this.dvcRoot, paramsFile)
    )

    return Promise.all(
      this.paramsFiles.map(paramsFile => {
        const { isReady } = this.dispose.track(
          onDidChangeFileSystem(paramsFile, () => updater())
        )
        return isReady
      })
    )
  }
}
