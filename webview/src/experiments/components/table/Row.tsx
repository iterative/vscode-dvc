import React from 'react'
import cx from 'classnames'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { RowProp, WithChanges } from './interfaces'
import styles from './styles.module.scss'
import { FirstCell, CellWrapper } from './Cell'
import { RowSelectionContext } from './RowSelectionContext'
import { sendMessage } from '../../../shared/vscode'
import { ContextMenu } from '../../../shared/components/contextMenu/ContextMenu'
import { MessagesMenu } from '../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../shared/components/messagesMenu/MessagesMenuOption'
import { HandlerFunc } from '../../../util/props'
import { cond } from '../../../util/helpers'

const getExperimentTypeClass = ({ running, queued, selected }: Experiment) => {
  if (running) {
    return styles.runningExperiment
  }
  if (queued) {
    return styles.queuedExperiment
  }
  if (selected === false) {
    return styles.unselectedExperiment
  }

  return styles.normalExperiment
}

const experimentMenuOption = (
  id: string | string[],
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
      payload: id,
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
      'Star Experiments'
    ),
    toggleStarOption(
      starredExperiments.map(value => value.row.values.id),
      'Unstar Experiments'
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
  isWorkspace: boolean,
  projectHasCheckpoints: boolean,
  hideVaryAndRun: boolean,
  depth: number
) => {
  const isNotCheckpoint = depth <= 1 || isWorkspace

  return [
    withId(
      projectHasCheckpoints ? 'Modify and Resume' : 'Modify and Run',
      MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_AND_RUN,
      !isNotCheckpoint,
      !hideVaryAndRun
    ),
    withId(
      'Modify, Reset and Run',
      MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_RESET_AND_RUN,
      !isNotCheckpoint || !projectHasCheckpoints
    ),
    withId(
      'Modify and Queue',
      MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_AND_QUEUE,
      !isNotCheckpoint
    )
  ]
}

const getSingleSelectMenuOptions = (
  id: string,
  isWorkspace: boolean,
  projectHasCheckpoints: boolean,
  hasRunningExperiment: boolean,
  depth: number,
  queued?: boolean,
  starred?: boolean
) => {
  const hideApplyAndCreateBranch = queued || isWorkspace || depth <= 0

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
      hideApplyAndCreateBranch
    ),
    withId(
      'Create new Branch',
      MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT,
      hideApplyAndCreateBranch
    ),
    ...getRunResumeOptions(
      withId,
      isWorkspace,
      projectHasCheckpoints,
      hideApplyAndCreateBranch,
      depth
    ),
    experimentMenuOption(
      [id],
      starred ? 'Unstar Experiment' : 'Star Experiment',
      MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR,
      isWorkspace,
      !hasRunningExperiment
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
  queued?: boolean,
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
        queued,
        starred
      )
  )
}

export const RowContextMenu: React.FC<RowProp> = ({
  hasRunningExperiment = false,
  projectHasCheckpoints = false,
  row: {
    original: { queued, starred },
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
      queued,
      starred
    )
  }, [
    queued,
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

const getRowClassNames = (
  original: Experiment,
  flatIndex: number,
  isRowSelected: boolean,
  isWorkspace: boolean,
  className?: string,
  changes?: string[]
) => {
  return cx(
    className,
    styles.tr,
    styles.bodyRow,
    getExperimentTypeClass(original),
    cond(
      flatIndex % 2 !== 0 && !isRowSelected,
      () => styles.oddRow,
      () => styles.evenRow
    ),
    isWorkspace ? styles.workspaceRow : styles.normalRow,
    styles.row,
    isRowSelected && styles.rowSelected,
    isWorkspace && changes?.length && styles.workspaceWithChanges
  )
}

export type BatchSelectionProp = {
  batchRowSelection: (prop: RowProp) => void
}

export const RowContent: React.FC<
  RowProp & { className?: string } & WithChanges & BatchSelectionProp
> = ({
  row,
  className,
  changes,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection
}): JSX.Element => {
  const {
    getRowProps,
    cells: [firstCell, ...cells],
    original,
    flatIndex,
    values: { id }
  } = row
  const { displayColor } = original
  const isWorkspace = id === 'workspace'
  const changesIfWorkspace = isWorkspace ? changes : undefined
  const toggleExperiment = () => {
    sendMessage({
      payload: id,
      type: MessageFromWebviewType.TOGGLE_EXPERIMENT
    })
  }

  const toggleStarred = () => {
    !isWorkspace &&
      sendMessage({
        payload: [id],
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR
      })
  }

  const { toggleRowSelected, selectedRows } =
    React.useContext(RowSelectionContext)

  const isRowSelected = !!selectedRows[id]

  const toggleRowSelection = React.useCallback<HandlerFunc<HTMLElement>>(
    args => {
      if (!isWorkspace) {
        if (args?.mouse?.shiftKey) {
          batchRowSelection({ row })
        } else {
          toggleRowSelected?.({ row })
        }
      }
    },
    [row, toggleRowSelected, isWorkspace, batchRowSelection]
  )

  return (
    <ContextMenu
      disabled={contextMenuDisabled}
      content={
        <RowContextMenu
          row={row}
          projectHasCheckpoints={projectHasCheckpoints}
          hasRunningExperiment={hasRunningExperiment}
        />
      }
    >
      <div
        {...getRowProps({
          className: getRowClassNames(
            original,
            flatIndex,
            isRowSelected,
            isWorkspace,
            className,
            changes
          )
        })}
        tabIndex={0}
        role="row"
        aria-selected={isRowSelected}
        data-testid={isWorkspace && 'workspace-row'}
      >
        <FirstCell
          cell={firstCell}
          bulletColor={displayColor}
          isRowSelected={isRowSelected}
          toggleExperiment={toggleExperiment}
          toggleRowSelection={toggleRowSelection}
          toggleStarred={toggleStarred}
        />
        {cells.map(cell => {
          const cellId = `${cell.column.id}___${cell.row.id}`
          return (
            <CellWrapper
              cell={cell}
              changes={changesIfWorkspace}
              key={cellId}
              cellId={cellId}
            />
          )
        })}
      </div>
    </ContextMenu>
  )
}
