import { collectHasCheckpoints } from './collect'
import { PartialDvcYaml } from '../../fileSystem'
import { definedAndNonEmpty, uniqueValues } from '../../util/array'
import { BaseClass } from '../../class'

export class CheckpointsModel extends BaseClass {
  private yamlWithCheckpoints: string[] = []

  public hasCheckpoints() {
    return definedAndNonEmpty(this.yamlWithCheckpoints)
  }

  public transformAndSet(data: { path: string; yaml: PartialDvcYaml }) {
    const { path, yaml } = data
    const hasCheckpoints = collectHasCheckpoints(yaml)

    this.yamlWithCheckpoints = hasCheckpoints
      ? uniqueValues([...this.yamlWithCheckpoints, path])
      : this.yamlWithCheckpoints.filter(file => file !== path)
  }
}
