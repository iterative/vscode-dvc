import React from 'react'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import { ExecutorStatus, isQueued } from 'dvc/src/experiments/webview/contract'
import { CellRowAction } from './CellRowAction'
import { ClickableTooltipContent } from './ClickableTooltipContent'
import { addStarredFilter, openPlotsWebview } from '../../../util/messages'
import styles from '../styles.module.scss'
import { clickAndEnterProps } from '../../../../util/props'
import {
  Clock,
  StarFull,
  StarEmpty,
  GraphScatter
} from '../../../../shared/components/icons'
import { Icon } from '../../../../shared/components/Icon'

export type CellRowActionsProps = {
  isRowSelected: boolean
  plotColor?: string
  showSubRowStates: boolean
  starred?: boolean
  executorStatus?: ExecutorStatus
  subRowStates: {
    plotSelections: number
    selections: number
    stars: number
  }
  toggleExperiment: () => void
  toggleRowSelection: () => void
  toggleStarred: () => void
}

const getTooltipContent = (determiner: boolean, action: string): string =>
  'Click to ' + (determiner ? `un${action}` : action)

export const CellRowActions: React.FC<CellRowActionsProps> = ({
  plotColor,
  executorStatus: status,
  toggleExperiment,
  isRowSelected,
  showSubRowStates,
  starred,
  subRowStates: { plotSelections, selections, stars },
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
          <Icon
            className={styles.plotBox}
            data-testid="plot-icon"
            style={
              plotColor
                ? {
                    backgroundColor: plotColor,
                    fill: 'var(--vscode-editor-foreground)'
                  }
                : {}
            }
            icon={GraphScatter}
          />
        </CellRowAction>
      )}
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
    </>
  )
}
