import { AvailableCommands } from '../../commands/internal'
import { BaseData } from '../../data'
import { PlotsOutput } from '../../plots/webview/contract'
import { PlotsModel } from '../model'

export class PlotsData extends BaseData<PlotsOutput> {
  private model?: PlotsModel

  public async update(): Promise<void> {
    const args = this.model?.getMissingRevisions() || []

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
