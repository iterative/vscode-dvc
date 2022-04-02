import React, { EventHandler, SyntheticEvent } from 'react'
import { Row } from 'react-table'
import cx from 'classnames'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { CellWrapper, FirstCell } from './Cell'
import styles from './styles.module.scss'
import { sendMessage } from '../../../shared/vscode'
import Tooltip from '../../../shared/components/tooltip/Tooltip'

export interface WithChanges {
  changes?: string[]
}

export interface RowProp {
  row: Row<Experiment>
}

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

export const ExperimentRow: React.FC<
  RowProp & { className?: string } & WithChanges
> = ({ row, className, changes }): JSX.Element => {
  const {
    getRowProps,
    cells: [firstCell, ...cells],
    original,
    flatIndex,
    values: { id }
  } = row
  const isWorkspace = id === 'workspace'
  const changesIfWorkspace = isWorkspace ? changes : undefined
  const toggleExperiment: EventHandler<SyntheticEvent> = e => {
    e.preventDefault()
    e.stopPropagation()
    sendMessage({
      payload: id,
      type: MessageFromWebviewType.EXPERIMENT_TOGGLED
    })
  }
  return (
    <Tooltip
      arrow={true}
      trigger="contextmenu"
      content={
        <ul className={styles.contextMenu}>
          <li>Apply Experiment</li>
          <li>Branch Experiment</li>
          <li>Remove Experiment</li>
          <li>Queue Experiment with Params</li>
        </ul>
      }
      placement="bottom"
      interactive={true}
      onTrigger={(instance, event: PointerEvent) => {
        event.preventDefault()
        instance.setProps({
          getReferenceClientRect() {
            const { top, bottom, height } =
              instance.reference.getBoundingClientRect()
            return {
              bottom,
              height,
              left: event.clientX,
              right: event.clientX,
              top,
              width: 0
            } as DOMRect
          }
        })
      }}
    >
      <div
        {...getRowProps({
          className: cx(
            className,
            styles.tr,
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
        <FirstCell cell={firstCell} bulletColor={original.displayColor} />
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
    </Tooltip>
  )
}
