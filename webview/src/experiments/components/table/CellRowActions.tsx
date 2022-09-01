import React from 'react'
import cx from 'classnames'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import { Indicator } from './Indicators'
import styles from './styles.module.scss'
import { clickAndEnterProps } from '../../../util/props'
import { StarFull, StarEmpty } from '../../../shared/components/icons'
import { pluralize } from '../../../util/strings'
import Tooltip, {
  CELL_TOOLTIP_DELAY
} from '../../../shared/components/tooltip/Tooltip'

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
}

export type CellRowActionProps = {
  showSubRowStates: boolean
  subRowsAffected: number
  actionAppliedLabel: string
  children: React.ReactElement
  hidden?: boolean
  testId?: string
  tooltipContent: string
}

export const CellRowAction: React.FC<CellRowActionProps> = ({
  showSubRowStates,
  subRowsAffected,
  actionAppliedLabel,
  children,
  hidden,
  testId,
  tooltipContent
}) => {
  const count = (showSubRowStates && subRowsAffected) || 0

  return (
    <Tooltip
      content={tooltipContent}
      placement="bottom-end"
      delay={[CELL_TOOLTIP_DELAY, 0]}
    >
      <div
        className={cx(styles.rowActions, hidden && styles.hidden)}
        data-testid={testId}
      >
        <Indicator
          count={count}
          tooltipContent={
            count &&
            `${count} ${pluralize('sub-row', count)} ${actionAppliedLabel}.`
          }
        >
          {children}
        </Indicator>
      </div>
    </Tooltip>
  )
}

export const CellRowActions: React.FC<CellRowActionsProps> = ({
  isRowSelected,
  showSubRowStates,
  starred,
  subRowStates: { selections, stars },
  toggleRowSelection,
  toggleStarred
}) => {
  return (
    <>
      <CellRowAction
        showSubRowStates={showSubRowStates}
        subRowsAffected={selections}
        actionAppliedLabel={'selected'}
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
        actionAppliedLabel={'starred'}
        testId={'row-action-star'}
        tooltipContent={starred ? 'Remove Star' : 'Add Star'}
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
    </>
  )
}
