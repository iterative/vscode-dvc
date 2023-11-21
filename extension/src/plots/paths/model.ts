import { Memento } from 'vscode'
import {
  collectPathErrorsTable,
  collectPaths,
  collectTemplateOrder,
  PathType,
  PlotPath,
  TemplateOrder
} from './collect'
import { PathSelectionModel, Status } from '../../path/selection/model'
import { PersistenceKey } from '../../persistence/constants'
import {
  definedAndNonEmpty,
  performSimpleOrderedUpdate
} from '../../util/array'
import { MultiSourceEncoding } from '../multiSource/collect'
import { isDvcError } from '../../cli/dvc/reader'
import { PlotsOutputOrError } from '../../cli/dvc/contract'
import { getErrorTooltip } from '../../tree'
import { ErrorsModel } from '../errors/model'

export class PathsModel extends PathSelectionModel<PlotPath> {
  private readonly errors: ErrorsModel

  private templateOrder: TemplateOrder
  private comparisonPathsOrder: string[]

  private selectedRevisions: string[] = []

  private hasCustomSelection: boolean | undefined = undefined

  constructor(dvcRoot: string, errors: ErrorsModel, workspaceState: Memento) {
    super(dvcRoot, workspaceState, PersistenceKey.PLOT_PATH_STATUS)

    this.errors = errors

    this.templateOrder = this.revive(PersistenceKey.PLOT_TEMPLATE_ORDER, [])
    this.comparisonPathsOrder = this.revive(
      PersistenceKey.PLOT_COMPARISON_PATHS_ORDER,
      []
    )

    this.hasCustomSelection = this.revive(
      PersistenceKey.PLOTS_HAS_CUSTOM_SELECTION,
      undefined
    )
  }

  public setSelectedRevisions(selectedRevisions: string[]) {
    this.selectedRevisions = selectedRevisions
  }

  public transformAndSet(output: PlotsOutputOrError, revs: string[]) {
    if (isDvcError(output)) {
      this.handleCliError()
    } else {
      const paths = collectPaths(this.data, output, revs)

      this.setNewStatuses(paths)
      this.data = paths
      this.setTemplateOrder()
    }

    this.deferred.resolve()
  }

  public setTemplateOrder(templateOrder?: TemplateOrder) {
    const filter = (type: PathType, plotPath: PlotPath) =>
      !!plotPath.type?.has(type) && this.hasRevisions(plotPath)

    this.templateOrder = collectTemplateOrder(
      this.getPathsByType(PathType.TEMPLATE_SINGLE, filter),
      this.getPathsByType(PathType.TEMPLATE_MULTI, filter),
      templateOrder || this.templateOrder
    )

    this.persist(PersistenceKey.PLOT_TEMPLATE_ORDER, this.templateOrder)
  }

  public getChildren(
    path: string | undefined,
    multiSourceEncoding: MultiSourceEncoding = {}
  ) {
    if (this.errors.hasCliError()) {
      return [
        this.errors.getCliError() as {
          error: string
          path: string
        }
      ]
    }

    return this.filterChildren(path)
      .map(element => ({
        ...element,
        descendantStatuses: this.getTerminalNodeStatuses(element.path),
        hasChildren: this.getHasChildren(element, multiSourceEncoding),
        status: this.status[element.path],
        tooltip: this.getTooltip(element.path)
      }))
      .sort(({ path: aPath }, { path: bPath }) => aPath.localeCompare(bPath))
  }

  public getTerminalNodes(): (PlotPath & { selected: boolean })[] {
    return this.data
      .filter(element => !element.hasChildren && this.hasRevisions(element))
      .map(element => ({ ...element, selected: !!this.status[element.path] }))
  }

  public getHasUnselectedPlots() {
    const revisionPaths = this.data.filter(element =>
      this.hasRevisions(element)
    )

    if (!definedAndNonEmpty(revisionPaths)) {
      return false
    }

    for (const { path } of revisionPaths) {
      if (this.status[path] === Status.UNSELECTED) {
        return true
      }
    }
    return false
  }

  public getTemplateOrder(): TemplateOrder {
    return collectTemplateOrder(
      this.getPathsByType(PathType.TEMPLATE_SINGLE),
      this.getPathsByType(PathType.TEMPLATE_MULTI),
      this.templateOrder
    )
  }

  public getComparisonPaths() {
    return performSimpleOrderedUpdate(
      this.comparisonPathsOrder,
      this.getPathsByType(PathType.COMPARISON)
    )
  }

  public setComparisonPathsOrder(order: string[]) {
    this.comparisonPathsOrder = order
    this.persist(
      PersistenceKey.PLOT_COMPARISON_PATHS_ORDER,
      this.comparisonPathsOrder
    )
  }

  public hasPaths() {
    return this.data.length > 0
  }

  public setHasCustomSelection(hasCustomSelection: boolean) {
    this.hasCustomSelection = hasCustomSelection
    this.persist(
      PersistenceKey.PLOTS_HAS_CUSTOM_SELECTION,
      this.hasCustomSelection
    )
  }

  public checkIfHasPreviousCustomSelection() {
    if (this.hasCustomSelection === undefined) {
      const statuses = this.getTerminalNodeStatuses()
      const plotsLength = statuses.length

      const hasCustomSelection =
        plotsLength > 20
          ? plotsLength -
              statuses.filter(nodeStatus => nodeStatus !== Status.SELECTED)
                .length !==
            20
          : false
      this.setHasCustomSelection(hasCustomSelection)
    }
  }

  private handleCliError() {
    this.data = []
  }

  private getPathsByType(
    type: PathType,
    filter = (type: PathType, plotPath: PlotPath) =>
      !!(
        plotPath.type?.has(type) &&
        this.status[plotPath.path] &&
        this.hasRevisions(plotPath)
      )
  ) {
    return this.data
      .filter(plotPath => filter(type, plotPath))
      .map(({ path }) => path)
  }

  private filterChildren(path: string | undefined): PlotPath[] {
    return this.data.filter(element => {
      if (!this.hasRevisions(element)) {
        return false
      }

      if (!path) {
        return !element.parentPath
      }
      return element.parentPath === path
    })
  }

  private getHasChildren(
    element: PlotPath,
    multiSourceEncoding: MultiSourceEncoding
  ) {
    const hasEncodingChildren =
      !element.hasChildren &&
      !element.type?.has(PathType.TEMPLATE_MULTI) &&
      !!multiSourceEncoding[element.path]

    if (hasEncodingChildren) {
      return true
    }

    return element.hasChildren
  }

  private hasRevisions({ revisions }: PlotPath) {
    return this.selectedRevisions.some(revision => revisions.has(revision))
  }

  private getTooltip(path: string) {
    const errors = this.errors.getPathErrors(path, this.selectedRevisions)

    if (!errors?.length) {
      return
    }

    const error = collectPathErrorsTable(errors)
    return error ? getErrorTooltip(error) : undefined
  }
}
