import React from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import {
  ExperimentStatus,
  isQueued
} from 'dvc/src/experiments/webview/contract'
import { RowProp } from './interfaces'
import { RowSelectionContext } from './RowSelectionContext'
import { MessagesMenu } from '../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../shared/components/messagesMenu/MessagesMenuOption'
import { cond } from '../../../util/helpers'

const experimentMenuOption = (
  payload: string | string[],
  label: string,
  type: MessageFromWebviewType,
  hidden?: boolean,
  divider?: boolean
) => {
  return {
    divider,
    hidden,
    id: type,
    label,
    message: {
      payload,
      type
    }
  } as MessagesMenuOptionProps
}

const getMultiSelectMenuOptions = (
  selectedRowsList: RowProp[],
  hasRunningExperiment: boolean
) => {
  const unstarredExperiments = selectedRowsList.filter(
    ({
      row: {
        original: { starred }
      }
    }) => !starred
  )

  const starredExperiments = selectedRowsList.filter(
    ({
      row: {
        original: { starred }
      }
    }) => starred
  )

  const plottedExeperiments = selectedRowsList.filter(
    ({
      row: {
        original: { selected }
      }
    }) => selected
  )

  const selectedIds = selectedRowsList.map(value => value.row.values.id)

  const removableRowIds = selectedRowsList
    .filter(value => value.row.depth === 1)
    .map(value => value.row.values.id)

  const hideRemoveOption =
    removableRowIds.length !== selectedRowsList.length || hasRunningExperiment

  const toggleStarOption = (ids: string[], label: string) =>
    experimentMenuOption(
      ids,
      label,
      MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR,
      ids.length === 0
    )

  return [
    toggleStarOption(
      unstarredExperiments.map(value => value.row.values.id),
      'Star'
    ),
    toggleStarOption(
      starredExperiments.map(value => value.row.values.id),
      'Unstar'
    ),
    experimentMenuOption(
      selectedIds,
      'Plot',
      MessageFromWebviewType.SET_EXPERIMENTS_AND_OPEN_PLOTS,
      false,
      false
    ),
    experimentMenuOption(
      selectedIds,
      'Unplot',
      MessageFromWebviewType.UNSELECT_EXPERIMENTS,
      plottedExeperiments.length === 0,
      false
    ),
    experimentMenuOption(
      removableRowIds,
      'Remove Selected Rows',
      MessageFromWebviewType.REMOVE_EXPERIMENT,
      hideRemoveOption,
      true
    ),
    {
      divider: true,
      id: 'clear-selection',
      keyboardShortcut: 'Esc',
      label: 'Clear row selection'
    }
  ]
}

const getRunResumeOptions = (
  withId: (
    label: string,
    type: MessageFromWebviewType,
    hidden?: boolean,
    divider?: boolean
  ) => MessagesMenuOptionProps,
  projectHasCheckpoints: boolean,
  hideVaryAndRun: boolean,
  depth: number
) => {
  const isCheckpoint = depth > 1

  const resetNeedsSeparator = !hideVaryAndRun && projectHasCheckpoints
  const runNeedsSeparator = !hideVaryAndRun && !projectHasCheckpoints

  return [
    withId(
      'Modify, Reset and Run',
      MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_RESET_AND_RUN,
      isCheckpoint || !projectHasCheckpoints,
      resetNeedsSeparator
    ),
    withId(
      projectHasCheckpoints ? 'Modify and Resume' : 'Modify and Run',
      MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_AND_RUN,
      isCheckpoint,
      runNeedsSeparator
    ),
    withId(
      'Modify and Queue',
      MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_AND_QUEUE,
      isCheckpoint
    )
  ]
}

const getSingleSelectMenuOptions = (
  id: string,
  isWorkspace: boolean,
  projectHasCheckpoints: boolean,
  hasRunningExperiment: boolean,
  depth: number,
  status?: ExperimentStatus,
  starred?: boolean
) => {
  const isNotExperimentOrCheckpoint =
    isQueued(status) || isWorkspace || depth <= 0

  status = isNotExperimentOrCheckpoint ? undefined : status

  const withId = (
    label: string,
    type: MessageFromWebviewType,
    hidden?: boolean,
    divider?: boolean
  ) =>
    experimentMenuOption(
      id,
      label,
      type,
      hidden || hasRunningExperiment,
      divider
    )

  return [
    withId(
      'Apply to Workspace',
      MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE,
      isNotExperimentOrCheckpoint
    ),
    withId(
      'Create new Branch',
      MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT,
      isNotExperimentOrCheckpoint
    ),
    withId(
      'Commit and Share',
      MessageFromWebviewType.SHARE_EXPERIMENT_AS_COMMIT,
      isNotExperimentOrCheckpoint
    ),
    withId(
      'Share as Branch',
      MessageFromWebviewType.SHARE_EXPERIMENT_AS_BRANCH,
      isNotExperimentOrCheckpoint
    ),
    ...getRunResumeOptions(
      withId,
      projectHasCheckpoints,
      isNotExperimentOrCheckpoint,
      depth
    ),
    experimentMenuOption(
      [id],
      starred ? 'Unstar' : 'Star',
      MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR,
      isWorkspace,
      !hasRunningExperiment
    ),
    experimentMenuOption(
      [id],
      'Plot',
      MessageFromWebviewType.SET_EXPERIMENTS_AND_OPEN_PLOTS,
      false,
      false
    ),
    experimentMenuOption(
      [id],
      'Unplot',
      MessageFromWebviewType.UNSELECT_EXPERIMENTS,
      false,
      false
    ),
    withId(
      'Remove',
      MessageFromWebviewType.REMOVE_EXPERIMENT,
      depth !== 1,
      true
    )
  ]
}

const getContextMenuOptions = (
  id: string,
  isWorkspace: boolean,
  projectHasCheckpoints: boolean,
  hasRunningExperiment: boolean,
  depth: number,
  selectedRows: Record<string, RowProp | undefined>,
  status?: ExperimentStatus,
  starred?: boolean
) => {
  const isFromSelection = !!selectedRows[id]
  const selectedRowsList = Object.values(selectedRows).filter(
    value => value !== undefined
  ) as RowProp[]

  return cond(
    isFromSelection && selectedRowsList.length > 1,
    () => getMultiSelectMenuOptions(selectedRowsList, hasRunningExperiment),
    () =>
      getSingleSelectMenuOptions(
        id,
        isWorkspace,
        projectHasCheckpoints,
        hasRunningExperiment,
        depth,
        status,
        starred
      )
  )
}

export const RowContextMenu: React.FC<RowProp> = ({
  hasRunningExperiment = false,
  projectHasCheckpoints = false,
  row: {
    original: { status, starred },
    depth,
    values: { id }
  }
}) => {
  const { selectedRows, clearSelectedRows } =
    React.useContext(RowSelectionContext)

  const isWorkspace = id === 'workspace'

  const contextMenuOptions = React.useMemo(() => {
    return getContextMenuOptions(
      id,
      isWorkspace,
      projectHasCheckpoints,
      hasRunningExperiment,
      depth,
      selectedRows,
      status,
      starred
    )
  }, [
    status,
    starred,
    isWorkspace,
    depth,
    id,
    projectHasCheckpoints,
    selectedRows,
    hasRunningExperiment
  ])

  return (
    (contextMenuOptions.length > 0 && (
      <MessagesMenu
        options={contextMenuOptions}
        onOptionSelected={() => clearSelectedRows?.()}
      />
    )) ||
    null
  )
}
