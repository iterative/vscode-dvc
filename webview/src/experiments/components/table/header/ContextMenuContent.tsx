import { ColumnType, Experiment } from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useMemo } from 'react'
import { Header } from '@tanstack/react-table'
import { useSelector } from 'react-redux'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { SortOrder, getSortDetails, isFromExperimentColumn } from './util'
import { MessagesMenu } from '../../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../../shared/components/messagesMenu/MessagesMenuOption'
import { ExperimentsState } from '../../../store'
import { ColumnWithGroup } from '../../../util/buildColumns'

const sortOption = (
  label: SortOrder,
  currentSort: SortOrder,
  columnId: string,
  isSortable: boolean,
  divider?: boolean
) => {
  const sortOrder = currentSort
  const disabled = !isSortable || sortOrder === label
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
    disabled,
    divider,
    id: label,
    label,
    message
  } as MessagesMenuOptionProps
}

interface HeaderMenuProps {
  header: Header<Experiment, unknown>
}

const getMenuOptions = (
  header: Header<Experiment, unknown>,
  sorts: SortDefinition[]
): MessagesMenuOptionProps[] => {
  const leafColumn = header.column
  const { id, isSortable, sortOrder } = getSortDetails(header, sorts)

  return [
    {
      disabled: isFromExperimentColumn(header),
      id: 'hide',
      label: 'Hide',
      message: {
        payload: leafColumn.id,
        type: MessageFromWebviewType.EXPERIMENTS_TABLE_HIDE_COLUMN_PATH
      }
    },
    {
      disabled: isFromExperimentColumn(header),
      id: 'move-to-start',
      label: 'Move to Start',
      message: {
        payload: leafColumn.id,
        type: MessageFromWebviewType.EXPERIMENTS_TABLE_MOVE_TO_START
      }
    },
    {
      disabled:
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
      divider: true,
      id: 'update-header-depth',
      label: 'Set Max Header Height',
      message: {
        type: MessageFromWebviewType.SET_EXPERIMENTS_HEADER_HEIGHT
      }
    },
    {
      id: 'select-columns',
      label: 'Select Columns',
      message: {
        type: MessageFromWebviewType.SELECT_COLUMNS
      }
    },
    {
      id: 'select-first-columns',
      label: 'Select First Columns',
      message: {
        type: MessageFromWebviewType.SELECT_FIRST_COLUMNS
      }
    },
    sortOption(SortOrder.ASCENDING, sortOrder, id, isSortable, true),
    sortOption(SortOrder.DESCENDING, sortOrder, id, isSortable),
    sortOption(SortOrder.NONE, sortOrder, id, isSortable)
  ]
}

export const ContextMenuContent: React.FC<HeaderMenuProps> = ({ header }) => {
  const { sorts } = useSelector((state: ExperimentsState) => state.tableData)

  const menuOptions = useMemo(() => {
    return getMenuOptions(header, sorts)
  }, [header, sorts])

  return <MessagesMenu options={menuOptions} />
}
