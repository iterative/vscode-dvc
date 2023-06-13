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
import { getCompositeId } from '../../../util/rows'

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

    if (!isRunning(status)) {
      disableStopOption = true
    }
  }

  return {
    disableExperimentOnlyOption,
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
    disableStopOption,
    selectedIds,
    starredExperimentIds,
    unstarredExperimentIds
  } = collectDisabledOptions(selectedRowsList, hasRunningWorkspaceExperiment)

  const toggleStarOption = (ids: string[], label: string) => {
    return experimentMenuOption(
      [...new Set(ids)],
      label,
      MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR,
      ids.length === 0
    )
  }

  const ids = [...new Set(selectedIds)]

  return [
    toggleStarOption(unstarredExperimentIds, 'Star'),
    toggleStarOption(starredExperimentIds, 'Unstar'),
    experimentMenuOption(
      ids,
      'Plot',
      MessageFromWebviewType.SET_EXPERIMENTS_FOR_PLOTS,
      false,
      true
    ),
    experimentMenuOption(
      ids,
      'Plot and Show',
      MessageFromWebviewType.SET_EXPERIMENTS_AND_OPEN_PLOTS,
      false,
      false
    ),
    experimentMenuOption(
      ids,
      'Stop',
      MessageFromWebviewType.STOP_EXPERIMENTS,
      disableStopOption,
      true
    ),
    experimentMenuOption(
      ids,
      'Push Selected',
      MessageFromWebviewType.PUSH_EXPERIMENT,
      disableExperimentOnlyOption,
      true
    ),
    experimentMenuOption(
      ids,
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
  disableIfRunningOrNotWorkspace: (
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
      disableIfRunningOrNotWorkspace(
        'Modify and Run',
        MessageFromWebviewType.MODIFY_WORKSPACE_PARAMS_RESET_AND_RUN,
        false,
        resetNeedsSeparator
      )
    )
  }

  options.push(
    disableIfRunningOrNotWorkspace(
      projectHasCheckpoints ? 'Modify and Resume' : 'Modify and Run',
      MessageFromWebviewType.MODIFY_WORKSPACE_PARAMS_AND_RUN,
      false,
      runNeedsSeparator
    ),
    disableIfRunningOrNotWorkspace(
      'Modify and Queue',
      MessageFromWebviewType.MODIFY_WORKSPACE_PARAMS_AND_QUEUE
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

  const disableIfRunningOrNotWorkspace = (
    label: string,
    type: MessageFromWebviewType,
    divider?: boolean
  ) => disableIfRunning(label, type, !isWorkspace, divider)

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
      disableIfRunningOrNotWorkspace,
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
      [id],
      'Stop',
      MessageFromWebviewType.STOP_EXPERIMENTS,
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
  branch: string | undefined,
  isWorkspace: boolean,
  projectHasCheckpoints: boolean,
  hasRunningWorkspaceExperiment: boolean,
  depth: number,
  selectedRows: Record<string, RowProp | undefined>,
  status?: ExperimentStatus,
  starred?: boolean,
  executor?: string | null
) => {
  const isFromSelection = !!selectedRows[getCompositeId(id, branch)]
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
    original: { branch, status, starred, id, executor },
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
      branch,
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
    branch,
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
