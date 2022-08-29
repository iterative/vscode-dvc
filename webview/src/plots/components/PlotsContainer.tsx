import cx from 'classnames'
import React, { MouseEvent, useEffect, useState } from 'react'
import { PlotSize, Section } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { PlotsPicker, PlotsPickerProps } from './PlotsPicker'
import { SizePicker } from './SizePicker'
import styles from './styles.module.scss'
import { Icon } from '../../shared/components/Icon'
import { IconMenu } from '../../shared/components/iconMenu/IconMenu'
import { IconMenuItemProps } from '../../shared/components/iconMenu/IconMenuItem'
import { sendMessage } from '../../shared/vscode'
import Tooltip from '../../shared/components/tooltip/Tooltip'
import {
  ChevronDown,
  ChevronRight,
  Dots,
  Info,
  Lines
} from '../../shared/components/icons'
import { isSelecting } from '../../util/strings'

export interface CommonPlotsContainerProps {
  onResize: (size: PlotSize) => void
}

export interface PlotsContainerProps extends CommonPlotsContainerProps {
  sectionCollapsed: boolean
  sectionKey: Section
  title: string
  currentSize: PlotSize
  menu?: PlotsPickerProps
  children: React.ReactNode
}

export const SectionDescription = {
  // "Trends"
  [Section.CHECKPOINT_PLOTS]: (
    <span>Real-time plots based on metrics from the Experiments Table</span>
  ),
  // "Images"
  [Section.COMPARISON_TABLE]: (
    <span>Displays image plots side by side across experiments.</span>
  ),
  // "Data Series"
  [Section.TEMPLATE_PLOTS]: (
    <span>
      Plots of JSON, YAML, CSV, or TSV files, visualized using `dvc plots`
      templates
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
  onResize,
  currentSize,
  menu
}) => {
  const [size, setSize] = useState<PlotSize>(currentSize)

  const open = !sectionCollapsed

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [size])

  const sizeClass = cx({
    [styles.plotsWrapper]: sectionKey !== Section.COMPARISON_TABLE,
    [styles.smallPlots]: size === PlotSize.SMALL,
    [styles.regularPlots]: size === PlotSize.REGULAR,
    [styles.largePlots]: size === PlotSize.LARGE
  })

  const changeSize = (newSize: PlotSize) => {
    if (size === newSize) {
      return
    }
    sendMessage({
      payload: { section: sectionKey, size: newSize },
      type: MessageFromWebviewType.RESIZE_PLOTS
    })
    onResize(newSize)
    setSize(newSize)
  }
  const menuItems: IconMenuItemProps[] = [
    {
      icon: Dots,
      onClickNode: (
        <SizePicker currentSize={size} setSelectedSize={changeSize} />
      ),
      tooltip: 'Resize'
    }
  ]

  if (menu) {
    menuItems.unshift({
      icon: Lines,
      onClickNode: <PlotsPicker {...menu} />,
      tooltip: 'Select Plots'
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
    if (isSelecting([title, SectionDescription[sectionKey].props.children])) {
      return
    }
    sendMessage({
      payload: {
        [sectionKey]: !sectionCollapsed
      },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })
  }

  return (
    <div className={styles.plotsContainerWrapper} data-testid="plots-container">
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
        <div>
          {open && (
            <div className={sizeClass} data-testid="plots-wrapper">
              {children}
            </div>
          )}
        </div>
      </details>
      <div className={styles.iconMenu}>
        <IconMenu items={menuItems} />
      </div>
    </div>
  )
}
