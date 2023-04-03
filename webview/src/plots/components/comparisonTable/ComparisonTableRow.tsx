import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import React, { useState } from 'react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { ComparisonTableCell } from './ComparisonTableCell'
import { Icon } from '../../../shared/components/Icon'
import { ChevronDown, ChevronRight } from '../../../shared/components/icons'
import { PlotsState } from '../../store'
import { CopyButton } from '../../../shared/components/copyButton/CopyButton'
import { isSelecting } from '../../../util/strings'
import Tooltip, {
  NORMAL_TOOLTIP_DELAY
} from '../../../shared/components/tooltip/Tooltip'

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
  const draggedId = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedRef?.itemId
  )
  const [isShown, setIsShown] = useState(true)

  const toggleIsShownState = () => {
    if (isSelecting([path])) {
      return
    }
    setIsShown(!isShown)
  }

  return (
    <>
      <tr>
        <td
          className={cx({ [styles.pinnedColumnCell]: pinnedColumn })}
          colSpan={pinnedColumn ? 1 : nbColumns}
        >
          <div className={styles.rowPath}>
            <button className={styles.rowToggler} onClick={toggleIsShownState}>
              <Icon icon={isShown ? ChevronDown : ChevronRight} />
              <Tooltip
                content={path}
                placement="bottom-start"
                delay={NORMAL_TOOLTIP_DELAY}
              >
                <span className={styles.pathText}>{path}</span>
              </Tooltip>
            </button>
            <CopyButton value={path} className={styles.copyButton} />
          </div>
        </td>
        {nbColumns > 1 && pinnedColumn && <td colSpan={nbColumns - 1}></td>}
      </tr>
      <tr>
        {plots.map(plot => {
          const isPinned = pinnedColumn === plot.revision
          return (
            <td
              key={path + plot.revision}
              className={cx({
                [styles.pinnedColumnCell]: isPinned,
                [styles.noImage]: isShown && !plot?.url,
                [styles.draggedColumn]: draggedId === plot.revision
              })}
            >
              <div
                data-testid="row-images"
                className={cx(styles.cell, { [styles.cellHidden]: !isShown })}
              >
                <ComparisonTableCell path={path} plot={plot} />
              </div>
            </td>
          )
        })}
      </tr>
    </>
  )
}
