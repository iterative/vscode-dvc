import {
  ComparisonBoundingBoxLabels,
  ComparisonPlot
} from 'dvc/src/plots/webview/contract'
import React, {
  useState,
  useEffect,
  useRef,
  Fragment,
  useLayoutEffect,
  RefObject
} from 'react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { ComparisonTableCell } from './cell/ComparisonTableCell'
import { ComparisonTableMultiCell } from './cell/ComparisonTableMultiCell'
import { RowDropTarget } from './RowDropTarget'
import { Icon } from '../../../shared/components/Icon'
import { ChevronDown, ChevronRight } from '../../../shared/components/icons'
import { PlotsState } from '../../store'
import { CopyButton } from '../../../shared/components/copyButton/CopyButton'
import { isSelecting } from '../../../util/strings'
import Tooltip, {
  NORMAL_TOOLTIP_DELAY
} from '../../../shared/components/tooltip/Tooltip'
import { useDragAndDrop } from '../../../shared/hooks/useDragAndDrop'
import { DragDropItemWithTarget } from '../../../shared/components/dragDrop/DragDropItemWithTarget'

export interface ComparisonTableRowProps {
  path: string
  plots: ComparisonPlot[]
  nbColumns: number
  pinnedColumn: string
  onLayoutChange: () => void
  setOrder: (order: string[]) => void
  order: string[]
  boundingBoxLabels?: ComparisonBoundingBoxLabels
  bodyRef?: RefObject<HTMLTableSectionElement>
}

export const ComparisonTableRow: React.FC<ComparisonTableRowProps> = ({
  path,
  plots,
  nbColumns,
  pinnedColumn,
  onLayoutChange,
  setOrder,
  order,
  boundingBoxLabels = {},
  bodyRef
}) => {
  const plotsRowRef = useRef<HTMLTableRowElement>(null)
  const draggedId = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedRef?.itemId
  )
  const comparisonWidth = useSelector(
    (state: PlotsState) => state.comparison.width
  )
  const { disabledDragPlotIds, isInDragAndDropMode } = useSelector(
    (state: PlotsState) => state.comparison
  )
  const [isShown, setIsShown] = useState(true)
  const { target, isAfter, ...dragAndDropProps } = useDragAndDrop({
    disabledDropIds: disabledDragPlotIds,
    dropTarget: <RowDropTarget colSpan={nbColumns} />,
    group: 'comparison-table',
    id: path,
    onDragEnd: () => {},
    order,
    setOrder,
    type: <tbody />,
    vertical: true
  })
  const boundingBoxLabelsArr = Object.entries(boundingBoxLabels)

  useLayoutEffect(() => {
    onLayoutChange?.()
  })

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
    <DragDropItemWithTarget
      isAfter={isAfter}
      dropTarget={target || null}
      draggable={<Fragment />}
    >
      <tbody
        {...dragAndDropProps}
        data-testid="comparison-table-body"
        key={path}
        id={path}
        ref={bodyRef}
      >
        <tr>
          <td
            className={cx({ [styles.pinnedColumnCell]: pinnedColumn })}
            colSpan={pinnedColumn ? 1 : nbColumns}
          >
            <div className={styles.rowHeader} data-testid="row-header">
              <div className={styles.rowHeaderPath}>
                <button
                  className={styles.rowToggler}
                  onClick={toggleIsShownState}
                >
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
              {boundingBoxLabelsArr.length > 0 && (
                <div className={styles.boundingBoxLabels}>
                  <p className={styles.boundingBoxLabelsTitle}>Labels</p>
                  {boundingBoxLabelsArr.map(([label, { color, selected }]) => (
                    <React.Fragment key={label}>
                      <input
                        type="checkbox"
                        id={color.slice(1)}
                        name="labels"
                        value={label}
                        defaultChecked={selected}
                        className={styles.hiddenInput}
                      />
                      <label
                        className={styles.boundingBoxLabelsButton}
                        style={{ background: color }}
                        htmlFor={color.slice(1)}
                      >
                        {label}
                      </label>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </td>
          {nbColumns > 1 && pinnedColumn && <td colSpan={nbColumns - 1}></td>}
        </tr>
        <tr ref={plotsRowRef}>
          {plots.map(plot => (
            <td
              key={path + plot.id}
              className={cx({
                [styles.pinnedColumnCell]: pinnedColumn === plot.id,
                [styles.draggedColumn]:
                  isInDragAndDropMode && draggedId === plot.id
              })}
            >
              <div
                data-testid="row-images"
                className={cx(styles.cell, { [styles.cellHidden]: !isShown })}
              >
                {plot.imgs.length > 1 ? (
                  <ComparisonTableMultiCell
                    boundingBoxLabels={boundingBoxLabels}
                    plot={plot}
                    path={path}
                  />
                ) : (
                  <ComparisonTableCell
                    boundingBoxLabels={boundingBoxLabels}
                    plot={plot}
                    path={path}
                  />
                )}
              </div>
            </td>
          ))}
        </tr>
      </tbody>
    </DragDropItemWithTarget>
  )
}
