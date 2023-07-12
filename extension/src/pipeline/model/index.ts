import isEqual from 'lodash.isequal'
import { collectStages } from './collect'
import { Disposable } from '../../class/dispose'

export class PipelineModel extends Disposable {
  private readonly dvcRoot: string
  private stages: string[] | undefined = []
  private validPipelines: Set<string> | undefined
  private invalidPipelines: Set<string> | undefined

  constructor(dvcRoot: string) {
    super()
    this.dvcRoot = dvcRoot
  }

  public transformAndSet(stages: { [pipeline: string]: string | undefined }) {
    if (isEqual(stages, {})) {
      this.stages = undefined
      this.validPipelines = undefined
      this.invalidPipelines = undefined
      return
    }

    const { validPipelines, invalidPipelines, validStages } =
      collectStages(stages)

    this.validPipelines = validPipelines
    this.invalidPipelines = invalidPipelines
    this.stages = validStages
  }

  public hasStage() {
    return !!(this.stages && this.stages.length > 0)
  }

  public getStages() {
    return this.stages
  }

  public getPipelines() {
    return this.validPipelines
  }

  public hasPipeline() {
    return !!(this.validPipelines && this.validPipelines.size > 0)
  }

  public hasInvalidRootDvcYaml() {
    return !!this.invalidPipelines?.has(this.dvcRoot)
  }
}
