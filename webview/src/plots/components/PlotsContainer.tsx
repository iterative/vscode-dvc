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
import styles from './styles.module.scss'
import { IconMenuItemProps } from '../../shared/components/iconMenu/IconMenuItem'
import { sendMessage } from '../../shared/vscode'
import { Add, Trash } from '../../shared/components/icons'
import { MinMaxSlider } from '../../shared/components/slider/MinMaxSlider'
import { PlotsState } from '../store'
import { SectionContainer } from '../../shared/components/sectionContainer/SectionContainer'

export interface PlotsContainerProps {
  sectionCollapsed: boolean
  sectionKey: Section
  title: string
  nbItemsPerRow: number
  changeNbItemsPerRow?: (nb: number) => AnyAction
  addPlotsButton?: { onClick: () => void }
  removePlotsButton?: { onClick: () => void }
  children: React.ReactNode
  hasItems?: boolean
}

export const PlotsContainer: React.FC<PlotsContainerProps> = ({
  sectionCollapsed,
  sectionKey,
  title,
  children,
  nbItemsPerRow,
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
    </SectionContainer>
  )
}
