import React, { EventHandler, SyntheticEvent } from 'react'
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
  hidden?: boolean
) => {
  return {
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
  return [
    experimentMenuOption(
      selectedRowsList
        .filter(value => value.row.depth === 1)
        .map(value => value.row.values.id),
      'Remove Selected Rows',
      MessageFromWebviewType.REMOVE_EXPERIMENT
    )
  ]
}

const getSingleSelectMenuOptions = (
  id: string,
  isWorkspace: boolean,
  projectHasCheckpoints: boolean,
  depth: number,
  queued?: boolean
) => {
  const isNotCheckpoint = depth <= 1 || isWorkspace
  const canApplyOrCreateBranch = queued || isWorkspace || depth <= 0

  const withId = (
    label: string,
    type: MessageFromWebviewType,
    hidden?: boolean
  ) => experimentMenuOption(id, label, type, hidden)

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
    withId('Remove', MessageFromWebviewType.REMOVE_EXPERIMENT, depth !== 1),
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
    )
  ]
}

const getContextMenuOptions = (
  id: string,
  isWorkspace: boolean,
  projectHasCheckpoints: boolean,
  depth: number,
  selectedRows: Record<string, RowProp | undefined>,
  queued?: boolean
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
        queued
      )
  )
}

export const RowContextMenu: React.FC<RowProp> = ({
  projectHasCheckpoints = false,
  row: {
    original: { queued },
    depth,
    values: { id }
  }
}) => {
  const { selectedRows } = React.useContext(RowSelectionContext)

  const isWorkspace = id === 'workspace'

  const contextMenuOptions = React.useMemo(() => {
    return getContextMenuOptions(
      id,
      isWorkspace,
      projectHasCheckpoints,
      depth,
      selectedRows,
      queued
    )
  }, [queued, isWorkspace, depth, id, projectHasCheckpoints, selectedRows])

  return (
    (contextMenuOptions.length > 0 && (
      <MessagesMenu options={contextMenuOptions} />
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
    flatIndex % 2 === 0 || (styles.oddRow && !isRowSelected),
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
  const toggleExperiment: EventHandler<SyntheticEvent> = e => {
    e.preventDefault()
    e.stopPropagation()
    sendMessage({
      payload: id,
      type: MessageFromWebviewType.TOGGLE_EXPERIMENT
    })
  }

  const { toggleRowSelected, selectedRows } =
    React.useContext(RowSelectionContext)

  const isRowSelected = !!selectedRows[id]

  const toggleRowSelection = React.useCallback(() => {
    toggleRowSelected?.({ row })
  }, [row, toggleRowSelected])

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
        data-testid={isWorkspace && 'workspace-row'}
      >
        <FirstCell
          cell={firstCell}
          bulletColor={displayColor}
          toggleExperiment={toggleExperiment}
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
