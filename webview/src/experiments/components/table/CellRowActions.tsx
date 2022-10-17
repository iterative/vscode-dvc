import React, { MouseEventHandler } from 'react'
import cx from 'classnames'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import {
  ExperimentStatus,
  isQueued
} from 'dvc/src/experiments/webview/contract'
import { Indicator } from './Indicators'
import styles from './styles.module.scss'
import { CellHintTooltip } from './CellHintTooltip'
import { sendMessage } from '../../../shared/vscode'
import { clickAndEnterProps } from '../../../util/props'
import { Clock, StarFull, StarEmpty } from '../../../shared/components/icons'

export type CellRowActionsProps = {
  isWorkspace: boolean
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
  tooltipOffset?: [number, number]
  showSubRowStates: boolean
  subRowsAffected: number
  children: React.ReactElement
  hidden?: boolean
  testId?: string
  tooltipContent: string | React.ReactElement
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
  tooltipOffset,
  onClick
}) => {
  const count = (showSubRowStates && subRowsAffected) || 0

  return (
    <CellHintTooltip
      tooltipContent={tooltipContent}
      tooltipOffset={tooltipOffset}
    >
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

const getTooltipContent = (determiner: boolean, action: string): string =>
  'Click to ' + (determiner ? `un${action}` : action)

export const CellRowActions: React.FC<CellRowActionsProps> = ({
  bulletColor,
  isWorkspace,
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
        tooltipContent={
          <span>
            {getTooltipContent(!!starred, 'star')}
            <br />
            <button
              className={styles.buttonAsLink}
              onClick={() =>
                sendMessage({
                  type: MessageFromWebviewType.ADD_STARRED_EXPERIMENT_FILTER
                })
              }
            >
              Filter experiments by starred
            </button>
          </span>
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
          testId={'row-action-plot'}
          tooltipOffset={isWorkspace ? [0, -16] : undefined}
          tooltipContent={
            <span>
              {getTooltipContent(!!bulletColor, 'plot')}
              <br />
              <button
                className={styles.buttonAsLink}
                onClick={() =>
                  sendMessage({
                    type: MessageFromWebviewType.OPEN_PLOTS_WEBVIEW
                  })
                }
              >
                Open the plots view
              </button>
            </span>
          }
          onClick={toggleExperiment}
        >
          <span className={styles.bullet} style={{ color: bulletColor }} />
        </CellRowAction>
      )}
    </>
  )
}
