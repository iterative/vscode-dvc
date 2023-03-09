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
import { Section } from 'dvc/src/plots/webview/contract'
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

export interface PlotsContainerProps {
  sectionCollapsed: boolean
  sectionKey: Section
  title: string
  nbItemsPerRow: number
  changeNbItemsPerRow?: (nb: number) => AnyAction
  menu?: PlotsPickerProps
  addPlotsButton?: { onClick: () => void }
  removePlotsButton?: { onClick: () => void }
  children: React.ReactNode
  hasItems?: boolean
}

export const SectionDescription = {
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
  menu,
  addPlotsButton,
  removePlotsButton,
  changeNbItemsPerRow,
  hasItems
}) => {
  const open = !sectionCollapsed
  const dispatch = useDispatch()
  const maxNbPlotsPerRow = useSelector(
    (state: PlotsState) => state.webview.maxNbPlotsPerRow
  )

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [nbItemsPerRow])

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
    (nbItems: number) => {
      if (changeNbItemsPerRow) {
        const positiveNbItems = Math.abs(nbItems)
        dispatch(changeNbItemsPerRow(positiveNbItems))
        sendMessage({
          payload: {
            height: undefined,
            nbItemsPerRow: positiveNbItems,
            section: sectionKey
          },
          type: MessageFromWebviewType.RESIZE_PLOTS
        })
      }
    },
    [dispatch, changeNbItemsPerRow, sectionKey]
  )

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
        {changeNbItemsPerRow && hasItems && maxNbPlotsPerRow > 1 && (
          <div
            className={styles.nbItemsPerRowSlider}
            data-testid="nb-items-per-row-slider"
          >
            <MinMaxSlider
              maximum={-1}
              minimum={-maxNbPlotsPerRow}
              label="Plot Width"
              onChange={handleResize}
              defaultValue={-nbItemsPerRow}
            />
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
