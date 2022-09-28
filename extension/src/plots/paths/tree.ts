import { TreeItemCollapsibleState } from 'vscode'
import { EncodingType, isEncodingElement } from './collect'
import {
  BasePathSelectionTree,
  PathSelectionItem
} from '../../path/selection/tree'
import { WorkspacePlots } from '../workspace'
import { ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { EventName } from '../../telemetry/constants'
import { InternalCommands } from '../../commands/internal'

export class PlotsPathsTree extends BasePathSelectionTree<WorkspacePlots> {
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

    internalCommands.registerExternalCommand<PathSelectionItem>(
      RegisteredCommands.PLOTS_PATH_TOGGLE,
      ({ dvcRoot, path }) =>
        this.workspace.getRepository(dvcRoot).togglePathStatus(path)
    )
  }

  public getRepositoryChildren(dvcRoot: string, path: string | undefined) {
    return this.workspace
      .getRepository(dvcRoot)
      .getChildPaths(path)
      .map(element => {
        if (isEncodingElement(element)) {
          const { label, type, value } = element
          return {
            collapsibleState: TreeItemCollapsibleState.None,
            description: undefined,
            dvcRoot,
            iconPath:
              type === EncodingType.STROKE_DASH
                ? this.resourceLocator.getPlotsStrokeDashResource(value)
                : this.resourceLocator.getPlotsShapeResource(value),
            label,
            path: label
          }
        }

        return this.transformElement({ ...element, dvcRoot })
      })
  }

  public getRepositoryStatuses(dvcRoot: string) {
    return this.workspace.getRepository(dvcRoot).getPathStatuses()
  }
}
