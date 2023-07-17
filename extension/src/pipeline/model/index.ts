import isEqual from 'lodash.isequal'
import { collectPipelines } from './collect'
import { Disposable } from '../../class/dispose'

export class PipelineModel extends Disposable {
  private pipelines: Set<string> | undefined

  public transformAndSet(data: { [pipeline: string]: string | undefined }) {
    if (isEqual(data, {})) {
      this.pipelines = undefined
      return
    }

    const pipelines = collectPipelines(data)

    this.pipelines = pipelines
  }

  public getPipelines() {
    return this.pipelines
  }

  public hasPipeline() {
    return !!(this.pipelines && this.pipelines.size > 0)
  }
}
