import React, { EventHandler, SyntheticEvent, useState } from 'react'
import cx from 'classnames'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { RowProp, WithChanges } from './interfaces'
import styles from './styles.module.scss'
import { FirstCell, CellWrapper } from './Cell'
import { sendMessage } from '../../../shared/vscode'
import { SelectMenuOptionProps } from '../../../shared/components/selectMenu/SelectMenuOption'
import { ContextMenu } from '../../../shared/components/contextMenu/ContextMenu'
import { SelectMenu } from '../../../shared/components/selectMenu/SelectMenu'

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

export const RowContent: React.FC<
  RowProp & { className?: string } & WithChanges
> = ({
  row: {
    getRowProps,
    cells: [firstCell, ...cells],
    original,
    flatIndex,
    depth,
    values: { id }
  },
  className,
  changes
}): JSX.Element => {
  const [menuOptions, setMenuOptions] = useState<SelectMenuOptionProps[]>([])
  const [menuOpen, setMenuOpen] = useState(false)

  const { queued, running, displayColor } = original
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
  const invokeContextMenu: EventHandler<SyntheticEvent> = e => {
    e.preventDefault()
    e.stopPropagation()

    const menuOptions: SelectMenuOptionProps[] = []

    if (depth > 0) {
      if (!queued) {
        menuOptions.push(
          {
            id: MessageFromWebviewType.EXPERIMENT_APPLIED_TO_WORKSPACE,
            label: 'Apply to Workspace'
          },
          {
            id: MessageFromWebviewType.BRANCH_CREATED_FROM_EXPERIMENT,
            label: 'Create New Branch'
          }
        )
      }

      if (depth === 1) {
        menuOptions.push(
          {
            id: MessageFromWebviewType.EXPERIMENT_QUEUE_AND_PARAMS_VARIED,
            label: 'Vary Param(s) and Queue'
          },
          {
            id: MessageFromWebviewType.EXPERIMENT_REMOVED,
            label: 'Remove Experiment'
          }
        )
      }
    }

    setMenuOptions(menuOptions)
    setMenuOpen(true)

    sendMessage({
      payload: { depth, id, queued, running },
      type: MessageFromWebviewType.CONTEXT_MENU_INVOKED
    })
  }

  const contextMenuAction = (optionId: string) => {
    sendMessage({
      payload: id,
      type: optionId as MessageFromWebviewType
    })
  }
  return (
    <ContextMenu
      content={<SelectMenu options={menuOptions} onClick={contextMenuAction} />}
      open={menuOpen}
      onClickOutside={() => setMenuOpen(false)}
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
        onContextMenu={invokeContextMenu}
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
