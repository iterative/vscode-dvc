import { EventEmitter } from 'vscode'
import { experimentShow } from '../cli/reader'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'

export class Experiments {
  private config: Config

  private _currentUpdatePromise?: Thenable<ExperimentsRepoJSONOutput>

  private _data?: ExperimentsRepoJSONOutput
  public get data() {
    return this._data
  }

  private onStartedUpdateEmitter: EventEmitter<
    Thenable<ExperimentsRepoJSONOutput>
  > = new EventEmitter()

  public readonly onStartedUpdate = this.onStartedUpdateEmitter.event

  private onDidUpdateEmitter: EventEmitter<
    ExperimentsRepoJSONOutput
  > = new EventEmitter()

  public readonly onDidUpdate = this.onDidUpdateEmitter.event

  private onFailedUpdateEmitter: EventEmitter<Error> = new EventEmitter()
  public readonly onFailedUpdate = this.onFailedUpdateEmitter.event

  public async update(): Promise<ExperimentsRepoJSONOutput> {
    if (!this._currentUpdatePromise) {
      try {
        const updatePromise = experimentShow({
          pythonBinPath: this.config.pythonBinPath,
          cliPath: this.config.getCliPath(),
          cwd: this.config.workspaceRoot
        })
        this._currentUpdatePromise = updatePromise
        this.onStartedUpdateEmitter.fire(updatePromise)
        const experimentData = await updatePromise
        this.onDidUpdateEmitter.fire(experimentData)
        return experimentData
      } catch (e) {
        this.onFailedUpdateEmitter.fire(e)
      } finally {
        this._currentUpdatePromise = undefined
      }
    }
    return this._currentUpdatePromise as Promise<ExperimentsRepoJSONOutput>
  }

  constructor(config: Config) {
    if (!config) {
      throw new Error('The Experiments class requires a Config instance!')
    }
    this.config = config
  }

  public dispose() {
    this.onStartedUpdateEmitter.dispose()
    this.onDidUpdateEmitter.dispose()
    this.onFailedUpdateEmitter.dispose()
  }
}
