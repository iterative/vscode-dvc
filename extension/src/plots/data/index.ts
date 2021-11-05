import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { BaseData } from '../../data'
import { PlotsOutput } from '../../cli/reader'

export class PlotsData extends BaseData<PlotsOutput> {
  constructor(dvcRoot: string, internalCommands: InternalCommands) {
    super(dvcRoot, internalCommands, AvailableCommands.PLOTS_SHOW)
  }

  public collectFiles(data: PlotsOutput) {
    return Object.keys(data)
  }
}
