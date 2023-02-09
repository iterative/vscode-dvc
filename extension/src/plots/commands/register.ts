import { RegisteredCommands } from '../../commands/external'
import { InternalCommands } from '../../commands/internal'
import { Setup } from '../../setup'
import { Context, getDvcRootFromContext } from '../../vscode/context'
import { WorkspacePlots } from '../workspace'

export const registerPlotsCommands = (
  plots: WorkspacePlots,
  internalCommands: InternalCommands,
  setup: Setup
) => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.PLOTS_SHOW,
    (context: Context) =>
      setup.shouldBeShown()
        ? setup.showWebview()
        : plots.showWebview(getDvcRootFromContext(context))
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.PLOTS_SELECT,
    (context: Context) => plots.selectPlots(getDvcRootFromContext(context))
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.PLOTS_REFRESH,
    (context: Context) => plots.refresh(getDvcRootFromContext(context))
  )
}
