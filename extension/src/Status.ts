import { Uri } from 'vscode'
import { getStatus } from './cli'
import { Config } from './Config'

export class Status {
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
    this.updateStatus()
  }
}
