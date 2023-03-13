import cx from 'classnames'
import React, {
  MouseEvent,
  useEffect,
  DetailedHTMLProps,
  HTMLAttributes,
  useCallback
} from 'react'
import { AnyAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import { PlotHeight, Section } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { PlotsPicker, PlotsPickerProps } from './PlotsPicker'
import styles from './styles.module.scss'
import { Icon } from '../../shared/components/Icon'
import { IconMenu } from '../../shared/components/iconMenu/IconMenu'
import { IconMenuItemProps } from '../../shared/components/iconMenu/IconMenuItem'
import { sendMessage } from '../../shared/vscode'
import Tooltip from '../../shared/components/tooltip/Tooltip'
import {
  ChevronDown,
  ChevronRight,
  Info,
  Lines,
  Add,
  Trash
} from '../../shared/components/icons'
import { isSelecting } from '../../util/strings'
import { isTooltip } from '../../util/helpers'
import { MinMaxSlider } from '../../shared/components/slider/MinMaxSlider'
import { PlotsState } from '../store'
import { ItemsSlider } from '../../shared/components/slider/ItemsSlider'

export interface PlotsContainerProps {
  sectionCollapsed: boolean
  sectionKey: Section
  title: string
  nbItemsPerRow: number
  height: PlotHeight
  changeSize?: (payload: {
    nbItemsPerRow: number
    height: PlotHeight
  }) => AnyAction
  menu?: PlotsPickerProps
  addPlotsButton?: { onClick: () => void }
  removePlotsButton?: { onClick: () => void }
  children: React.ReactNode
  hasItems?: boolean
}

export const SectionDescription = {
  // "Trends"
  [Section.CHECKPOINT_PLOTS]: (
    <span data-testid="tooltip-checkpoint-plots">
      Automatically generated and updated linear plots that show metric value
      per epoch if{' '}
      <a href="https://dvc.org/doc/user-guide/experiment-management/checkpoints">
        checkpoints
      </a>{' '}
      are enabled.
    </span>
  ),
  // "Custom"
  [Section.CUSTOM_PLOTS]: (
    <span data-testid="tooltip-custom-plots">
      Generated custom linear plots comparing chosen metrics and params in all
      experiments in the table.
    </span>
  ),
  // "Images"
  [Section.COMPARISON_TABLE]: (
    <span data-testid="tooltip-comparison-plots">
      Images (e.g. any <code>.jpg</code>, <code>.svg</code>, or
      <code>.png</code> file) rendered side by side across experiments. They
      should be registered as{' '}
      <a href="https://dvc.org/doc/user-guide/experiment-management/visualizing-plots">
        plots
      </a>
      .
    </span>
  ),
  // "Data Series"
  [Section.TEMPLATE_PLOTS]: (
    <span data-testid="tooltip-template-plots">
      Any <code>JSON</code>, <code>YAML</code>, <code>CSV</code>, or{' '}
      <code>TSV</code> file(s) with data points, visualized using{' '}
      <a href="https://dvc.org/doc/user-guide/experiment-management/visualizing-plots#plot-templates-data-series-only">
        plot templates
      </a>
      . Either predefined (e.g. confusion matrix, linear) or{' '}
      <a href="https://dvc.org/doc/command-reference/plots/templates#custom-templates">
        custom Vega-lite templates
      </a>
      .
    </span>
  )
}

const InfoIcon = () => (
  <Icon icon={Info} width={16} height={16} className={styles.infoIcon} />
)

export const PlotsContainer: React.FC<PlotsContainerProps> = ({
  sectionCollapsed,
  sectionKey,
  title,
  children,
  nbItemsPerRow,
  height,
  menu,
  addPlotsButton,
  removePlotsButton,
  changeSize,
  hasItems
}) => {
  const open = !sectionCollapsed
  const dispatch = useDispatch()
  const maxNbPlotsPerRow = useSelector(
    (state: PlotsState) => state.webview.maxNbPlotsPerRow
  )

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [nbItemsPerRow, height])

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

  const tooltipContent = (
    <div className={styles.infoTooltip}>
      <InfoIcon />
      {SectionDescription[sectionKey]}
    </div>
  )

  const toggleSection = (e: MouseEvent) => {
    e.preventDefault()
    if (
      !isSelecting([title, SectionDescription[sectionKey].props.children]) &&
      !isTooltip(e.target as Element, ['SUMMARY', 'BODY'])
    ) {
      sendMessage({
        payload: {
          [sectionKey]: !sectionCollapsed
        },
        type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
      })
    }
  }

  const handleResize = useCallback(
    (nbItems: number, newHeight: PlotHeight) => {
      if (changeSize) {
        const positiveNbItems = Math.abs(nbItems)
        dispatch(
          changeSize({ height: newHeight, nbItemsPerRow: positiveNbItems })
        )
        sendMessage({
          payload: {
            height: newHeight,
            nbItemsPerRow: positiveNbItems,
            section: sectionKey
          },
          type: MessageFromWebviewType.RESIZE_PLOTS
        })
      }
    },
    [dispatch, changeSize, sectionKey]
  )

  return (
    <div
      className={cx(styles.plotsContainerWrapper, {
        [styles.ratioSmaller]: height === PlotHeight.SMALLER,
        [styles.ratioSmall]: height === PlotHeight.SMALL,
        [styles.ratioRegular]: height === PlotHeight.REGULAR,
        [styles.ratioSquare]: height === PlotHeight.SQUARE,
        [styles.ratioVerticalNormal]: height === PlotHeight.VERTICAL_NORMAL,
        [styles.ratioVerticalLarger]: height === PlotHeight.VERTICAL_LARGER
      })}
      data-testid="plots-container"
    >
      <details open={open} className={styles.plotsContainer}>
        <summary onClick={toggleSection}>
          <Icon
            icon={open ? ChevronDown : ChevronRight}
            data-testid="plots-container-details-chevron"
            width={20}
            height={20}
            className={styles.detailsIcon}
          />
          {title}
          <Tooltip content={tooltipContent} placement="bottom-end" interactive>
            <div
              className={styles.infoTooltipToggle}
              data-testid="info-tooltip-toggle"
            >
              <InfoIcon />
            </div>
          </Tooltip>
        </summary>
        {changeSize && hasItems && maxNbPlotsPerRow > 1 && (
          <div className={styles.sizeSliders} data-testid="size-sliders">
            <div className={styles.sizeSlider}>
              <MinMaxSlider
                maximum={-1}
                minimum={-maxNbPlotsPerRow}
                label="Plot Width"
                onChange={nbItems => handleResize(nbItems, height)}
                defaultValue={-nbItemsPerRow}
              />
            </div>
            <div className={styles.sizeSlider}>
              <ItemsSlider
                items={Object.values(PlotHeight) as number[]}
                label="Plot Height"
                onChange={newHeight =>
                  handleResize(
                    nbItemsPerRow,
                    newHeight as unknown as PlotHeight
                  )
                }
                defaultValue={height}
              />
            </div>
          </div>
        )}
        {open && (
          <div
            className={cx({
              [styles.plotsWrapper]: sectionKey !== Section.COMPARISON_TABLE,
              [styles.smallPlots]: nbItemsPerRow >= 4
            })}
            style={
              {
                '--nbPerRow': nbItemsPerRow
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
      </details>
      {menuItems.length > 0 && (
        <div className={styles.iconMenu}>
          <IconMenu items={menuItems} />
        </div>
      )}
    </div>
  )
}
