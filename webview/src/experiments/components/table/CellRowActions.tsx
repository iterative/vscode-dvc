import React, { MouseEventHandler } from 'react'
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
  bulletColor?: string
  isRowSelected: boolean
  showSubRowStates: boolean
  starred?: boolean
  status?: ExperimentStatus
  subRowStates: {
    selections: number
    stars: number
    plotSelections: number
  }
  toggleExperiment: () => void
  toggleRowSelection: () => void
  toggleStarred: () => void
}

export type CellRowActionProps = {
  showSubRowStates: boolean
  subRowsAffected: number
  children: React.ReactElement
  hidden?: boolean
  testId?: string
  tooltipContent: string
  queued?: boolean
  onClick?: MouseEventHandler
}

export const CellRowAction: React.FC<CellRowActionProps> = ({
  showSubRowStates,
  subRowsAffected,
  children,
  hidden,
  testId,
  tooltipContent,
  onClick
}) => {
  const count = (showSubRowStates && subRowsAffected) || 0

  return (
    <CellHintTooltip tooltipContent={tooltipContent}>
      <div
        className={cx(styles.rowActions, hidden && styles.hidden)}
        data-testid={testId}
      >
        <Indicator onClick={onClick} count={count}>
          {children}
        </Indicator>
      </div>
    </CellHintTooltip>
  )
}

const getTooltipContent = (
  determiner: boolean,
  action: string,
  helperText?: string
): string =>
  'Click to ' +
  (determiner ? `un${action}` : action) +
  (helperText ? `\n${helperText}` : '')

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
        tooltipContent={getTooltipContent(isRowSelected, 'select the row')}
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
        tooltipContent={getTooltipContent(
          !!starred,
          'star',
          'To filter by stars click the star icon above the filters tree\nor use "DVC: Filter Experiments Table to Starred" from the command palette.'
        )}
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
          tooltipContent={getTooltipContent(
            !!bulletColor,
            'plot',
            'To open the plots view click the plot icon in the top left corner\nor use "DVC: Show Plots" from the command palette.'
          )}
          onClick={toggleExperiment}
        >
          <span className={styles.bullet} style={{ color: bulletColor }} />
        </CellRowAction>
      )}
    </>
  )
}
