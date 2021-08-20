import { join } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { ParamsAndMetricsModel } from './model'
import { createFileSystemWatcher } from '../../fileSystem/watcher'
import { uniqueValues } from '../../util/array'

type Updater = () => Promise<void>

export class WorkspaceParamsAndMetrics {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly paramsAndMetrics: ParamsAndMetricsModel
  private fileSystemWatcher: Disposable

  constructor(
    dvcRoot: string,
    paramsAndMetrics: ParamsAndMetricsModel,
    updater: Updater
  ) {
    this.dvcRoot = dvcRoot

    this.paramsAndMetrics = paramsAndMetrics

    this.fileSystemWatcher = this.watchParamsAndMetricsFiles(updater)

    this.dispose.track(
      this.paramsAndMetrics.onDidChangeParamsAndMetricsFiles(() => {
        const fileSystemWatcher = this.watchParamsAndMetricsFiles(updater)
        this.fileSystemWatcher.dispose()
        this.fileSystemWatcher = fileSystemWatcher
      })
    )
  }

  private watchParamsAndMetricsFiles(updater: Updater) {
    const files = this.paramsAndMetrics.getFiles()
    return this.dispose.track(
      createFileSystemWatcher(
        join(
          this.dvcRoot,
          '**',
          `{${uniqueValues([
            'dvc.lock',
            'dvc.yaml',
            'params.yaml',
            ...files
          ]).join(',')}}`
        ),
        updater
      )
    )
  }
}
