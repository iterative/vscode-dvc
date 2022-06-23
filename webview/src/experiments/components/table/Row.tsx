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
import { clickAndEnterProps } from '../../../util/props'
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

const getMultiSelectMenuOptions = (selectedRowsList: RowProp[]) => {
  const starStatuses = new Set<boolean | undefined>(
    selectedRowsList.map(
      ({
        row: {
          original: { starred }
        }
      }) => starred
    )
  )

  const hideStarsOption = starStatuses.size !== 1
  const starOptionLabel =
    ([...starStatuses][0] && 'Unstar Experiments') || 'Star Experiments'

  const removableRowIds = selectedRowsList
    .filter(value => value.row.depth === 1)
    .map(value => value.row.values.id)

  const hideRemoveOption = removableRowIds.length !== selectedRowsList.length

  return [
    experimentMenuOption(
      selectedRowsList.map(value => value.row.values.id),
      starOptionLabel,
      MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR,
      hideStarsOption
    ),
    experimentMenuOption(
      removableRowIds,
      'Remove Selected Rows',
      MessageFromWebviewType.REMOVE_EXPERIMENT,
      hideRemoveOption,
      !hideStarsOption
    )
  ]
}

const getSingleSelectMenuOptions = (
  id: string,
  isWorkspace: boolean,
  projectHasCheckpoints: boolean,
  depth: number,
  queued?: boolean,
  starred?: boolean
) => {
  const isNotCheckpoint = depth <= 1 || isWorkspace
  const canApplyOrCreateBranch = queued || isWorkspace || depth <= 0

  const withId = (
    label: string,
    type: MessageFromWebviewType,
    hidden?: boolean,
    divider?: boolean
  ) => experimentMenuOption(id, label, type, hidden, divider)

  return [
    withId(
      'Apply to Workspace',
      MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE,
      canApplyOrCreateBranch
    ),
    withId(
      'Create new Branch',
      MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT,
      canApplyOrCreateBranch
    ),
    withId(
      projectHasCheckpoints ? 'Modify and Resume' : 'Modify and Run',
      MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_AND_RUN,
      !isNotCheckpoint
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
    ),
    experimentMenuOption(
      [id],
      starred ? 'Unstar Experiment' : 'Star Experiment',
      MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR,
      isWorkspace
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
    () => getMultiSelectMenuOptions(selectedRowsList),
    () =>
      getSingleSelectMenuOptions(
        id,
        isWorkspace,
        projectHasCheckpoints,
        depth,
        queued,
        starred
      )
  )
}

export const RowContextMenu: React.FC<RowProp> = ({
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
    selectedRows
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

export const RowContent: React.FC<
  RowProp & { className?: string } & WithChanges
> = ({
  row,
  className,
  changes,
  contextMenuDisabled,
  projectHasCheckpoints
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
    sendMessage({
      payload: [id],
      type: MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR
    })
  }

  const { toggleRowSelected, selectedRows } =
    React.useContext(RowSelectionContext)

  const isRowSelected = !!selectedRows[id]

  const toggleRowSelection = React.useCallback(() => {
    if (!isWorkspace) {
      toggleRowSelected?.({ row })
    }
  }, [row, toggleRowSelected, isWorkspace])

  return (
    <ContextMenu
      disabled={contextMenuDisabled}
      content={
        <RowContextMenu
          row={row}
          projectHasCheckpoints={projectHasCheckpoints}
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
        {...clickAndEnterProps(toggleRowSelection)}
        aria-selected={isRowSelected}
        data-testid={isWorkspace && 'workspace-row'}
      >
        <FirstCell
          cell={firstCell}
          bulletColor={displayColor}
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
