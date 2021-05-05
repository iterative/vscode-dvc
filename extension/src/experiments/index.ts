import { EventEmitter } from 'vscode'
import { experimentShow } from '../cli/reader'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'

export class ExperimentsManager {
  private config: Config

  private _currentUpdatePromise?: Thenable<void>

  private onStartedUpdateEmitter: EventEmitter<
    Thenable<void>
  > = new EventEmitter()

  public readonly onStartedUpdate = this.onStartedUpdateEmitter.event

  private _experiments?: ExperimentsRepoJSONOutput
  public get experiments() {
    return this._experiments
  }

  private async _performUpdate(): Promise<void> {
    await this.config.ready
    this._experiments = await experimentShow({
      pythonBinPath: this.config.pythonBinPath,
      cliPath: this.config.dvcPath,
      cwd: this.config.workspaceRoot
    })
  }

  public update(): Thenable<void> {
    if (!this._currentUpdatePromise) {
      const updatePromise = this._performUpdate()
      this._currentUpdatePromise = updatePromise
      this.onStartedUpdateEmitter.fire(updatePromise)
      updatePromise.finally(() => {
        this._currentUpdatePromise = undefined
      })
    }
    return this._currentUpdatePromise
  }

  constructor(config: Config) {
    if (!config) {
      throw new Error('The Experiments class requires a Config instance!')
    }
    this.config = config
    this._currentUpdatePromise = this.update()
  }

  public dispose() {
    this.onStartedUpdateEmitter.dispose()
  }
}
