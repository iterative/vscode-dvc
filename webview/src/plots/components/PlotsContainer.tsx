import cx from 'classnames'
import React, {
  useEffect,
  DetailedHTMLProps,
  HTMLAttributes,
  useCallback
} from 'react'
import { AnyAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import { PlotHeight, PlotsSection } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { PlotsPicker, PlotsPickerProps } from './PlotsPicker'
import styles from './styles.module.scss'
import { IconMenuItemProps } from '../../shared/components/iconMenu/IconMenuItem'
import { sendMessage } from '../../shared/vscode'
import { Lines, Add, Trash } from '../../shared/components/icons'
import { Slider } from '../../shared/components/slider/Slider'
import { PlotsState } from '../store'
import { SectionContainer } from '../../shared/components/sectionContainer/SectionContainer'

export interface PlotsContainerProps {
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
  addPlotsButton?: { onClick: () => void }
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
  addPlotsButton,
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

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [nbItemsPerRowOrWidth, height])

  const menuItems: IconMenuItemProps[] = []

  if (menu) {
    menuItems.unshift({
      icon: Lines,
      onClickNode: <PlotsPicker {...menu} />,
      tooltip: 'Select Plots'
    })
  }

  if (addPlotsButton) {
    menuItems.unshift({
      icon: Add,
      onClick: addPlotsButton.onClick,
      tooltip: 'Add Plots'
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
      sendMessage({
        payload: {
          height: newHeight,
          nbItemsPerRow: positiveNbItems,
          section: sectionKey
        },
        type: MessageFromWebviewType.RESIZE_PLOTS
      })
    },
    [dispatch, changeSize, sectionKey]
  )

  const toggleSection = () =>
    sendMessage({
      payload: {
        [sectionKey]: !sectionCollapsed
      },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })

  const plotHeights = Object.values(PlotHeight).filter(
    value => typeof value !== 'string'
  ) as number[]

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
        hasItems &&
        maxNbPlotsPerRow > 1 && (
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
        )
      }
    >
      {open && (
        <div
          className={cx({
            [styles.plotsWrapper]: sectionKey !== PlotsSection.COMPARISON_TABLE,
            [styles.smallPlots]: nbItemsPerRowOrWidth >= 4
          })}
          style={
            {
              '--nbPerRow': nbItemsPerRowOrWidth
            } as DetailedHTMLProps<
              HTMLAttributes<HTMLDivElement>,
              HTMLDivElement
            >
          }
          data-testid="plots-wrapper"
        >
          {children}
        </div>
      )}
    </SectionContainer>
  )
}
