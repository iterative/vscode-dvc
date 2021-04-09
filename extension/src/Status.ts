import { Uri } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { getStatus } from './cli'
import { Config } from './Config'

export class Status {
  public readonly dispose = Disposable.fn()

  private readonly _initialized = new Deferred()
  private readonly initialized = this._initialized.promise

  public get ready() {
    return this.initialized
  }

  dvcRoot: string
  config: Config

  deleted: Uri[] = []
  modified: Uri[] = []
  new: Uri[] = []
  notInCache: Uri[] = []

  public async updateStatus() {
    const status = await getStatus({
      dvcRoot: this.dvcRoot,
      cliPath: this.config.dvcPath
    })

    this.modified = status.modified || []
    this.deleted = status.deleted || []
    this.new = status.new || []
    this.notInCache = status['not in cache'] || []
  }

  constructor(config: Config, dvcRoot: string) {
    this.dvcRoot = dvcRoot
    this.config = config
    this.updateStatus().then(() => {
      this._initialized.resolve()
    })
  }
}
