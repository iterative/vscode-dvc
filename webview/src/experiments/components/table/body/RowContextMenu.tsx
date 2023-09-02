import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  MessageFromWebview,
  MessageFromWebviewType
} from 'dvc/src/webview/contract'
import {
  WORKSPACE_BRANCH,
  ExecutorStatus,
  isQueued,
  isRunning,
  isRunningInQueue
} from 'dvc/src/experiments/webview/contract'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { RowProp } from '../../../util/interfaces'
import { MessagesMenu } from '../../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../../shared/components/messagesMenu/MessagesMenuOption'
import { cond } from '../../../../util/helpers'
import { ExperimentsState } from '../../../store'
import { getCompositeId } from '../../../util/rows'
import {
  SelectedRow,
  clearSelectedRows
} from '../../../state/rowSelectionSlice'

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
    } as MessageFromWebview
  }
}

const collectIdByStarred = (
  starredExperimentIds: string[],
  unstarredExperimentIds: string[],
  starred: boolean | undefined,
  id: string
) => (starred ? starredExperimentIds.push(id) : unstarredExperimentIds.push(id))

const isRunningOrNotExperiment = (
  executorStatus: ExecutorStatus | undefined,
  depth: number,
  hasRunningWorkspaceExperiment: boolean
): boolean =>
  isRunning(executorStatus) || depth !== 1 || hasRunningWorkspaceExperiment

const collectDisabledOptions = (
  selectedRowsList: SelectedRow[],
  hasRunningWorkspaceExperiment: boolean
) => {
  const selectedIds: string[] = []
  const starredExperimentIds: string[] = []
  const unstarredExperimentIds: string[] = []
  let disableExperimentOnlyOption = false
  let disableStopOption = false

  for (const row of selectedRowsList) {
    const { starred, executorStatus, id, depth } = row

    selectedIds.push(id)

    collectIdByStarred(
      starredExperimentIds,
      unstarredExperimentIds,
      starred,
      id
    )

    if (
      isRunningOrNotExperiment(
        executorStatus,
        depth,
        hasRunningWorkspaceExperiment
      )
    ) {
      disableExperimentOnlyOption = true
    }

    if (!isRunning(executorStatus)) {
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
  selectedRowsList: SelectedRow[],
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
  sha: string,
  isWorkspace: boolean,
  projectHasCheckpoints: boolean,
  hasRunningWorkspaceExperiment: boolean,
  depth: number,
  executorStatus?: ExecutorStatus,
  starred?: boolean,
  executor?: string | null
) => {
  const isNotExperiment = isQueued(executorStatus) || isWorkspace || depth <= 0

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
      disabled || hasRunningWorkspaceExperiment || isRunning(executorStatus),
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
      !isRunningInQueue({ executor, executorStatus })
    ),
    disableIfRunningOrWorkspace(
      'Apply to Workspace',
      MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE
    ),
    disableIfRunningOrWorkspace(
      'Create new Branch',
      MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT
    ),
    {
      disabled: isWorkspace,
      id: MessageFromWebviewType.COPY_TO_CLIPBOARD,
      label: 'Copy Sha',
      message: {
        payload: sha,
        type: MessageFromWebviewType.COPY_TO_CLIPBOARD
      } as MessageFromWebview
    },
    {
      disabled: isWorkspace || depth <= 0,
      id: MessageFromWebviewType.COPY_TO_CLIPBOARD,
      label: 'Copy Experiment Name',
      message: {
        payload: id,
        type: MessageFromWebviewType.COPY_TO_CLIPBOARD
      } as MessageFromWebview
    },
    experimentMenuOption(
      [id],
      'Push',
      MessageFromWebviewType.PUSH_EXPERIMENT,
      isNotExperiment ||
        hasRunningWorkspaceExperiment ||
        isRunning(executorStatus),
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
      !isRunning(executorStatus),
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
  sha: string,
  branch: string | undefined | typeof WORKSPACE_BRANCH,
  isWorkspace: boolean,
  projectHasCheckpoints: boolean,
  hasRunningWorkspaceExperiment: boolean,
  depth: number,
  selectedRows: Record<string, SelectedRow | undefined>,
  executorStatus?: ExecutorStatus,
  starred?: boolean,
  executor?: string | null
) => {
  const isFromSelection = !!selectedRows[getCompositeId(id, branch)]
  const selectedRowsList = Object.values(selectedRows).filter(
    value => value !== undefined
  ) as SelectedRow[]

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
        sha,
        isWorkspace,
        projectHasCheckpoints,
        hasRunningWorkspaceExperiment,
        depth,
        executorStatus,
        starred,
        executor
      )
  )
}

export const RowContextMenu: React.FC<RowProp> = ({
  row: {
    original: { branch, executorStatus, starred, id, executor, sha },
    depth
  }
}) => {
  const { selectedRows } = useSelector(
    (state: ExperimentsState) => state.rowSelection
  )
  const {
    hasRunningWorkspaceExperiment,
    hasCheckpoints: projectHasCheckpoints
  } = useSelector((state: ExperimentsState) => state.tableData)
  const dispatch = useDispatch()

  const isWorkspace = id === EXPERIMENT_WORKSPACE_ID

  const contextMenuOptions = useMemo(() => {
    return getContextMenuOptions(
      id,
      sha as string,
      branch,
      isWorkspace,
      projectHasCheckpoints,
      hasRunningWorkspaceExperiment,
      depth,
      selectedRows,
      executorStatus,
      starred,
      executor
    )
  }, [
    branch,
    executor,
    executorStatus,
    starred,
    isWorkspace,
    depth,
    id,
    sha,
    projectHasCheckpoints,
    selectedRows,
    hasRunningWorkspaceExperiment
  ])

  return (
    (contextMenuOptions.length > 0 && (
      <MessagesMenu
        options={contextMenuOptions}
        onOptionSelected={() => dispatch(clearSelectedRows())}
      />
    )) ||
    null
  )
}
