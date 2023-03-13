import cx from 'classnames'
import React, {
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
import { IconMenuItemProps } from '../../shared/components/iconMenu/IconMenuItem'
import { sendMessage } from '../../shared/vscode'
import { Lines, Add, Trash } from '../../shared/components/icons'
import { MinMaxSlider } from '../../shared/components/slider/MinMaxSlider'
import { PlotsState } from '../store'
import { SectionContainer } from '../../shared/components/sectionContainer/SectionContainer'

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
  const ribbonHeight = useSelector((state: PlotsState) => state.ribbon.height)

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

  const toggleSection = () =>
    sendMessage({
      payload: {
        [sectionKey]: !sectionCollapsed
      },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })

  return (
    <SectionContainer
      menuItems={menuItems}
      sectionCollapsed={sectionCollapsed}
      sectionKey={sectionKey}
      title={title}
      onToggleSection={toggleSection}
    >
      {changeNbItemsPerRow && hasItems && maxNbPlotsPerRow > 1 && (
        <div
          className={styles.nbItemsPerRowSlider}
          style={{ top: ribbonHeight - 4 }}
          data-testid="nb-items-per-row-slider"
        >
          <MinMaxSlider
            maximum={-1}
            minimum={-maxNbPlotsPerRow}
            label="Plot Width"
            onChange={handleResize}
            defaultValue={-nbItemsPerRow}
          />
          main
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
    </SectionContainer>
  )
}
