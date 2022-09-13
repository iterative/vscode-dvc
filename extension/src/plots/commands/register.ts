import { RegisteredCommands } from '../../commands/external'
import { InternalCommands } from '../../commands/internal'
import { WorkspacePlots } from '../workspace'

export const registerPlotsCommands = (
  plots: WorkspacePlots,
  internalCommands: InternalCommands
) => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.PLOTS_SHOW,
    (context: { dvcRoot?: string } | undefined) =>
      plots.showWebview(context?.dvcRoot)
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.PLOTS_SELECT,
    (dvcRoot?: string) => plots.selectPlots(dvcRoot)
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.PLOTS_REFRESH,
    (dvcRoot?: string) => plots.refresh(dvcRoot)
  )
}
