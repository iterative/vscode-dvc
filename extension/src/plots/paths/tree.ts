import { join } from 'path'
import { TreeItem, TreeItemCollapsibleState } from 'vscode'
import { EncodingType, isEncodingElement } from './collect'
import {
  BasePathSelectionTree,
  ErrorItem,
  PathSelectionItem
} from '../../path/selection/tree'
import { WorkspacePlots } from '../workspace'
import { ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { EventName } from '../../telemetry/constants'
import { InternalCommands } from '../../commands/internal'
import {
  DecoratableTreeItemScheme,
  getDecoratableUri,
  getCliErrorTreeItem,
  getRootItem,
  isRoot,
  isErrorItem
} from '../../tree'

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

  public getTreeItem(
    element: string | PathSelectionItem | ErrorItem
  ): TreeItem {
    if (isRoot(element)) {
      return getRootItem(element)
    }

    if (isErrorItem(element)) {
      const { path, error } = element
      return getCliErrorTreeItem(path, error, DecoratableTreeItemScheme.PLOTS)
    }

    const { collapsibleState, dvcRoot, path } = element

    const resourceUri = getDecoratableUri(
      join(dvcRoot, path),
      DecoratableTreeItemScheme.PLOTS
    )
    const treeItem = new TreeItem(resourceUri, collapsibleState)

    return this.addTreeItemDetails(element, treeItem)
  }

  protected getRepositoryChildren(dvcRoot: string, path: string | undefined) {
    return this.workspace
      .getRepository(dvcRoot)
      .getChildPaths(path)
      .map(element => {
        if (isErrorItem(element)) {
          return element
        }

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
            path: label,
            tooltip: undefined
          }
        }

        return this.transformElement({ ...element, dvcRoot })
      })
  }

  protected getRepositoryStatuses(dvcRoot: string) {
    return this.workspace.getRepository(dvcRoot).getPathStatuses()
  }
}
