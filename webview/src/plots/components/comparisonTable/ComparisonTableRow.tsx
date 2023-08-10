import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import React, { useState, useEffect, useRef } from 'react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { ComparisonTableCell } from './cell/ComparisonTableCell'
import { ComparisonTableMultiCell } from './cell/ComparisonTableMultiCell'
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
  const plotsRowRef = useRef<HTMLTableRowElement>(null)
  const draggedId = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedRef?.itemId
  )
  const comparisonWidth = useSelector(
    (state: PlotsState) => state.comparison.width
  )
  const [isShown, setIsShown] = useState(true)

  const toggleIsShownState = () => {
    if (isSelecting([path])) {
      return
    }
    setIsShown(!isShown)
  }

  const updateMultiImgHeight = (image: HTMLImageElement) => {
    const aspectRatio = image.naturalWidth / image.naturalHeight
    const width = image.clientWidth
    const calculatedHeight = Number.parseFloat((width / aspectRatio).toFixed(2))

    plotsRowRef.current?.style.setProperty(
      '--img-height',
      `${calculatedHeight}px`
    )
  }

  useEffect(() => {
    const img: HTMLImageElement | null | undefined =
      plotsRowRef.current?.querySelector(`.${styles.multiImageWrapper} img`)
    if (!img) {
      return
    }

    if (img.complete) {
      updateMultiImgHeight(img)
      return
    }
    img.addEventListener(
      'load',
      () => {
        updateMultiImgHeight(img)
      },
      { once: true }
    )
  }, [comparisonWidth])

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
      <tr ref={plotsRowRef}>
        {plots.map(plot => {
          const isPinned = pinnedColumn === plot.id
          return (
            <td
              key={path + plot.id}
              className={cx({
                [styles.pinnedColumnCell]: isPinned,
                [styles.draggedColumn]: draggedId === plot.id
              })}
            >
              <div
                data-testid="row-images"
                className={cx(styles.cell, { [styles.cellHidden]: !isShown })}
              >
                {plot.imgs.length > 1 ? (
                  <ComparisonTableMultiCell plot={plot} path={path} />
                ) : (
                  <ComparisonTableCell plot={plot} path={path} />
                )}
              </div>
            </td>
          )
        })}
      </tr>
    </>
  )
}
