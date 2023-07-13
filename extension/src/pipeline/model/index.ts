import isEqual from 'lodash.isequal'
import { collectStages } from './collect'
import { Disposable } from '../../class/dispose'

export class PipelineModel extends Disposable {
  private readonly dvcRoot: string
  private stages: string[] | undefined = []
  private pipelines: Set<string> | undefined

  constructor(dvcRoot: string) {
    super()
    this.dvcRoot = dvcRoot
  }

  public transformAndSet(data: { [pipeline: string]: string | undefined }) {
    if (isEqual(data, {})) {
      this.stages = undefined
      this.pipelines = undefined
      return
    }

    const { pipelines, stages } = collectStages(data)

    this.pipelines = pipelines
    this.stages = stages
  }

  public hasStage() {
    return !!(this.stages && this.stages.length > 0)
  }

  public getStages() {
    return this.stages
  }

  public getPipelines() {
    return this.pipelines
  }

  public hasPipeline() {
    return !!(this.pipelines && this.pipelines.size > 0)
  }
}
