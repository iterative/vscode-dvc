import React, { EventHandler, SyntheticEvent } from 'react'
import { Row } from 'react-table'
import cx from 'classnames'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { RegisteredCliCommands } from 'dvc/src/commands/external'
import { Instance } from 'tippy.js'
import { CellWrapper, FirstCell } from './Cell'
import styles from './styles.module.scss'
import { sendMessage } from '../../../shared/vscode'
import { CommandLink } from '../../../shared/components/commandLink/CommandLink'
import Tooltip, {
  TooltipArrow,
  TooltipBox
} from '../../../shared/components/tooltip/Tooltip'

export interface WithChanges {
  changes?: string[]
}

export interface RowProp {
  row: Row<Experiment>
}

const positionContextMenuOnTrigger = (
  instance: Instance,
  event: PointerEvent
) => {
  event.preventDefault()
  instance.setProps({
    getReferenceClientRect() {
      const { top, bottom, height } = instance.reference.getBoundingClientRect()
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

const RowContextMenu: React.FC<{
  row: Row<Experiment>
  instance: Instance
}> = ({ row, instance }) => {
  const {
    depth,
    original: { label }
  } = row

  return (
    <div>
      <b>{label}</b>
      <ul className={styles.contextMenu}>
        <li>
          <CommandLink
            command={RegisteredCliCommands.EXPERIMENT_APPLY}
            args={[label]}
            onClick={instance.hide}
          >
            Apply to Workspace
          </CommandLink>
        </li>
        <li>
          <CommandLink
            command={RegisteredCliCommands.EXPERIMENT_BRANCH}
            args={[label]}
            onClick={instance.hide}
          >
            Create new Branch
          </CommandLink>
        </li>
        {depth < 2 && (
          <li>
            <CommandLink
              command={RegisteredCliCommands.EXPERIMENT_REMOVE}
              args={[label]}
              onClick={instance.hide}
            >
              Remove
            </CommandLink>
          </li>
        )}
      </ul>
    </div>
  )
}

const RowContentRenderFunction: React.ForwardRefRenderFunction<
  HTMLDivElement,
  RowProp & WithChanges & { className?: string }
> = ({ row, changes, className }, ref) => {
  const {
    getRowProps,
    cells: [firstCell, ...cells],
    original,
    values: { id },
    flatIndex
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
      ref={ref}
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
  )
}

const RowContent = React.forwardRef(RowContentRenderFunction)

export const ExperimentRow: React.FC<
  RowProp & { className?: string } & WithChanges
> = ({ row, className, changes }): JSX.Element => {
  const { depth } = row

  const rowElement = (
    <RowContent className={className} changes={changes} row={row} />
  )

  return depth > 0 ? (
    <Tooltip
      arrow={true}
      trigger="contextmenu"
      render={(attrs, _content, instance) => (
        <TooltipBox {...attrs}>
          <RowContextMenu row={row} instance={instance as Instance} />
          <TooltipArrow />
        </TooltipBox>
      )}
      placement="bottom"
      interactive={true}
      onTrigger={positionContextMenuOnTrigger}
    >
      {rowElement}
    </Tooltip>
  ) : (
    rowElement
  )
}
