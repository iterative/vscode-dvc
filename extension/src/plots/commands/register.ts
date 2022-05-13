import { RegisteredCommands } from '../../commands/external'
import { InternalCommands } from '../../commands/internal'
import { WorkspacePlots } from '../workspace'

export const registerPlotsCommands = (
  plots: WorkspacePlots,
  internalCommands: InternalCommands
) => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.PLOTS_SHOW,
    () => {
      plots.showWebview()
    }
  )
}
