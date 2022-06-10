import React, { EventHandler, SyntheticEvent } from 'react'
import cx from 'classnames'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { RowProp, WithChanges } from './interfaces'
import styles from './styles.module.scss'
import { FirstCell, CellWrapper } from './Cell'
import { sendMessage } from '../../../shared/vscode'
import { ContextMenu } from '../../../shared/components/contextMenu/ContextMenu'
import { MessagesMenu } from '../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../shared/components/messagesMenu/MessagesMenuOption'
import { pushIf } from '../../../util/array'

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
  id: string,
  label: string,
  type: MessageFromWebviewType
) => {
  return {
    id: type,
    label,
    message: {
      payload: id,
      type
    }
  } as MessagesMenuOptionProps
}

export const RowContextMenu: React.FC<RowProp> = ({
  projectHasCheckpoints = false,
  row: {
    original: { queued },
    depth,
    values: { id }
  }
}) => {
  const isWorkspace = id === 'workspace'

  const contextMenuOptions = React.useMemo(() => {
    const menuOptions: MessagesMenuOptionProps[] = []

    pushIf(menuOptions, !queued && !isWorkspace && depth > 0, [
      experimentMenuOption(
        id,
        'Apply to Workspace',
        MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE
      ),
      experimentMenuOption(
        id,
        'Create new Branch',
        MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT
      )
    ])

    pushIf(menuOptions, depth === 1, [
      experimentMenuOption(
        id,
        'Remove',
        MessageFromWebviewType.REMOVE_EXPERIMENT
      )
    ])

    const isNotCheckpoint = depth <= 1 || isWorkspace

    pushIf(menuOptions, isNotCheckpoint, [
      experimentMenuOption(
        id,
        projectHasCheckpoints ? 'Modify and Resume' : 'Modify and Run',
        MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_AND_RUN
      )
    ])

    pushIf(menuOptions, isNotCheckpoint && projectHasCheckpoints, [
      experimentMenuOption(
        id,
        'Modify, Reset and Run',
        MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_RESET_AND_RUN
      )
    ])

    pushIf(menuOptions, isNotCheckpoint, [
      experimentMenuOption(
        id,
        'Modify and Queue',
        MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_AND_QUEUE
      )
    ])

    return menuOptions
  }, [queued, isWorkspace, depth, id, projectHasCheckpoints])

  return <MessagesMenu options={contextMenuOptions} />
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
          className: cx(
            className,
            styles.tr,
            styles.bodyRow,
            getExperimentTypeClass(original),
            flatIndex % 2 === 0 || styles.oddRow,
            isWorkspace ? styles.workspaceRow : styles.normalRow,
            styles.row,
            isWorkspace && changes?.length && styles.workspaceWithChanges
          )
        })}
        tabIndex={0}
        role="row"
        onClick={toggleExperiment}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggleExperiment(e)
          }
        }}
        data-testid={isWorkspace && 'workspace-row'}
      >
        <FirstCell cell={firstCell} bulletColor={displayColor} />
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
