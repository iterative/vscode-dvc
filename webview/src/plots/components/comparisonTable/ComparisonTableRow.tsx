import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useContext, useState } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { AllIcons, Icon } from '../../../shared/components/Icon'
import { RefreshButton } from '../../../shared/components/button/RefreshButton'
import { sendMessage } from '../../../shared/vscode'
import { DragDropContext, DragDropContextValue } from '../../../shared/components/dragDrop/DragDropContext'

export interface ComparisonTableRowProps {
  path: string
  plots: ComparisonPlot[]
  nbColumns: number
  pinnedColumn: string
}

export const ComparisonTableRow: React.FC<ComparisonTableRowProps> = ({
  path,
  plots,
  nbColumns,
  pinnedColumn
}) => {
  const [isShown, setIsShown] = useState(true)
  const { draggedRef } = useContext<DragDropContextValue>(DragDropContext)

  const toggleIsShownState = () => setIsShown(!isShown)

  return (
    <tbody>
      <tr>
        <td className={cx({ [styles.pinnedColumnCell]: pinnedColumn })}>
          <button className={styles.rowToggler} onClick={toggleIsShownState}>
            <Icon
              icon={isShown ? AllIcons.CHEVRON_DOWN : AllIcons.CHEVRON_RIGHT}
            />
            {path}
          </button>
        </td>
        {nbColumns > 1 && <td colSpan={nbColumns - 1}></td>}
      </tr>
      <tr>
        {plots.map((plot: ComparisonPlot) => {
          const isPinned = pinnedColumn === plot.revision
          const missing = !plot?.url
          const isBeingDragged = draggedRef?.itemId === plot.revision;

          return (
            <td
              key={path + plot.revision}
              className={cx({
                [styles.pinnedColumnCell]: isPinned,
                [styles.missing]: isShown && missing,
                [styles.draggedColumnCell]: isBeingDragged
              })}
            >
              <div
                className={cx(styles.cell, { [styles.cellHidden]: !isShown })}
              >
                {missing ? (
                  <div>
                    <p>No Plot to Display.</p>
                    <RefreshButton
                      onClick={() =>
                        sendMessage({
                          payload: plot.revision,
                          type: MessageFromWebviewType.REFRESH_REVISION
                        })
                      }
                    />
                  </div>
                ) : (
                  <img
                    src={plot.url}
                    alt={`Plot of ${path} (${plot.revision})`}
                  />
                )}
              </div>
            </td>
          )
        })}
      </tr>
    </tbody>
  )
}
