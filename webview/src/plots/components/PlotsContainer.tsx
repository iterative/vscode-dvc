import cx from 'classnames'
import React, { useContext, useEffect, useState } from 'react'
import {
  PlotSize,
  Section,
  SectionCollapsed
} from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { PlotsSizeContext } from './PlotsSizeContext'
import { PlotsPicker, PlotsPickerProps } from './PlotsPicker'
import { SizePicker } from './SizePicker'
import styles from './styles.module.scss'
import { AllIcons, Icon } from '../../shared/components/Icon'
import { IconMenu } from '../../shared/components/iconMenu/IconMenu'
import { IconMenuItemProps } from '../../shared/components/iconMenu/IconMenuItem'
import { sendMessage } from '../../shared/vscode'
import Tooltip from '../../shared/components/tooltip/Tooltip'

export interface PlotsContainerProps {
  sectionCollapsed: SectionCollapsed
  sectionKey: Section
  title: string
  onResize: (size: PlotSize, section: Section) => void
  currentSize: PlotSize
  menu?: PlotsPickerProps
}

export type BasicContainerProps = Pick<
  PlotsContainerProps,
  'onResize' | 'sectionCollapsed'
>

export const SectionDescription = {
  // "Trends"
  [Section.CHECKPOINT_PLOTS]:
    'Real-time plots based on metrics from the Experiments Table',
  // "Images"
  [Section.COMPARISON_TABLE]:
    'Displays image plots side by side across experiments.',
  // "Data Series"
  [Section.TEMPLATE_PLOTS]:
    'Plots of JSON, YAML, CSV, or TSV files, visualized using `dvc plots` templates'
}

const InfoIcon = () => (
  <Icon
    icon={AllIcons.INFO}
    width={16}
    height={16}
    className={styles.infoIcon}
  />
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
  const { changePlotsSizes } = useContext(PlotsSizeContext)

  const open = !sectionCollapsed[sectionKey]

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
    onResize(newSize, sectionKey)
    changePlotsSizes?.(newSize, sectionKey)
    setSize(newSize)
  }
  const menuItems: IconMenuItemProps[] = [
    {
      icon: AllIcons.DOTS,
      onClickNode: (
        <SizePicker currentSize={size} setSelectedSize={changeSize} />
      ),
      tooltip: 'Resize'
    }
  ]

  if (menu) {
    menuItems.unshift({
      icon: AllIcons.LINES,
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

  return (
    <div className={styles.plotsContainerWrapper}>
      <details open={open} className={styles.plotsContainer}>
        <summary
          onClick={e => {
            e.preventDefault()
            sendMessage({
              payload: {
                [sectionKey]: !sectionCollapsed[sectionKey]
              },
              type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
            })
          }}
        >
          <Icon
            icon={open ? AllIcons.CHEVRON_DOWN : AllIcons.CHEVRON_RIGHT}
            data-testid="plots-container-details-chevron"
            width={20}
            height={20}
            className={styles.detailsIcon}
          />

          {title}
          <Tooltip content={tooltipContent} placement="bottom-end">
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
