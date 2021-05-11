import { EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { experimentShow } from '../cli/reader'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'

export class Experiments {
  public readonly dispose = Disposable.fn()

  private config: Config

  private currentUpdatePromise?: Thenable<ExperimentsRepoJSONOutput>

  private data?: ExperimentsRepoJSONOutput
  public getData() {
    return this.data
  }

  private dataUpdateStarted: EventEmitter<
    Thenable<ExperimentsRepoJSONOutput>
  > = this.dispose.track(new EventEmitter())

  public readonly onDidStartDataUpdate = this.dataUpdateStarted.event

  private dataUpdated: EventEmitter<
    ExperimentsRepoJSONOutput
  > = this.dispose.track(new EventEmitter())

  public readonly onDidUpdateData = this.dataUpdated.event

  private dataUpdateFailed: EventEmitter<Error> = this.dispose.track(
    new EventEmitter()
  )

  public readonly onDidFailDataUpdate = this.dataUpdateFailed.event

  public async update(): Promise<ExperimentsRepoJSONOutput> {
    if (!this.currentUpdatePromise) {
      try {
        const updatePromise = experimentShow({
          pythonBinPath: this.config.pythonBinPath,
          cliPath: this.config.getCliPath(),
          cwd: this.config.workspaceRoot
        })
        this.currentUpdatePromise = updatePromise
        this.dataUpdateStarted.fire(updatePromise)
        const experimentData = await updatePromise
        this.dataUpdated.fire(experimentData)
        return experimentData
      } catch (e) {
        this.dataUpdateFailed.fire(e)
      } finally {
        this.currentUpdatePromise = undefined
      }
    }
    return this.currentUpdatePromise as Promise<ExperimentsRepoJSONOutput>
  }

  constructor(config: Config) {
    if (!config) {
      throw new Error('The Experiments class requires a Config instance!')
    }
    this.config = config
  }
}
