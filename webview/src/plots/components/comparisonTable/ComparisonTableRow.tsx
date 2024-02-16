import {
  ComparisonClassDetails,
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
import { ComparisonTableRowClasses } from './ComparisonTableRowClasses'
import { ComparisonTableCell } from './cell/ComparisonTableCell'
import { ComparisonTableMultiCell } from './cell/ComparisonTableMultiCell'
import { ComparisonTablePinnedContentRow } from './ComparisonTablePinnedContentRow'
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
  classDetails: ComparisonClassDetails
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
  classDetails,
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
  const cellClasses = cx(styles.cell, {
    [styles.cellHidden]: !isShown
  })

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
        <ComparisonTablePinnedContentRow
          pinnedColumn={pinnedColumn}
          nbColumns={nbColumns}
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
        </ComparisonTablePinnedContentRow>
        <ComparisonTableRowClasses
          pinnedColumn={pinnedColumn}
          nbColumns={nbColumns}
          classDetails={classDetails}
          cellClasses={cellClasses}
        />
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
              <div data-testid="row-images" className={cellClasses}>
                {plot.imgs.length > 1 ? (
                  <ComparisonTableMultiCell
                    classDetails={classDetails}
                    plot={plot}
                    path={path}
                  />
                ) : (
                  <ComparisonTableCell
                    classDetails={classDetails}
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
