import { ColumnType, Experiment } from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import React, { useMemo } from 'react'
import { HeaderGroup, Header } from '@tanstack/react-table'
import { useSelector } from 'react-redux'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { MessagesMenu } from '../../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../../shared/components/messagesMenu/MessagesMenuOption'
import { ExperimentsState } from '../../../store'
import { ColumnWithGroup } from '../../../util/buildColumns'

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

const isFromExperimentColumn = (header: Header<Experiment, unknown>) =>
  header.column.id === 'id' || header.column.id.startsWith('id_placeholder')

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
  header: Header<Experiment, unknown>
}

export interface HeaderMenuDescription {
  menuOptions: MessagesMenuOptionProps[]
  sortOptions: MessagesMenuOptionProps[]
  menuEnabled: boolean
}

export const getSortOptions = (
  header: Header<Experiment, unknown>,
  sorts: SortDefinition[]
) => {
  const isNotExperiments = !isFromExperimentColumn(header)
  const isSortable = isNotExperiments && header.column.columns.length <= 1
  const baseColumn =
    header.headerGroup.headers.find(
      h => h.column.id === header.placeholderId
    ) || header.column
  const sort = sorts.find(sort => sort.path === baseColumn.id)

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const sortOrder: SortOrder = possibleOrders[`${sort?.descending}`]

  const sortOptions = isSortable
    ? [
        sortOption(SortOrder.ASCENDING, sortOrder, baseColumn.id),
        sortOption(SortOrder.DESCENDING, sortOrder, baseColumn.id),
        sortOption(SortOrder.NONE, sortOrder, baseColumn.id)
      ]
    : []

  return { isSortable, sortOptions, sortOrder }
}

export type HeaderGroupWithOptionalOriginalId = HeaderGroup<Experiment> & {
  originalId?: string
}

export const getMenuOptions = (
  header: Header<Experiment, unknown>,
  sorts: SortDefinition[]
) => {
  const leafColumn = header.column
  const menuOptions: MessagesMenuOptionProps[] = [
    {
      hidden: isFromExperimentColumn(header),
      id: 'hide-column',
      label: 'Hide Column',
      message: {
        payload: leafColumn.id,
        type: MessageFromWebviewType.HIDE_EXPERIMENTS_TABLE_COLUMN
      }
    },
    {
      hidden:
        (header.column.columnDef as ColumnWithGroup).group !==
        ColumnType.PARAMS,
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

  const { isSortable, sortOptions, sortOrder } = getSortOptions(header, sorts)
  const visibleOptions = menuOptions.filter(option => !option.hidden).length
  const menuEnabled = isSortable || visibleOptions > 0

  return { isSortable, menuEnabled, menuOptions, sortOptions, sortOrder }
}

export const ContextMenuContent: React.FC<HeaderMenuProps> = ({ header }) => {
  const { sorts } = useSelector((state: ExperimentsState) => state.tableData)

  const { menuOptions, sortOptions } = useMemo(() => {
    return getMenuOptions(header, sorts)
  }, [header, sorts])

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
