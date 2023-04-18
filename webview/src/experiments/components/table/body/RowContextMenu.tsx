import React, { useMemo } from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import {
  ExperimentStatus,
  isQueued,
  isRunning,
  isRunningInQueue
} from 'dvc/src/experiments/webview/contract'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { RowProp } from '../../../util/interfaces'
import { RowSelectionContext } from '../RowSelectionContext'
import { MessagesMenu } from '../../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../../shared/components/messagesMenu/MessagesMenuOption'
import { cond } from '../../../../util/helpers'

const experimentMenuOption = (
  payload: string | string[] | { id: string; executor?: string | null }[],
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

  const selectedIds = selectedRowsList.map(value => value.row.original.id)

  const removableRowIds = selectedRowsList
    .filter(value => value.row.depth === 1)
    .map(value => value.row.original.id)

  const hideRemoveOption =
    removableRowIds.length !== selectedRowsList.length || hasRunningExperiment

  const stoppableRows = selectedRowsList
    .filter(value => isRunning(value.row.original.status))
    .map(value => ({
      executor: value.row.original.executor,
      id: value.row.original.id
    }))

  const hideStopOption = stoppableRows.length !== selectedRowsList.length

  const toggleStarOption = (ids: string[], label: string) =>
    experimentMenuOption(
      ids,
      label,
      MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR,
      ids.length === 0
    )

  return [
    toggleStarOption(
      unstarredExperiments.map(value => value.row.original.id),
      'Star'
    ),
    toggleStarOption(
      starredExperiments.map(value => value.row.original.id),
      'Unstar'
    ),
    experimentMenuOption(
      selectedIds,
      'Plot',
      MessageFromWebviewType.SET_EXPERIMENTS_FOR_PLOTS,
      false,
      true
    ),
    experimentMenuOption(
      selectedIds,
      'Plot and Show',
      MessageFromWebviewType.SET_EXPERIMENTS_AND_OPEN_PLOTS,
      false,
      false
    ),
    experimentMenuOption(
      stoppableRows,
      'Stop',
      MessageFromWebviewType.STOP_EXPERIMENT,
      hideStopOption,
      true
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
  hideIfRunning: (
    label: string,
    type: MessageFromWebviewType,
    hidden?: boolean,
    divider?: boolean
  ) => MessagesMenuOptionProps,
  projectHasCheckpoints: boolean,
  hideVaryAndRun: boolean
) => {
  const resetNeedsSeparator = !hideVaryAndRun && projectHasCheckpoints
  const runNeedsSeparator = !hideVaryAndRun && !projectHasCheckpoints

  return [
    hideIfRunning(
      'Modify and Run',
      MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_RESET_AND_RUN,
      !projectHasCheckpoints,
      resetNeedsSeparator
    ),
    hideIfRunning(
      projectHasCheckpoints ? 'Modify and Resume' : 'Modify and Run',
      MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_AND_RUN,
      false,
      runNeedsSeparator
    ),
    hideIfRunning(
      'Modify and Queue',
      MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_AND_QUEUE
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
  starred?: boolean,
  executor?: string | null
) => {
  const isNotExperiment = isQueued(status) || isWorkspace || depth <= 0

  const hideIfRunning = (
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

  const hideIfRunningOrNotExperiment = (
    label: string,
    type: MessageFromWebviewType,
    divider?: boolean
  ) => hideIfRunning(label, type, isNotExperiment, divider)

  return [
    experimentMenuOption(
      id,
      'Show Logs',
      MessageFromWebviewType.SHOW_EXPERIMENT_LOGS,
      !isRunningInQueue({ executor, status })
    ),
    hideIfRunningOrNotExperiment(
      'Apply to Workspace',
      MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE
    ),
    hideIfRunningOrNotExperiment(
      'Create new Branch',
      MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT
    ),
    hideIfRunningOrNotExperiment(
      'Share to Studio',
      MessageFromWebviewType.SHARE_EXPERIMENT_TO_STUDIO,
      true
    ),
    hideIfRunningOrNotExperiment(
      'Commit and Share',
      MessageFromWebviewType.SHARE_EXPERIMENT_AS_COMMIT
    ),
    hideIfRunningOrNotExperiment(
      'Share as Branch',
      MessageFromWebviewType.SHARE_EXPERIMENT_AS_BRANCH
    ),
    ...getRunResumeOptions(
      hideIfRunning,
      projectHasCheckpoints,
      isNotExperiment
    ),
    experimentMenuOption(
      [id],
      starred ? 'Unstar' : 'Star',
      MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR,
      isWorkspace,
      !hasRunningExperiment
    ),
    experimentMenuOption(
      [{ executor, id }],
      'Stop',
      MessageFromWebviewType.STOP_EXPERIMENT,
      !isRunning(status),
      id !== EXPERIMENT_WORKSPACE_ID
    ),
    hideIfRunning(
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
  starred?: boolean,
  executor?: string | null
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
        starred,
        executor
      )
  )
}

export const RowContextMenu: React.FC<RowProp> = ({
  hasRunningExperiment = false,
  projectHasCheckpoints = false,
  row: {
    original: { status, starred, id, executor },
    depth
  }
}) => {
  const { selectedRows, clearSelectedRows } =
    React.useContext(RowSelectionContext)

  const isWorkspace = id === EXPERIMENT_WORKSPACE_ID

  const contextMenuOptions = useMemo(() => {
    return getContextMenuOptions(
      id,
      isWorkspace,
      projectHasCheckpoints,
      hasRunningExperiment,
      depth,
      selectedRows,
      status,
      starred,
      executor
    )
  }, [
    executor,
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
