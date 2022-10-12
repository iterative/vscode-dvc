import React from 'react'
import cx from 'classnames'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import {
  ExperimentStatus,
  isQueued
} from 'dvc/src/experiments/webview/contract'
import { Indicator } from './Indicators'
import styles from './styles.module.scss'
import { CellHintTooltip } from './CellHintTooltip'
import { clickAndEnterProps } from '../../../util/props'
import { Clock, StarFull, StarEmpty } from '../../../shared/components/icons'

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
  status?: ExperimentStatus
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

const getTooltipContent = (determiner: boolean, text: string): string =>
  determiner ? `Un${text.toLowerCase()}` : text

export const CellRowActions: React.FC<CellRowActionsProps> = ({
  bulletColor,
  status,
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
        tooltipContent={getTooltipContent(isRowSelected, 'Select')}
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
        tooltipContent={getTooltipContent(!!starred, 'Star')}
      >
        <div
          className={styles.starSwitch}
          role="switch"
          aria-checked={starred}
          tabIndex={0}
          {...clickAndEnterProps(toggleStarred)}
          data-testid="star-icon"
        >
          {starred ? <StarFull /> : <StarEmpty />}
        </div>
      </CellRowAction>
      {isQueued(status) ? (
        <div className={styles.rowActions}>
          <span className={styles.queued}>
            <Clock />
          </span>
        </div>
      ) : (
        <CellRowAction
          showSubRowStates={showSubRowStates}
          subRowsAffected={plotSelections}
          testId={'row-action-plot'}
          tooltipContent={getTooltipContent(!!bulletColor, 'Plot')}
        >
          <span
            className={styles.bullet}
            style={{ color: bulletColor }}
            {...clickAndEnterProps(toggleExperiment)}
          />
        </CellRowAction>
      )}
    </>
  )
}
