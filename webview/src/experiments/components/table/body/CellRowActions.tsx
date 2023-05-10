import React, { MouseEventHandler, ReactElement } from 'react'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import {
  ExperimentStatus,
  isQueued
} from 'dvc/src/experiments/webview/contract'
import { CellHintTooltip } from './CellHintTooltip'
import { Indicator } from '../Indicators'
import { addStarredFilter, openPlotsWebview } from '../../../util/messages'
import styles from '../styles.module.scss'
import { clickAndEnterProps } from '../../../../util/props'
import { Clock, StarFull, StarEmpty } from '../../../../shared/components/icons'

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

type CellRowActionProps = {
  showSubRowStates: boolean
  subRowsAffected: number
  children: ReactElement
  testId: string
  tooltipContent: string | ReactElement
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

  return (
    <CellHintTooltip tooltipContent={tooltipContent}>
      <div className={styles.rowActions} data-testid={testId}>
        <Indicator onClick={onClick} count={count}>
          {children}
        </Indicator>
      </div>
    </CellHintTooltip>
  )
}

const getTooltipContent = (determiner: boolean, action: string): string =>
  'Click to ' + (determiner ? `un${action}` : action)

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
              helperText={getTooltipContent(!!bulletColor, 'plot')}
              onClick={openPlotsWebview}
            />
          }
          onClick={toggleExperiment}
        >
          <span className={styles.bullet} style={{ color: bulletColor }} />
        </CellRowAction>
      )}
    </>
  )
}
