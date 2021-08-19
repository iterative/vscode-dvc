import { join } from 'path'
import { FileSystemWatcher } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { ParamsAndMetricsModel } from './model'
import { onDidChangeFileSystem } from '../../fileSystem/watcher'

type Updater = () => Promise<void>

export class WorkspaceParams {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly paramsAndMetrics: ParamsAndMetricsModel
  private fileSystemWatcher: FileSystemWatcher

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  constructor(
    dvcRoot: string,
    paramsAndMetrics: ParamsAndMetricsModel,
    updater: Updater
  ) {
    this.dvcRoot = dvcRoot

    this.paramsAndMetrics = paramsAndMetrics

    this.fileSystemWatcher = this.watchParamsAndMetricsFiles(updater)

    this.paramsAndMetrics.onDidChangeParamsAndMetricsFiles(() => {
      const fileSystemWatcher = this.watchParamsAndMetricsFiles(updater)
      this.fileSystemWatcher.dispose()
      this.fileSystemWatcher = fileSystemWatcher
    })

    this.deferred.resolve()
  }

  public isReady() {
    return this.initialized
  }

  private watchParamsAndMetricsFiles(updater: Updater) {
    const files = this.paramsAndMetrics.getFiles()
    return this.dispose.track(
      onDidChangeFileSystem(
        join(
          this.dvcRoot,
          '**',
          `{${['dvc.lock', 'dvc.yaml', 'params.yaml', ...files].join(',')}}`
        ),
        updater
      )
    )
  }
}
