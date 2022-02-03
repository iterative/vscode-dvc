import { Disposable } from '@hediet/std/disposable'
import { collectHasCheckpoints } from './collect'
import { PartialDvcYaml } from '../../fileSystem'
import { definedAndNonEmpty, uniqueValues } from '../../util/array'

export class ExperimentCheckpointsModel {
  public dispose = Disposable.fn()

  private yamlWithCheckpoints: string[] = []

  public hasCheckpoints() {
    return definedAndNonEmpty(this.yamlWithCheckpoints)
  }

  public transformAndSet(data: { path: string; yaml: PartialDvcYaml }) {
    const { path, yaml } = data
    const hasCheckpoints = collectHasCheckpoints(yaml)

    if (hasCheckpoints) {
      this.yamlWithCheckpoints = uniqueValues([
        ...this.yamlWithCheckpoints,
        path
      ])
    } else {
      this.yamlWithCheckpoints = this.yamlWithCheckpoints.filter(
        file => file !== path
      )
    }
  }
}
