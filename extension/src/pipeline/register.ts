import { WorkspacePipeline } from './workspace'
import { RegisteredCommands } from '../commands/external'
import { InternalCommands } from '../commands/internal'
import { Context, getDvcRootFromContext } from '../vscode/context'

export const registerPipelineCommands = (
  pipelines: WorkspacePipeline,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.PIPELINE_SHOW_DAG,
    () => pipelines.showDag()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.PIPELINE_ADD_PLOT,
    (context: Context) =>
      pipelines.addTopLevelPlot(getDvcRootFromContext(context))
  )
}
