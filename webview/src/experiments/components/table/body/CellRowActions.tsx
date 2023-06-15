import React, { MouseEventHandler, ReactElement } from 'react'
import {
  VSCodeCheckbox,
  VSCodeProgressRing
} from '@vscode/webview-ui-toolkit/react'
import cx from 'classnames'
import {
  ExperimentStatus,
  isQueued,
  isRunning
} from 'dvc/src/experiments/webview/contract'
import { CellHintTooltip } from './CellHintTooltip'
import { Indicator } from '../Indicators'
import { addStarredFilter, openPlotsWebview } from '../../../util/messages'
import styles from '../styles.module.scss'
import { clickAndEnterProps } from '../../../../util/props'
import {
  Clock,
  StarFull,
  StarEmpty,
  GraphScatter
} from '../../../../shared/components/icons'

export type CellRowActionsProps = {
  isRowSelected: boolean
  plotColor?: string
  showSubRowStates: boolean
  starred?: boolean
  status?: ExperimentStatus
  subRowStates: {
    plotSelections: number
    running: number
    selections: number
    stars: number
  }
  toggleExperiment: () => void
  toggleRowSelection: () => void
  toggleStarred: () => void
}

type CellRowActionProps = {
  showSubRowStates: boolean
  subRowsAffected: number
  children: ReactElement
  testId: string
  tooltipContent: string | ReactElement | null
  onClick?: MouseEventHandler
}

const CellRowAction: React.FC<CellRowActionProps> = ({
  showSubRowStates,
  subRowsAffected,
  children,
  testId,
  tooltipContent,
  onClick
}) => {
  const count = (showSubRowStates && subRowsAffected) || 0

  const action = (
    <div className={styles.rowActions} data-testid={testId}>
      <Indicator onClick={onClick} count={count}>
        {children}
      </Indicator>
    </div>
  )

  return tooltipContent ? (
    <CellHintTooltip tooltipContent={tooltipContent}>{action}</CellHintTooltip>
  ) : (
    action
  )
}

const getTooltipContent = (determiner: boolean, action: string): string =>
  'Click to ' + (determiner ? `un${action}` : action)

const getRunningTooltipContent = (
  running: boolean,
  showSubRowStates: boolean,
  subRowsRunning: number
): string | null => {
  if (running) {
    return 'Experiment is currently running'
  }

  if (showSubRowStates && subRowsRunning) {
    return `There are currently ${subRowsRunning} running under this commit.`
  }

  return null
}

type ClickableTooltipContentProps = {
  clickableText: string
  helperText: string
  onClick: MouseEventHandler
}

const ClickableTooltipContent: React.FC<ClickableTooltipContentProps> = ({
  clickableText,
  helperText,
  onClick
}) => (
  <span>
    {helperText}
    <br />
    <button className={styles.buttonAsLink} onClick={onClick}>
      {clickableText}
    </button>
  </span>
)

export const CellRowActions: React.FC<CellRowActionsProps> = ({
  plotColor,
  status,
  toggleExperiment,
  isRowSelected,
  showSubRowStates,
  starred,
  subRowStates: { plotSelections, running: subRowsRunning, selections, stars },
  toggleRowSelection,
  toggleStarred
}) => {
  const running = isRunning(status)

  return (
    <>
      <CellRowAction
        showSubRowStates={showSubRowStates}
        subRowsAffected={selections}
        testId="row-action-checkbox"
        tooltipContent={getTooltipContent(isRowSelected, 'select the row')}
      >
        <VSCodeCheckbox
          {...clickAndEnterProps(toggleRowSelection)}
          checked={isRowSelected}
        />
      </CellRowAction>
      <CellRowAction
        showSubRowStates={showSubRowStates}
        subRowsAffected={subRowsRunning}
        testId="row-action-running-indicator"
        tooltipContent={getRunningTooltipContent(
          running,
          showSubRowStates,
          subRowsRunning
        )}
      >
        {running ? (
          <VSCodeProgressRing
            className={cx(styles.running, 'chromatic-ignore')}
          />
        ) : (
          <div />
        )}
      </CellRowAction>
      <CellRowAction
        showSubRowStates={showSubRowStates}
        subRowsAffected={stars}
        testId="row-action-star"
        tooltipContent={
          <ClickableTooltipContent
            clickableText="Filter experiments by starred"
            onClick={addStarredFilter}
            helperText={getTooltipContent(!!starred, 'star')}
          />
        }
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
          testId="row-action-plot"
          tooltipContent={
            <ClickableTooltipContent
              clickableText="Open the plots view"
              helperText={getTooltipContent(!!plotColor, 'plot')}
              onClick={openPlotsWebview}
            />
          }
          onClick={toggleExperiment}
        >
          <GraphScatter
            style={{ fill: plotColor }}
            className={styles.plotIcon}
          />
        </CellRowAction>
      )}
    </>
  )
}
