import React, { Dispatch, useState } from 'react'
import {
  PlotSize,
  Section,
  SectionCollapsed
} from 'dvc/src/plots/webview/contract'
import { MetricsPicker } from './MetricsPicker'
import { SizePicker } from './SizePicker'
import styles from './styles.module.scss'
import { SectionRenamer } from './SectionRenamer'
import { AllIcons } from '../../shared/components/icon/Icon'
import { IconMenu } from '../../shared/components/iconMenu/IconMenu'
import {
  CollapsibleSectionsActions,
  PlotsReducerAction
} from '../hooks/useAppReducer'
import { IconMenuItemProps } from '../../shared/components/iconMenu/IconMenuItem'

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
  const [isRenaming, setIsRenaming] = useState(false)
  const [sectionTitle, setSectionTitle] = useState(title)
  const open = !sectionCollapsed[sectionKey]

  const menuItems: IconMenuItemProps[] = [
    {
      icon: AllIcons.PENCIL,
      onClick: () => setIsRenaming(true),
      tooltip: 'Rename'
    }
  ]

  if (menu) {
    menuItems.push(
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
    )
  }

  const onTitleChanged = (title: string) => {
    setIsRenaming(false)
    setSectionTitle(title)
  }

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
          {isRenaming ? (
            <SectionRenamer
              defaultTitle={sectionTitle}
              onChangeTitle={onTitleChanged}
            />
          ) : (
            sectionTitle
          )}
        </summary>
        <div className={styles.centered}>{open && children}</div>
      </details>
      <div className={styles.iconMenu}>
        <IconMenu items={menuItems} />
      </div>
    </div>
  )
}
