import React from 'react'
import cx from 'classnames'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import { Indicator, IndicatorWithJustTheCounter } from './Indicators'
import styles from './styles.module.scss'
import { CellHintTooltip } from './CellHintTooltip'
import { clickAndEnterProps } from '../../../util/props'
import {
  Clock,
  Eye,
  EyeClosed,
  StarFull,
  StarEmpty
} from '../../../shared/components/icons'

export type CellRowActionsProps = {
  isRowSelected: boolean
  showSubRowStates: boolean
  starred?: boolean
  subRowStates: {
    selections: number
    stars: number
    plotSelections: number
  }
  toggleRowSelection: () => void
  toggleStarred: () => void
  bulletColor?: string
  toggleExperiment: () => void
  queued?: boolean
}

export type CellRowActionProps = {
  showSubRowStates: boolean
  subRowsAffected: number
  children: React.ReactElement
  hidden?: boolean
  testId?: string
  tooltipContent: string
  queued?: boolean
}

export const CellRowAction: React.FC<CellRowActionProps> = ({
  showSubRowStates,
  subRowsAffected,
  children,
  hidden,
  testId,
  tooltipContent
}) => {
  const count = (showSubRowStates && subRowsAffected) || 0

  return (
    <CellHintTooltip tooltipContent={tooltipContent}>
      <div
        className={cx(styles.rowActions, hidden && styles.hidden)}
        data-testid={testId}
      >
        <Indicator count={count}>{children}</Indicator>
      </div>
    </CellHintTooltip>
  )
}

const PlotIndicator: React.FC<{
  bulletColor?: string
  plotSelections: number
  queued?: boolean
  toggleExperiment: () => void
}> = ({ bulletColor, plotSelections, queued, toggleExperiment }) => (
  <CellHintTooltip tooltipContent={bulletColor ? 'Unplot' : 'Plot'}>
    <div
      className={cx(styles.rowActions, styles.plotEye)}
      {...clickAndEnterProps(toggleExperiment)}
    >
      <IndicatorWithJustTheCounter count={plotSelections}>
        {!queued && bulletColor ? <Eye /> : <EyeClosed />}
      </IndicatorWithJustTheCounter>
      <span className={styles.bullet} style={{ color: bulletColor }}>
        {queued && <Clock />}
      </span>
    </div>
  </CellHintTooltip>
)

export const CellRowActions: React.FC<CellRowActionsProps> = ({
  bulletColor,
  queued,
  toggleExperiment,
  isRowSelected,
  showSubRowStates,
  starred,
  subRowStates: { selections, stars, plotSelections },
  toggleRowSelection,
  toggleStarred
}) => {
  return (
    <>
      <CellRowAction
        showSubRowStates={showSubRowStates}
        subRowsAffected={selections}
        testId={'row-action-checkbox'}
        tooltipContent={isRowSelected ? 'Unselect' : 'Select'}
      >
        <VSCodeCheckbox
          {...clickAndEnterProps(toggleRowSelection)}
          checked={isRowSelected}
        />
      </CellRowAction>
      <CellRowAction
        showSubRowStates={showSubRowStates}
        subRowsAffected={stars}
        testId={'row-action-star'}
        tooltipContent={starred ? 'Star' : 'Unstar'}
      >
        <div
          className={styles.starSwitch}
          role="switch"
          aria-checked={starred}
          tabIndex={0}
          {...clickAndEnterProps(toggleStarred)}
          data-testid="star-icon"
        >
          {starred && <StarFull />}
          {!starred && <StarEmpty />}
        </div>
      </CellRowAction>
      <PlotIndicator
        bulletColor={bulletColor}
        plotSelections={plotSelections}
        queued={queued}
        toggleExperiment={toggleExperiment}
      />
    </>
  )
}
