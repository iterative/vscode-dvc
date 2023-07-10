import { join } from 'path'
import { writeFileSync } from 'fs-extra'
import { PipelineData } from './data'
import { DeferredDisposable } from '../class/deferred'
import { InternalCommands } from '../commands/internal'
import { TEMP_DAG_FILE } from '../cli/dvc/constants'

export class Pipeline extends DeferredDisposable {
  private readonly dvcRoot: string
  private readonly internalCommands: InternalCommands
  private readonly data: PipelineData

  constructor(dvcRoot: string, internalCommands: InternalCommands) {
    super()
    this.dvcRoot = dvcRoot
    this.internalCommands = internalCommands
    this.data = this.dispose.track(new PipelineData(dvcRoot, internalCommands))

    this.dispose.track(
      this.data.onDidUpdate(data =>
        writeFileSync(join(this.dvcRoot, TEMP_DAG_FILE), data)
      )
    )
  }
}
