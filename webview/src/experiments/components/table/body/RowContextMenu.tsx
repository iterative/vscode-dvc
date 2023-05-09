import React, { useContext, useMemo } from 'react'
import { useSelector } from 'react-redux'
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
import { ExperimentsState } from '../../../store'

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

const collectIdByStarred = (
  starredExperimentIds: string[],
  unstarredExperimentIds: string[],
  starred: boolean | undefined,
  id: string
) => (starred ? starredExperimentIds.push(id) : unstarredExperimentIds.push(id))

const isRunningOrNotExperiment = (
  status: ExperimentStatus | undefined,
  depth: number,
  hasRunningWorkspaceExperiment: boolean
): boolean => isRunning(status) || depth !== 1 || hasRunningWorkspaceExperiment

const collectDisabledOptions = (
  selectedRowsList: RowProp[],
  hasRunningWorkspaceExperiment: boolean
) => {
  const selectedIds: string[] = []
  const starredExperimentIds: string[] = []
  const unstarredExperimentIds: string[] = []
  let disableExperimentOnlyOption = false
  let disablePlotOption = false
  let disableStopOption = false

  for (const { row } of selectedRowsList) {
    const { original, depth } = row
    const { starred, status, id } = original

    selectedIds.push(id)

    collectIdByStarred(
      starredExperimentIds,
      unstarredExperimentIds,
      starred,
      id
    )

    if (
      isRunningOrNotExperiment(status, depth, hasRunningWorkspaceExperiment)
    ) {
      disableExperimentOnlyOption = true
    }

    if (isRunning(status)) {
      disablePlotOption = true
      continue
    }
    disableStopOption = true
  }

  return {
    disableExperimentOnlyOption,
    disablePlotOption,
    disableStopOption,
    selectedIds,
    starredExperimentIds,
    unstarredExperimentIds
  }
}

const getMultiSelectMenuOptions = (
  selectedRowsList: RowProp[],
  hasRunningWorkspaceExperiment: boolean
) => {
  const {
    disableExperimentOnlyOption,
    disablePlotOption,
    disableStopOption,
    selectedIds,
    starredExperimentIds,
    unstarredExperimentIds
  } = collectDisabledOptions(selectedRowsList, hasRunningWorkspaceExperiment)

  const toggleStarOption = (ids: string[], label: string) =>
    experimentMenuOption(
      ids,
      label,
      MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR,
      ids.length === 0
    )

  return [
    toggleStarOption(unstarredExperimentIds, 'Star'),
    toggleStarOption(starredExperimentIds, 'Unstar'),
    experimentMenuOption(
      selectedIds,
      'Plot',
      MessageFromWebviewType.SET_EXPERIMENTS_FOR_PLOTS,
      disablePlotOption,
      true
    ),
    experimentMenuOption(
      selectedIds,
      'Plot and Show',
      MessageFromWebviewType.SET_EXPERIMENTS_AND_OPEN_PLOTS,
      disablePlotOption,
      false
    ),
    experimentMenuOption(
      selectedIds,
      'Stop',
      MessageFromWebviewType.STOP_EXPERIMENT,
      disableStopOption,
      true
    ),
    experimentMenuOption(
      selectedIds,
      'Push Selected',
      MessageFromWebviewType.PUSH_EXPERIMENT,
      disableExperimentOnlyOption,
      true
    ),
    experimentMenuOption(
      selectedIds,
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
  hasRunningWorkspaceExperiment: boolean,
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
      disabled || hasRunningWorkspaceExperiment || isRunning(status),
      divider
    )

  const disableIfRunningOrWorkspace = (
    label: string,
    type: MessageFromWebviewType,
    divider?: boolean
  ) => disableIfRunning(label, type, isWorkspace, divider)

  return [
    experimentMenuOption(
      id,
      'Show Logs',
      MessageFromWebviewType.SHOW_EXPERIMENT_LOGS,
      !isRunningInQueue({ executor, status })
    ),
    disableIfRunningOrWorkspace(
      'Apply to Workspace',
      MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE
    ),
    disableIfRunningOrWorkspace(
      'Create new Branch',
      MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT
    ),
    experimentMenuOption(
      [id],
      'Push',
      MessageFromWebviewType.PUSH_EXPERIMENT,
      isNotExperiment || hasRunningWorkspaceExperiment || isRunning(status),
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
      !hasRunningWorkspaceExperiment
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
  hasRunningWorkspaceExperiment: boolean,
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
    () =>
      getMultiSelectMenuOptions(
        selectedRowsList,
        hasRunningWorkspaceExperiment
      ),
    () =>
      getSingleSelectMenuOptions(
        id,
        isWorkspace,
        projectHasCheckpoints,
        hasRunningWorkspaceExperiment,
        depth,
        status,
        starred,
        executor
      )
  )
}

export const RowContextMenu: React.FC<RowProp> = ({
  row: {
    original: { status, starred, id, executor },
    depth
  }
}) => {
  const { selectedRows, clearSelectedRows } = useContext(RowSelectionContext)
  const {
    hasRunningWorkspaceExperiment,
    hasCheckpoints: projectHasCheckpoints
  } = useSelector((state: ExperimentsState) => state.tableData)

  const isWorkspace = id === EXPERIMENT_WORKSPACE_ID

  const contextMenuOptions = useMemo(() => {
    return getContextMenuOptions(
      id,
      isWorkspace,
      projectHasCheckpoints,
      hasRunningWorkspaceExperiment,
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
    hasRunningWorkspaceExperiment
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
