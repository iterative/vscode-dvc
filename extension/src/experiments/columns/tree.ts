import { TreeItem } from 'vscode'
import {
  BasePathSelectionTree,
  PathSelectionItem
} from '../../path/selection/tree'
import { WorkspaceExperiments } from '../workspace'
import { ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { EventName } from '../../telemetry/constants'
import { InternalCommands } from '../../commands/internal'
import { getRootItem, isRoot } from '../../tree'

export class ExperimentsColumnsTree extends BasePathSelectionTree<WorkspaceExperiments> {
  constructor(
    experiments: WorkspaceExperiments,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    super(
      experiments,
      resourceLocator,
      'dvc.views.experimentsColumnsTree',
      experiments.columnsChanged.event,
      RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
      EventName.VIEWS_EXPERIMENTS_METRICS_AND_PARAMS_TREE_OPENED
    )

    internalCommands.registerExternalCommand<PathSelectionItem>(
      RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
      ({ dvcRoot, path }) =>
        this.workspace.getRepository(dvcRoot).toggleColumnStatus(path)
    )
  }

  public getTreeItem(element: string | PathSelectionItem): TreeItem {
    if (isRoot(element)) {
      return getRootItem(element)
    }

    const { label, collapsibleState } = element

    const treeItem = new TreeItem(label, collapsibleState)

    return this.addTreeItemDetails(element, treeItem)
  }

  protected getRepositoryChildren(dvcRoot: string, path: string) {
    return this.workspace
      .getRepository(dvcRoot)
      .getChildColumns(path)
      .map(element => this.transformElement({ ...element, dvcRoot }))
  }

  protected getRepositoryStatuses(dvcRoot: string) {
    return this.workspace.getRepository(dvcRoot).getColumnsStatuses()
  }
}
