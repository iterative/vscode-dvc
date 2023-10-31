import cx from 'classnames'
import React, {
  useEffect,
  DetailedHTMLProps,
  HTMLAttributes,
  useCallback,
  MouseEvent
} from 'react'
import { AnyAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import { PlotHeight, PlotsSection } from 'dvc/src/plots/webview/contract'
import { PlotsPicker, PlotsPickerProps } from './PlotsPicker'
import styles from './styles.module.scss'
import { IconMenuItemProps } from '../../shared/components/iconMenu/IconMenuItem'
import { ListFilter, Trash, Move, Check } from '../../shared/components/icons'
import { Slider } from '../../shared/components/slider/Slider'
import { PlotsState } from '../store'
import { SectionContainer } from '../../shared/components/sectionContainer/SectionContainer'
import { resizePlots, togglePlotsSection } from '../util/messages'
import { toggleDragAndDropMode as toggleTemplateDragAndDrop } from './templatePlots/templatePlotsSlice'
import { toggleDragAndDropMode as toggleCustomDragAndDrop } from './customPlots/customPlotsSlice'
interface PlotsContainerProps {
  sectionCollapsed: boolean
  sectionKey: PlotsSection
  title: string
  nbItemsPerRowOrWidth: number
  height: PlotHeight
  changeSize: (payload: {
    nbItemsPerRowOrWidth: number
    height: PlotHeight
  }) => AnyAction
  menu?: PlotsPickerProps
  removePlotsButton?: { onClick: () => void }
  children: React.ReactNode
  hasItems?: boolean
  noHeight?: boolean
}

export const PlotsContainer: React.FC<PlotsContainerProps> = ({
  sectionCollapsed,
  sectionKey,
  title,
  children,
  nbItemsPerRowOrWidth,
  height,
  menu,
  removePlotsButton,
  changeSize,
  hasItems,
  noHeight
}) => {
  const open = !sectionCollapsed
  const dispatch = useDispatch()
  const maxNbPlotsPerRow = useSelector(
    (state: PlotsState) => state.webview.maxNbPlotsPerRow
  )
  const ribbonHeight = useSelector((state: PlotsState) => state.ribbon.height)
  const isDragAndDropMode = useSelector((state: PlotsState) => {
    switch (sectionKey) {
      case PlotsSection.TEMPLATE_PLOTS:
        return state.template.isInDragAndDropMode
      case PlotsSection.CUSTOM_PLOTS:
        return state.custom.isInDragAndDropMode
      default:
        return false
    }
  })

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [nbItemsPerRowOrWidth, height])

  const changeMode = () => {
    switch (sectionKey) {
      case PlotsSection.TEMPLATE_PLOTS:
        console.log('dispatch')
        return dispatch(toggleTemplateDragAndDrop(!isDragAndDropMode))

      case PlotsSection.CUSTOM_PLOTS:
        return dispatch(toggleCustomDragAndDrop(!isDragAndDropMode))

      default:
        return
    }
  }

  const menuItems: IconMenuItemProps[] = []

  if (
    [PlotsSection.CUSTOM_PLOTS, PlotsSection.TEMPLATE_PLOTS].includes(
      sectionKey
    )
  ) {
    menuItems.push({
      icon: isDragAndDropMode ? Check : Move,
      onClick: changeMode,
      tooltip: isDragAndDropMode ? 'Save plots order' : 'Re-order the plots'
    })
  }

  if (menu) {
    menuItems.unshift({
      icon: ListFilter,
      onClickNode: <PlotsPicker {...menu} />,
      tooltip: 'Select Plots'
    })
  }

  if (removePlotsButton) {
    menuItems.unshift({
      icon: Trash,
      onClick: removePlotsButton.onClick,
      tooltip: 'Remove Plots'
    })
  }

  const handleResize = useCallback(
    (nbItems: number, newHeight: PlotHeight) => {
      const positiveNbItems = Math.abs(nbItems)
      dispatch(
        changeSize({
          height: newHeight,
          nbItemsPerRowOrWidth: positiveNbItems
        })
      )
      resizePlots(newHeight, positiveNbItems, sectionKey)
    },
    [dispatch, changeSize, sectionKey]
  )

  const toggleSection = () => togglePlotsSection(sectionKey, sectionCollapsed)

  const plotHeights = Object.values(PlotHeight).filter(
    value => typeof value !== 'string'
  ) as number[]

  const sizeSliders =
    maxNbPlotsPerRow > 1 ? (
      <div className={styles.sizeSliders} data-testid="size-sliders">
        <div className={styles.sizeSlider}>
          <Slider
            maximum={-1}
            minimum={-maxNbPlotsPerRow}
            label="Plot Width"
            onChange={nbItems => handleResize(nbItems, height)}
            defaultValue={-nbItemsPerRowOrWidth}
          />
        </div>
        {!noHeight && (
          <div className={styles.sizeSlider}>
            <Slider
              minimum={Math.min(...plotHeights)}
              maximum={Math.max(...plotHeights)}
              label="Plot Height"
              onChange={newHeight =>
                handleResize(
                  nbItemsPerRowOrWidth,
                  newHeight as unknown as PlotHeight
                )
              }
              defaultValue={height}
            />
          </div>
        )}
      </div>
    ) : null

  return (
    <SectionContainer
      menuItems={menuItems}
      sectionCollapsed={sectionCollapsed}
      sectionKey={sectionKey}
      title={title}
      onToggleSection={toggleSection}
      className={cx({
        [styles.ratioSmaller]: height === PlotHeight.SMALLER,
        [styles.ratioSmall]: height === PlotHeight.SMALL,
        [styles.ratioRegular]: height === PlotHeight.REGULAR,
        [styles.ratioSquare]: height === PlotHeight.SQUARE,
        [styles.ratioVerticalNormal]: height === PlotHeight.VERTICAL_NORMAL,
        [styles.ratioVerticalLarger]: height === PlotHeight.VERTICAL_LARGER
      })}
      stickyHeaderTop={ribbonHeight - 4}
      headerChildren={open && hasItems && sizeSliders}
    >
      <div
        className={cx({
          [styles.plotsWrapper]: sectionKey !== PlotsSection.COMPARISON_TABLE,
          [styles.smallPlots]: nbItemsPerRowOrWidth >= 4
        })}
        style={
          {
            '--nb-per-row': nbItemsPerRowOrWidth
          } as DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
        }
        data-testid="plots-wrapper"
      >
        {children}
      </div>
    </SectionContainer>
  )
}
