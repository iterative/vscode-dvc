import { join, resolve } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { readFileSync } from 'fs-extra'
import { load } from 'js-yaml'
import { ValueTreeRoot } from '../../cli/reader'
import {
  onDidChangeFileSystem,
  FSWatcher,
  isDvcLock
} from '../../fileSystem/watcher'
import { reset } from '../../util/disposable'
import { flattenUnique, sameContents } from '../../util/array'

type Updater = () => Promise<void>

type PartialLockFile = {
  stages: {
    train: {
      params: ValueTreeRoot
    }
  }
}

type FSWatchers = Record<string, FSWatcher>

export class WorkspaceParams {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly dvcLocks = new Set<string>()
  private fsWatchers: FSWatchers = {}

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private initialScanCompleted = false

  constructor(dvcRoot: string, updater: Updater) {
    this.dvcRoot = dvcRoot

    this.findAndWatchLockFiles(updater)
      .then(() => {
        this.initialScanCompleted = true
        return Promise.all(this.findAndWatchParams(updater))
      })
      .then(() => this.deferred.resolve())
  }

  public isReady() {
    return this.initialized
  }

  private findAndWatchLockFiles(updater: Updater) {
    const fsWatcher = this.dispose.track(
      onDidChangeFileSystem(
        join(this.dvcRoot, '**', 'dvc.lock'),
        (path: string) => this.watchDvcLock(path, updater)
      )
    )

    this.findDvcLocks(fsWatcher)

    return fsWatcher.isReady
  }

  private getParamsFiles() {
    return Object.keys(this.fsWatchers)
  }

  private isInitialScanCompleted() {
    return this.initialScanCompleted
  }

  private findDvcLocks(fsWatcher: FSWatcher) {
    const { on, unwatch } = fsWatcher

    on('add', path => {
      if (isDvcLock(path)) {
        return this.dvcLocks.add(path)
      }
      unwatch(path)
    })

    on('addDir', path => {
      unwatch(path)
    })

    on('unlink', path => {
      this.dvcLocks.delete(path)
    })
  }

  private watchDvcLock(path: string, updater: Updater) {
    if (isDvcLock(path)) {
      const paramsFiles = this.findParamsFiles()
      const existingParamsFiles = this.getParamsFiles()
      if (
        this.isInitialScanCompleted() &&
        !sameContents(existingParamsFiles, paramsFiles)
      ) {
        this.fsWatchers = reset<FSWatchers>(this.fsWatchers, this.dispose)

        this.watchParamsFiles(paramsFiles, updater)
      }
    }
  }

  private findAndWatchParams(updater: Updater) {
    const paramsFiles = this.findParamsFiles()
    return this.watchParamsFiles(paramsFiles, updater)
  }

  private findParamsFiles() {
    return flattenUnique(
      [...this.dvcLocks].map(dvcLock => {
        const lockFileYaml = load(
          readFileSync(dvcLock, 'utf-8')
        ) as PartialLockFile

        return Object.keys(lockFileYaml.stages.train.params).map(paramsFile =>
          resolve(dvcLock, '..', paramsFile)
        )
      })
    )
  }

  private watchParamsFiles(paramsFiles: string[], updater: Updater) {
    return paramsFiles.map(paramsFile => {
      const watcher = this.dispose.track(
        onDidChangeFileSystem(paramsFile, () => updater())
      )
      this.fsWatchers[paramsFile] = watcher

      return watcher.isReady
    })
  }
}
