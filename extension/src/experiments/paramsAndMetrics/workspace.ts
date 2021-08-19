import { join } from 'path'
import { FileSystemWatcher } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { ParamsAndMetricsModel } from './model'
import { onDidChangeFileSystem } from '../../fileSystem/watcher'

type Updater = () => Promise<void>

export class WorkspaceParams {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly paramsAndMetrics: ParamsAndMetricsModel
  private fileSystemWatcher: FileSystemWatcher

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
