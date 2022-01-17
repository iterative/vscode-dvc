import { EventEmitter } from 'vscode'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { BaseData } from '../../data'
import { PlotsOutput } from '../../plots/webview/contract'

export class PlotsData extends BaseData<PlotsOutput> {
  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>
  ) {
    super(
      dvcRoot,
      internalCommands,
      AvailableCommands.PLOTS_DIFF,
      updatesPaused
    )
  }

  public collectFiles(data: PlotsOutput) {
    return Object.keys(data)
  }
}
