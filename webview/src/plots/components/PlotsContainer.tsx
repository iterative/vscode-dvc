import React, { Dispatch } from 'react'
import { MetricsPicker } from './MetricsPicker'
import { PlotSize, SizePicker } from './SizePicker'
import styles from './styles.module.scss'
import { AllIcons } from '../../shared/components/icon/Icon'
import { IconMenu } from '../../shared/components/iconMenu/IconMenu'
import {
  CollapsibleSectionsActions,
  CollapsibleSectionsState,
  PlotsReducerAction,
  PlotsSectionKeys
} from '../hooks/useAppReducer'

interface MenuProps {
  metrics: string[]
  selectedMetrics: string[]
  setSelectedPlots: (selectedPlots: string[]) => void
  setSize: (size: PlotSize) => void
  size: PlotSize
}

interface PlotsContainerProps {
  collapsedSections: CollapsibleSectionsState
  sectionKey: PlotsSectionKeys
  dispatch: Dispatch<PlotsReducerAction>
  title: string
  menu?: MenuProps
}

export const PlotsContainer: React.FC<PlotsContainerProps> = ({
  collapsedSections,
  sectionKey,
  dispatch,
  title,
  children,
  menu
}) => {
  const open = !collapsedSections[sectionKey]
  return (
    <div className={styles.plotsContainerWrapper}>
      <details open={open} className={styles.plotsContainer}>
        <summary
          onClick={e => {
            e.preventDefault()
            dispatch({
              sectionKey,
              type: CollapsibleSectionsActions.TOGGLE_COLLAPSED
            })
          }}
        >
          {title}
        </summary>
        <div className={styles.centered}>{open && children}</div>
      </details>
      {menu && (
        <div className={styles.iconMenu}>
          <IconMenu
            items={[
              {
                icon: AllIcons.LINES,
                onClickNode: (
                  <MetricsPicker
                    metrics={menu.metrics}
                    setSelectedMetrics={menu.setSelectedPlots}
                    selectedMetrics={menu.selectedMetrics}
                  />
                ),
                tooltip: 'Choose metrics'
              },
              {
                icon: AllIcons.DOTS,
                onClickNode: (
                  <SizePicker
                    currentSize={menu.size}
                    setSelectedSize={menu.setSize as (size: string) => void}
                  />
                ),
                tooltip: 'Resize'
              }
            ]}
          />
        </div>
      )}
    </div>
  )
}
