import { ColumnType, Experiment } from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import React from 'react'
import { HeaderGroup } from 'react-table'
import { useSelector } from 'react-redux'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { MessagesMenu } from '../../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../../shared/components/messagesMenu/MessagesMenuOption'
import { ExperimentsState } from '../../../store'

export enum SortOrder {
  ASCENDING = 'Sort Ascending',
  DESCENDING = 'Sort Descending',
  NONE = 'Remove Sort'
}

const possibleOrders = {
  false: SortOrder.ASCENDING,
  true: SortOrder.DESCENDING,
  undefined: SortOrder.NONE
} as const

const isFromExperimentColumn = (column: HeaderGroup<Experiment>) => {
  return column.id === 'id' || column.id.startsWith('id_placeholder')
}

export const sortOption = (
  label: SortOrder,
  currentSort: SortOrder,
  columnId: string
) => {
  const sortOrder = currentSort
  const hidden = sortOrder === label
  const descending = label === SortOrder.DESCENDING
  const path = columnId
  const removeSortMessage = {
    payload: columnId,
    type: MessageFromWebviewType.REMOVE_COLUMN_SORT
  }
  const payload = {
    descending,
    path
  }
  const message =
    label === SortOrder.NONE
      ? removeSortMessage
      : {
          payload,
          type: MessageFromWebviewType.SORT_COLUMN
        }

  return {
    hidden,
    id: label,
    label,
    message
  } as MessagesMenuOptionProps
}

export interface HeaderMenuProps {
  column: HeaderGroup<Experiment> & { originalId?: string }
}

export interface HeaderMenuDescription {
  menuOptions: MessagesMenuOptionProps[]
  sortOptions: MessagesMenuOptionProps[]
  menuEnabled: boolean
}

export const getSortOptions = (
  column: HeaderGroup<Experiment> & { originalId?: string },
  sorts: SortDefinition[]
) => {
  const isNotExperiments = !isFromExperimentColumn(column)
  const isSortable =
    isNotExperiments && (!column.columns || column.columns?.length === 1)

  const baseColumn = column.placeholderOf || column
  const sort = sorts.find(sort => sort.path === baseColumn.id)

  const sortOrder: SortOrder = possibleOrders[`${sort?.descending}`]

  const sortOptions = isSortable
    ? [
        sortOption(SortOrder.ASCENDING, sortOrder, column.id),
        sortOption(SortOrder.DESCENDING, sortOrder, column.id),
        sortOption(SortOrder.NONE, sortOrder, column.id)
      ]
    : []

  return { isSortable, sortOptions, sortOrder }
}

export type HeaderGroupWithOptionalOriginalId = HeaderGroup<Experiment> & {
  originalId?: string
}

export const getMenuOptions = (
  column: HeaderGroupWithOptionalOriginalId,
  sorts: SortDefinition[]
) => {
  let leafColumn: HeaderGroupWithOptionalOriginalId = column

  while (leafColumn?.placeholderOf) {
    leafColumn = leafColumn.placeholderOf as HeaderGroupWithOptionalOriginalId
  }

  const menuOptions: MessagesMenuOptionProps[] = [
    {
      hidden: isFromExperimentColumn(column),
      id: 'hide-column',
      label: 'Hide Column',
      message: {
        payload: leafColumn.originalId || leafColumn.id,
        type: MessageFromWebviewType.HIDE_EXPERIMENTS_TABLE_COLUMN
      }
    },
    {
      hidden: column.group !== ColumnType.PARAMS,
      id: 'open-to-the-side',
      label: 'Open to the Side',
      message: {
        payload: leafColumn.id,
        type: MessageFromWebviewType.OPEN_PARAMS_FILE_TO_THE_SIDE
      }
    },
    {
      id: 'update-header-depth',
      label: 'Set Max Header Height',
      message: {
        type: MessageFromWebviewType.SET_EXPERIMENTS_HEADER_HEIGHT
      }
    }
  ]

  const { isSortable, sortOptions, sortOrder } = getSortOptions(column, sorts)

  const visibleOptions: number = menuOptions.filter(
    option => !option.hidden
  ).length

  const menuEnabled = isSortable || visibleOptions > 0

  return { isSortable, menuEnabled, menuOptions, sortOptions, sortOrder }
}

export const ContextMenuContent: React.FC<HeaderMenuProps> = ({ column }) => {
  const { sorts } = useSelector((state: ExperimentsState) => state.tableData)

  const { menuOptions, sortOptions } = React.useMemo(() => {
    return getMenuOptions(column, sorts)
  }, [column, sorts])

  return (
    <div>
      <MessagesMenu options={menuOptions} />
      {sortOptions.length > 0 && (
        <>
          <VSCodeDivider />
          <MessagesMenu options={sortOptions} />
        </>
      )}
    </div>
  )
}
