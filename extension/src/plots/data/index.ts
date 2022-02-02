import { PlotsOutput } from '../../cli/reader'
import { AvailableCommands } from '../../commands/internal'
import { BaseData } from '../../data'
import { definedAndNonEmpty, flattenUnique } from '../../util/array'
import { PlotsModel } from '../model'

export class PlotsData extends BaseData<PlotsOutput> {
  private model?: PlotsModel

  public async update(): Promise<void> {
    const args = flattenUnique([
      this.model?.getMissingRevisions() || [],
      this.model?.getMutableRevisions() || []
    ])

    if (
      !definedAndNonEmpty(args) &&
      this.model?.hasCheckpoints() &&
      (await this.internalCommands.executeCommand<boolean>(
        AvailableCommands.EXPERIMENT_IS_RUNNING
      ))
    ) {
      return
    }

    const data = await this.internalCommands.executeCommand<PlotsOutput>(
      AvailableCommands.PLOTS_DIFF,
      this.dvcRoot,
      ...args
    )

    const files = this.collectFiles(data)

    this.compareFiles(files)

    return this.notifyChanged(data)
  }

  public collectFiles(data: PlotsOutput) {
    return Object.keys(data)
  }

  public setModel(model: PlotsModel) {
    this.model = model
  }
}
