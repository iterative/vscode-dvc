import { Disposable } from '@hediet/std/disposable'
import { TreeItemCollapsibleState } from 'vscode'
import { BasePathSelectionTree } from '../../path/selection/tree'
import { WorkspacePlots } from '../workspace'
import { Resource, ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { EventName } from '../../telemetry/constants'
import { InternalCommands } from '../../commands/internal'

type PlotPathItem = {
  description: string | undefined
  dvcRoot: string
  collapsibleState: TreeItemCollapsibleState
  label: string
  path: string
  iconPath: Resource
}

export class PlotsPathsTree extends BasePathSelectionTree<
  PlotPathItem,
  WorkspacePlots
> {
  public readonly dispose = Disposable.fn()

  constructor(
    plots: WorkspacePlots,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    super(
      plots,
      resourceLocator,
      'dvc.views.plotsPathsTree',
      plots.pathsChanged.event,
      RegisteredCommands.PLOTS_PATH_TOGGLE,
      EventName.VIEWS_PLOTS_PATH_TREE_OPENED
    )

    internalCommands.registerExternalCommand<PlotPathItem>(
      RegisteredCommands.PLOTS_PATH_TOGGLE,
      ({ dvcRoot, path }) =>
        this.workspace.getRepository(dvcRoot).togglePathStatus(path)
    )
  }

  public getRepositoryChildren(dvcRoot: string, path: string) {
    return this.workspace.getRepository(dvcRoot).getChildPaths(path)
  }

  public getRepositoryStatuses(dvcRoot: string) {
    return this.workspace.getRepository(dvcRoot).getPathStatuses()
  }
}
