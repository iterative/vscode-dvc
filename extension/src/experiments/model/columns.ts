import { ColumnData } from '../webview/contract'
import { flatten } from '../../util/array'

export enum ColumnStatus {
  selected = 2,
  indeterminate = 1,
  unselected = 0
}

export class Columns {
  private status: Record<string, ColumnStatus> = {}

  private data: ColumnData[] = []

  public getSelected() {
    return (
      this.data.filter(
        column => this.status[column.path] !== ColumnStatus.unselected
      ) || []
    )
  }

  update(columns: ColumnData[]) {
    columns.forEach(column => {
      if (this.status[column.path] === undefined) {
        this.status[column.path] = ColumnStatus.selected
      }
    })

    this.data = columns
  }

  public getColumns() {
    return this.data
  }

  public getTerminalNodeColumns() {
    return this.data.filter(column => !column.hasChildren)
  }

  public getColumn(path: string) {
    const column = this.data?.find(column => column.path === path)
    if (column) {
      return {
        ...column,
        descendantMetadata: this.getDescendantMetaData(column),
        status: this.status[column.path]
      }
    }
  }

  public getChildColumns(path: string) {
    return this.data?.filter(column =>
      path
        ? column.parentPath === path
        : ['metrics', 'params'].includes(column.parentPath)
    )
  }

  public toggleColumnStatus(path: string) {
    const status = this.getNextStatus(path)
    this.status[path] = status
    this.setAreParentsSelected(path)
    this.setAreChildrenSelected(path, status)

    return this.status[path]
  }

  private setAreChildrenSelected(path: string, status: ColumnStatus) {
    return this.getChildColumns(path)?.map(column => {
      const path = column.path
      this.status[path] = status
      this.setAreChildrenSelected(path, status)
    })
  }

  private setAreParentsSelected(path: string) {
    const changedColumn = this.getColumn(path)
    if (!changedColumn) {
      return
    }
    const parent = this.getColumn(changedColumn.parentPath)
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

    const isAnyChildSelected = statuses.includes(ColumnStatus.selected)
    const isAnyChildUnselected = statuses.includes(ColumnStatus.unselected)

    if (isAnyChildSelected && isAnyChildUnselected) {
      return ColumnStatus.indeterminate
    }

    if (!isAnyChildUnselected) {
      return ColumnStatus.selected
    }

    return ColumnStatus.unselected
  }

  private getDescendantsStatuses(parentPath: string): ColumnStatus[] {
    const nestedStatuses = (this.getChildColumns(parentPath) || []).map(
      column => {
        const descendantsStatuses = column.hasChildren
          ? this.getDescendantsStatuses(column.path)
          : []
        return [this.status[column.path], ...descendantsStatuses]
      }
    )

    return flatten<ColumnStatus>(nestedStatuses)
  }

  private getNextStatus(path: string) {
    const status = this.status[path]
    if (status === ColumnStatus.selected) {
      return ColumnStatus.unselected
    }
    return ColumnStatus.selected
  }

  private getDescendantMetaData(column: ColumnData) {
    if (!column.hasChildren) {
      return
    }
    const statuses = this.getDescendantsStatuses(column.path)
    return `${
      statuses.filter(status =>
        [ColumnStatus.selected, ColumnStatus.indeterminate].includes(status)
      ).length
    }/${statuses.length}`
  }
}
