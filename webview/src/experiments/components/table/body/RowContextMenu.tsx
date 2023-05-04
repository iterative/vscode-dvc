import React, { useContext, useMemo } from 'react'
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
  disabled?: boolean,
  divider?: boolean
) => {
  return {
    disabled,
    divider,
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
  const filterStarredUnstarred = (isStarred: boolean) =>
    selectedRowsList.filter(
      ({
        row: {
          original: { starred }
        }
      }) => starred === isStarred
    )

  const unstarredExperiments = filterStarredUnstarred(false)
  const starredExperiments = filterStarredUnstarred(true)

  const selectedIds = selectedRowsList.map(value => value.row.original.id)

  const experimentRowIds = selectedRowsList
    .filter(value => value.row.depth === 1)
    .map(value => value.row.original.id)

  const disableExperimentOnlyOption =
    experimentRowIds.length !== selectedRowsList.length || hasRunningExperiment

  const stoppableRows = selectedRowsList
    .filter(value => isRunning(value.row.original.status))
    .map(value => ({
      executor: value.row.original.executor,
      id: value.row.original.id
    }))

  const disableStopOption = stoppableRows.length !== selectedRowsList.length

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
      disableStopOption,
      true
    ),
    experimentMenuOption(
      experimentRowIds,
      'Push Selected',
      MessageFromWebviewType.PUSH_EXPERIMENT,
      disableExperimentOnlyOption,
      true
    ),
    experimentMenuOption(
      experimentRowIds,
      'Remove Selected',
      MessageFromWebviewType.REMOVE_EXPERIMENT,
      disableExperimentOnlyOption,
      true
    ),
    {
      divider: true,
      id: 'clear-selection',
      keyboardShortcut: 'Esc',
      label: 'Clear'
    }
  ]
}

const getRunResumeOptions = (
  disableIfRunning: (
    label: string,
    type: MessageFromWebviewType,
    disabled?: boolean,
    divider?: boolean
  ) => MessagesMenuOptionProps,
  projectHasCheckpoints: boolean,
  disableVaryAndRun: boolean
) => {
  const resetNeedsSeparator = !disableVaryAndRun && projectHasCheckpoints
  const runNeedsSeparator = !disableVaryAndRun && !projectHasCheckpoints

  const options = []
  if (projectHasCheckpoints) {
    options.push(
      disableIfRunning(
        'Modify and Run',
        MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_RESET_AND_RUN,
        false,
        resetNeedsSeparator
      )
    )
  }

  options.push(
    disableIfRunning(
      projectHasCheckpoints ? 'Modify and Resume' : 'Modify and Run',
      MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_AND_RUN,
      false,
      runNeedsSeparator
    ),
    disableIfRunning(
      'Modify and Queue',
      MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_AND_QUEUE
    )
  )

  return options
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

  const disableIfRunning = (
    label: string,
    type: MessageFromWebviewType,
    disabled?: boolean,
    divider?: boolean
  ) =>
    experimentMenuOption(
      id,
      label,
      type,
      disabled || hasRunningExperiment,
      divider
    )

  const disableIfRunningOrNotExperiment = (
    label: string,
    type: MessageFromWebviewType,
    divider?: boolean
  ) => disableIfRunning(label, type, isNotExperiment, divider)

  return [
    experimentMenuOption(
      id,
      'Show Logs',
      MessageFromWebviewType.SHOW_EXPERIMENT_LOGS,
      !isRunningInQueue({ executor, status })
    ),
    disableIfRunningOrNotExperiment(
      'Apply to Workspace',
      MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE
    ),
    disableIfRunningOrNotExperiment(
      'Create new Branch',
      MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT
    ),
    experimentMenuOption(
      [id],
      'Push',
      MessageFromWebviewType.PUSH_EXPERIMENT,
      isNotExperiment || hasRunningExperiment,
      true
    ),
    ...getRunResumeOptions(
      disableIfRunning,
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
    disableIfRunning(
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
  },
  hideOnClick
}) => {
  const { selectedRows, clearSelectedRows } = useContext(RowSelectionContext)

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
        hideOnClick={hideOnClick}
        options={contextMenuOptions}
        onOptionSelected={() => clearSelectedRows?.()}
      />
    )) ||
    null
  )
}
