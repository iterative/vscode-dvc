import { PlotsOutput } from '../../cli/reader'
import { AvailableCommands } from '../../commands/internal'
import { BaseData } from '../../data'
import {
  definedAndNonEmpty,
  flattenUnique,
  sameContents
} from '../../util/array'
import { PlotsModel } from '../model'

export class PlotsData extends BaseData<PlotsOutput> {
  private model?: PlotsModel

  public async update(): Promise<void> {
    const missingRevisions = this.model?.getMissingRevisions() || []
    const runningRevisions = this.model?.getRunningRevisions() || []

    const data = await this.getData(missingRevisions, runningRevisions)
    if (!data) {
      return
    }

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

  private getData(missingRevisions: string[], runningRevisions: string[]) {
    if (!definedAndNonEmpty([...missingRevisions, ...runningRevisions])) {
      return
    }

    if (
      !definedAndNonEmpty(missingRevisions) &&
      sameContents(runningRevisions, ['workspace'])
    ) {
      return this.internalCommands.executeCommand<PlotsOutput>(
        AvailableCommands.PLOTS_DIFF,
        this.dvcRoot
      )
    }

    return this.internalCommands.executeCommand<PlotsOutput>(
      AvailableCommands.PLOTS_DIFF,
      this.dvcRoot,
      ...flattenUnique([missingRevisions, runningRevisions])
    )
  }
}
