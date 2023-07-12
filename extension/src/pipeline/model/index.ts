import { collectPipelines, collectStages } from './collect'
import { Disposable } from '../../class/dispose'

export class PipelineModel extends Disposable {
  private readonly dvcRoot: string
  private stages: string[] = []
  private pipelines: Set<string> = new Set()

  constructor(dvcRoot: string) {
    super()
    this.dvcRoot = dvcRoot
  }

  public transformAndSet(stageList: string) {
    this.stages = collectStages(stageList)
    this.pipelines = collectPipelines(this.dvcRoot, this.stages)
  }

  public hasStages() {
    return this.stages.length > 0
  }

  public getPipelines() {
    return this.pipelines
  }
}
