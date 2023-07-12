import { join } from 'path'
import { appendFileSync, writeFileSync } from 'fs-extra'
import { PipelineData } from './data'
import { PipelineModel } from './model'
import { DeferredDisposable } from '../class/deferred'
import { InternalCommands } from '../commands/internal'
import { TEMP_DAG_FILE } from '../cli/dvc/constants'

export class Pipeline extends DeferredDisposable {
  private readonly dvcRoot: string
  private readonly data: PipelineData
  private readonly model: PipelineModel

  constructor(dvcRoot: string, internalCommands: InternalCommands) {
    super()
    this.dvcRoot = dvcRoot
    this.data = this.dispose.track(new PipelineData(dvcRoot, internalCommands))
    this.model = this.dispose.track(new PipelineModel(dvcRoot))

    void this.initialize()
  }

  public forceRerender() {
    return appendFileSync(join(this.dvcRoot, TEMP_DAG_FILE), '\n')
  }

  private async initialize() {
    this.dispose.track(
      this.data.onDidUpdate(({ dag, stageList }) => {
        writeFileSync(join(this.dvcRoot, TEMP_DAG_FILE), dag)
        this.model.transformAndSet(stageList)
      })
    )

    await this.data.isReady()
    return this.deferred.resolve()
  }
}
