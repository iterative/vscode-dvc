import React, { Dispatch } from 'react'
import {
  PlotSize,
  Section,
  SectionCollapsed
} from 'dvc/src/plots/webview/contract'
import { MetricsPicker } from './MetricsPicker'
import { SizePicker } from './SizePicker'
import styles from './styles.module.scss'
import { AllIcons } from '../../shared/components/icon/Icon'
import { IconMenu } from '../../shared/components/iconMenu/IconMenu'
import {
  CollapsibleSectionsActions,
  PlotsReducerAction
} from '../hooks/useAppReducer'

interface MenuProps {
  metrics: string[]
  selectedMetrics: string[]
  setSelectedPlots: (selectedPlots: string[]) => void
  setSize: (size: PlotSize) => void
  size: PlotSize
}

interface PlotsContainerProps {
  sectionCollapsed: SectionCollapsed
  sectionKey: Section
  dispatch: Dispatch<PlotsReducerAction>
  title: string
  menu?: MenuProps
}

export const PlotsContainer: React.FC<PlotsContainerProps> = ({
  sectionCollapsed,
  sectionKey,
  dispatch,
  title,
  children,
  menu
}) => {
  const open = !sectionCollapsed[sectionKey]
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
