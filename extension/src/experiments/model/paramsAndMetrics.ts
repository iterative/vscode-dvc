import { ParamOrMetric } from '../webview/contract'
import { flatten } from '../../util/array'

export enum Status {
  selected = 2,
  indeterminate = 1,
  unselected = 0
}

export class ParamsAndMetrics {
  private status: Record<string, Status> = {}

  private data: ParamOrMetric[] = []

  public getSelected() {
    return (
      this.data.filter(
        paramOrMetric => this.status[paramOrMetric.path] !== Status.unselected
      ) || []
    )
  }

  public update(paramsAndMetrics: ParamOrMetric[]) {
    paramsAndMetrics.forEach(paramOrMetric => {
      if (this.status[paramOrMetric.path] === undefined) {
        this.status[paramOrMetric.path] = Status.selected
      }
    })

    this.data = paramsAndMetrics
  }

  public getParamsAndMetrics() {
    return this.data
  }

  public getTerminalNodes() {
    return this.data.filter(paramOrMetric => !paramOrMetric.hasChildren)
  }

  public getParamOrMetric(path: string) {
    const paramOrMetric = this.data?.find(
      paramOrMetric => paramOrMetric.path === path
    )
    if (paramOrMetric) {
      return {
        ...paramOrMetric,
        descendantStatuses: this.getDescendantsStatuses(paramOrMetric.path),
        status: this.status[paramOrMetric.path]
      }
    }
  }

  public getChildren(path: string) {
    return this.data?.filter(paramOrMetric =>
      path
        ? paramOrMetric.parentPath === path
        : ['metrics', 'params'].includes(paramOrMetric.parentPath)
    )
  }

  public toggleStatus(path: string) {
    const status = this.getNextStatus(path)
    this.status[path] = status
    this.setAreParentsSelected(path)
    this.setAreChildrenSelected(path, status)

    return this.status[path]
  }

  public getTerminalNodeStatuses() {
    const terminalNodes = this.getTerminalNodes()
    return terminalNodes
      .map(paramOrMetric => this.status[paramOrMetric.path])
      .filter(paramOrMetric => paramOrMetric !== undefined)
  }

  private setAreChildrenSelected(path: string, status: Status) {
    return this.getChildren(path)?.map(paramOrMetric => {
      const path = paramOrMetric.path
      this.status[path] = status
      this.setAreChildrenSelected(path, status)
    })
  }

  private setAreParentsSelected(path: string) {
    const changed = this.getParamOrMetric(path)
    if (!changed) {
      return
    }
    const parent = this.getParamOrMetric(changed.parentPath)
    if (!parent) {
      return
    }

    const parentPath = parent.path

    const status = this.getStatus(parentPath)
    this.status[parentPath] = status
    this.setAreParentsSelected(parentPath)
  }

  private getStatus(parentPath: string) {
    const statuses = this.getDescendantsStatuses(parentPath)

    const isAnyChildSelected = statuses.includes(Status.selected)
    const isAnyChildUnselected = statuses.includes(Status.unselected)

    if (isAnyChildSelected && isAnyChildUnselected) {
      return Status.indeterminate
    }

    if (!isAnyChildUnselected) {
      return Status.selected
    }

    return Status.unselected
  }

  private getDescendantsStatuses(parentPath: string): Status[] {
    const nestedStatuses = (this.getChildren(parentPath) || []).map(
      paramOrMetric => {
        const descendantsStatuses = paramOrMetric.hasChildren
          ? this.getDescendantsStatuses(paramOrMetric.path)
          : []
        return [this.status[paramOrMetric.path], ...descendantsStatuses]
      }
    )

    return flatten<Status>(nestedStatuses)
  }

  private getNextStatus(path: string) {
    const status = this.status[path]
    if (status === Status.selected) {
      return Status.unselected
    }
    return Status.selected
  }
}
