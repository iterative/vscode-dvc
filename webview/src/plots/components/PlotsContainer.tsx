import cx from 'classnames'
import React, { useEffect, DetailedHTMLProps, HTMLAttributes } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PlotHeight, PlotsSection } from 'dvc/src/plots/webview/contract'
import styles from './styles.module.scss'
import { changeDragAndDropMode, isDragAndDropModeSelector } from './util'
import { SizeSliders } from './SizeSliders'
import { PlotsState } from '../store'
import { togglePlotsSection } from '../util/messages'
import { IconMenuItemProps } from '../../shared/components/iconMenu/IconMenuItem'
import { Trash, Move, Check } from '../../shared/components/icons'
import { SectionContainer } from '../../shared/components/sectionContainer/SectionContainer'

interface PlotsContainerProps {
  sectionCollapsed: boolean
  sectionKey: PlotsSection
  title: string
  nbItemsPerRowOrWidth: number
  height: PlotHeight
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
  removePlotsButton,
  hasItems,
  noHeight
}) => {
  const open = !sectionCollapsed
  const dispatch = useDispatch()
  const maxNbPlotsPerRow = useSelector(
    (state: PlotsState) => state.webview.maxNbPlotsPerRow
  )
  const ribbonHeight = useSelector((state: PlotsState) => state.ribbon.height)
  const isDragAndDropMode = useSelector((state: PlotsState) =>
    isDragAndDropModeSelector(state, sectionKey)
  )

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [nbItemsPerRowOrWidth, height])

  const changeMode = () =>
    changeDragAndDropMode(sectionKey, dispatch, isDragAndDropMode)

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

  if (removePlotsButton) {
    menuItems.push({
      icon: Trash,
      onClick: removePlotsButton.onClick,
      tooltip: 'Remove Plots'
    })
  }

  const toggleSection = () => togglePlotsSection(sectionKey, sectionCollapsed)

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
      headerChildren={
        open &&
        hasItems && (
          <SizeSliders
            maxNbPlotsPerRow={maxNbPlotsPerRow}
            height={height}
            noHeight={noHeight}
            nbItemsPerRowOrWidth={nbItemsPerRowOrWidth}
            sectionKey={sectionKey}
          />
        )
      }
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
