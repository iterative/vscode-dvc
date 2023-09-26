import { commands } from 'vscode'
import { RegisteredCommands } from '../../commands/external'
import { InternalCommands } from '../../commands/internal'
import { showSetupOrExecuteCommand } from '../../commands/util'
import { Setup } from '../../setup'
import { Context, getDvcRootFromContext } from '../../vscode/context'
import { WorkspacePlots } from '../workspace'
import { WorkspacePipeline } from '../../pipeline/workspace'

export const registerPlotsCommands = (
  plots: WorkspacePlots,
  internalCommands: InternalCommands,
  setup: Setup,
  pipelines: WorkspacePipeline
) => {
  commands.registerCommand(RegisteredCommands.ADD_PLOT, (context: Context) =>
    plots.addPlot(pipelines, getDvcRootFromContext(context))
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.PLOTS_SHOW,
    showSetupOrExecuteCommand(setup, context =>
      plots.showWebview(getDvcRootFromContext(context))
    )
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.PLOTS_SELECT,
    (context: Context) => plots.selectPlots(getDvcRootFromContext(context))
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.PLOTS_REFRESH,
    (context: Context) => plots.refresh(getDvcRootFromContext(context))
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.PLOTS_CUSTOM_REMOVE,
    (context: Context) =>
      plots.removeCustomPlots(getDvcRootFromContext(context))
  )
}
